"""
MindBridge API server.

    cd backend
    pip install -r requirements.txt
    python seed.py          # first run only
    uvicorn main:app --reload --port 8000
"""

import json
from datetime import datetime

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from db import init_db, get_db, Patient, Message, Signal, Appointment, Setting
from llm import llm
from prompts import assemble_system_prompt

app = FastAPI(title="MindBridge API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()


# ── Schemas ────────────────────────────────────────────────────

class PatientCreate(BaseModel):
    name: str
    note: str = ""

class AgentConfigUpdate(BaseModel):
    templateId: str
    label: str
    tone: dict
    styles: list[str]
    boundaries: list[str]

class MasterPromptUpdate(BaseModel):
    prompt: str

class ChatMessage(BaseModel):
    text: str


# ── Helpers ────────────────────────────────────────────────────

def patient_to_dict(p: Patient) -> dict:
    return {
        "id": p.id,
        "name": p.name,
        "initials": p.initials,
        "status": p.status,
        "lastActive": p.last_active,
        "summary": p.summary,
        "recommendation": p.recommendation,
        "agent": p.get_agent(),
        "messages": [
            {
                "from": m.from_role,
                "text": m.text,
                "time": m.time,
                "date": m.date,
                "flagged": m.flagged,
            }
            for m in p.messages
        ],
    }


def signal_to_dict(s: Signal) -> dict:
    return {
        "id": s.id,
        "patientId": s.patient_id,
        "patientName": s.patient_name,
        "type": s.type,
        "text": s.text,
        "detail": s.detail,
        "time": s.time,
        "date": s.date,
        "acknowledged": s.acknowledged,
    }


def appointment_to_dict(a: Appointment) -> dict:
    return {
        "id": a.id,
        "patientId": a.patient_id,
        "patientName": a.patient_name,
        "initials": a.initials,
        "patientStatus": a.patient_status,
        "type": a.type,
        "date": a.date,
        "startTime": a.start_time,
        "endTime": a.end_time,
        "status": a.status,
    }


def derive_initials(name: str) -> str:
    return "".join(w[0] for w in name.strip().split()).upper()[:2]


# ── Patients ───────────────────────────────────────────────────

@app.get("/api/patients")
def list_patients(db: Session = Depends(get_db)):
    patients = db.query(Patient).all()
    return [patient_to_dict(p) for p in patients]


@app.get("/api/patients/{patient_id}")
def get_patient(patient_id: str, db: Session = Depends(get_db)):
    p = db.query(Patient).filter(Patient.id == patient_id).first()
    if not p:
        raise HTTPException(404, "Patient not found")
    return patient_to_dict(p)


@app.post("/api/patients", status_code=201)
def create_patient(body: PatientCreate, db: Session = Depends(get_db)):
    pid = body.name.lower().replace(" ", "_") + "_" + hex(int(datetime.now().timestamp()))[2:]
    patient = Patient(
        id=pid,
        name=body.name,
        initials=derive_initials(body.name),
        status="new",
        last_active="Not yet active",
        summary=body.note or f"{body.name} was added. No sessions recorded yet.",
        recommendation="Configure a sub-agent before the first automated check-in.",
    )
    db.add(patient)
    db.commit()
    return patient_to_dict(patient)


@app.put("/api/patients/{patient_id}/agent")
def update_agent(patient_id: str, body: AgentConfigUpdate, db: Session = Depends(get_db)):
    p = db.query(Patient).filter(Patient.id == patient_id).first()
    if not p:
        raise HTTPException(404, "Patient not found")
    p.set_agent(body.model_dump())
    db.commit()
    return patient_to_dict(p)


# ── Master Prompt ──────────────────────────────────────────────

@app.get("/api/master-prompt")
def get_master_prompt(db: Session = Depends(get_db)):
    s = db.query(Setting).filter(Setting.key == "master_prompt").first()
    return {"prompt": s.value if s else ""}


@app.put("/api/master-prompt")
def update_master_prompt(body: MasterPromptUpdate, db: Session = Depends(get_db)):
    s = db.query(Setting).filter(Setting.key == "master_prompt").first()
    if s:
        s.value = body.prompt
    else:
        db.add(Setting(key="master_prompt", value=body.prompt))
    db.commit()
    return {"prompt": body.prompt}


# ── Chat (the core pipeline) ──────────────────────────────────

@app.post("/api/chat/{patient_id}")
def chat(patient_id: str, body: ChatMessage, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(404, "Patient not found")

    agent = patient.get_agent()
    if not agent:
        raise HTTPException(400, "No agent configured for this patient")

    # Get master prompt
    setting = db.query(Setting).filter(Setting.key == "master_prompt").first()
    master_prompt = setting.value if setting else ""

    # Get recent signals for context
    recent_signals = (
        db.query(Signal)
        .filter(Signal.patient_id == patient_id)
        .order_by(Signal.id.desc())
        .limit(5)
        .all()
    )

    # ── Assemble the system prompt (prompt hierarchy in action) ──
    system_prompt = assemble_system_prompt(
        master_prompt=master_prompt,
        template_id=agent["templateId"],
        tone=agent["tone"],
        styles=agent["styles"],
        boundaries=agent["boundaries"],
        patient_name=patient.name,
        patient_summary=patient.summary,
        recent_signals=[
            {"type": s.type, "text": s.text, "detail": s.detail}
            for s in recent_signals
        ],
    )

    # Build conversation history for the LLM
    conversation = [
        {
            "role": "user" if m.from_role == "patient" else "assistant",
            "content": m.text,
        }
        for m in patient.messages
    ]
    # Append the new message
    conversation.append({"role": "user", "content": body.text})

    # ── Generate response ──
    now = datetime.now()
    time_str = now.strftime("%-I:%M %p")
    date_str = "Today"

    response_text = llm.generate(system_prompt, conversation)

    # Save patient message
    db.add(Message(
        patient_id=patient_id,
        from_role="patient",
        text=body.text,
        time=time_str,
        date=date_str,
    ))

    # Save agent response
    db.add(Message(
        patient_id=patient_id,
        from_role="agent",
        text=response_text,
        time=time_str,
        date=date_str,
    ))

    # Update last active
    patient.last_active = f"Today, {time_str}"
    db.commit()

    return {
        "response": response_text,
        "systemPrompt": system_prompt,  # exposed for debugging — remove in prod
    }


# ── Signals ────────────────────────────────────────────────────

@app.get("/api/signals")
def list_signals(db: Session = Depends(get_db)):
    signals = db.query(Signal).order_by(Signal.id.desc()).all()
    return [signal_to_dict(s) for s in signals]


@app.put("/api/signals/{signal_id}/acknowledge")
def acknowledge_signal(signal_id: int, db: Session = Depends(get_db)):
    s = db.query(Signal).filter(Signal.id == signal_id).first()
    if not s:
        raise HTTPException(404, "Signal not found")
    s.acknowledged = True
    db.commit()
    return signal_to_dict(s)


# ── Appointments ───────────────────────────────────────────────

@app.get("/api/appointments")
def list_appointments(date: str | None = None, db: Session = Depends(get_db)):
    q = db.query(Appointment)
    if date:
        q = q.filter(Appointment.date == date)
    return [appointment_to_dict(a) for a in q.order_by(Appointment.date, Appointment.start_time).all()]
