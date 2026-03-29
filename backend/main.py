"""
MindBridge API server (FastAPI).

Endpoints:
    GET/POST  /api/patients              — list or create patients
    GET       /api/patients/{id}         — single patient with messages
    PUT       /api/patients/{id}/agent   — update agent config (template, tone, etc.)
    GET/PUT   /api/master-prompt         — therapist's global base instructions
    POST      /api/chat/{patient_id}     — core pipeline: assemble prompt -> call LLM -> persist
    GET       /api/signals               — all signals (sorted newest-first)
    PUT       /api/signals/{id}/acknowledge
    GET       /api/appointments          — optionally filtered by ?date=YYYY-MM-DD

Run:
    cd backend
    pip install -r requirements.txt
    python seed.py          # first run only
    uvicorn main:app --reload --port 8000
"""

from dotenv import load_dotenv
load_dotenv()

import json
import logging
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from db import init_db, get_db, Patient, Message, Signal, Appointment, Setting
from llm import llm
from prompts import assemble_system_prompt

log = logging.getLogger("mindbridge")

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

def get_or_404(db: Session, model, **filters):
    """Query a single row or raise 404."""
    obj = db.query(model).filter_by(**filters).first()
    if not obj:
        raise HTTPException(404, f"{model.__name__} not found")
    return obj


def commit(db: Session):
    """Commit and handle database errors."""
    try:
        db.commit()
    except SQLAlchemyError as e:
        db.rollback()
        log.error("Database commit failed: %s", e)
        raise HTTPException(500, "Database error")


def derive_initials(name: str) -> str:
    return "".join(w[0] for w in name.strip().split()).upper()[:2]


# ── Default agent for unconfigured patients ───────────────────

DEFAULT_AGENT = {
    "templateId": "anchor",
    "label": "Steady anchor",
    "tone": {"warmth": 7, "directness": 4, "verbosity": 5},
    "styles": ["Active listening", "Emotion validation"],
    "boundaries": ["Escalate crisis signals to therapist immediately"],
}


# ── Signal extraction prompt ───────────────────────────────────

SIGNAL_EXTRACTION_PROMPT = """\
You are a clinical signal extraction system for a therapist dashboard.
Analyze the patient's latest message and the agent's response for clinically
relevant signals. Return a JSON array (may be empty) of signal objects.

Signal categories:
- "critical": Imminent risk markers — self-harm language, suicidal ideation, \
  harm to others, acute crisis escalation. These demand immediate therapist attention.
- "warning": Behavioral pattern shifts — sleep deterioration, substance nostalgia, \
  social withdrawal, escalating avoidance, perfectionism deepening.
- "positive": Therapeutic milestones — self-identified patterns, increased \
  engagement, coping strategy use, emotional regulation improvement.
- "info": Neutral observations — milestone dates, engagement frequency changes, \
  new topics introduced.

Only flag signals that are clinically meaningful. Most exchanges produce no signals.

Return ONLY a JSON array, no other text. Each object must have:
{"type": "critical|warning|positive|info", "text": "short summary", "detail": "supporting quote or context"}

Example: [{"type": "warning", "text": "Sleep deterioration reported", "detail": "Two consecutive nights of 2-3 hours."}]
If nothing is signal-worthy, return: []"""


def extract_signals(patient_message: str, agent_response: str, patient_name: str,
                    patient_id: str, db, time_str: str, date_str: str):
    """Run a secondary LLM call to extract clinical signals from the exchange.

    Fails silently — signal extraction must never break the chat flow.
    """
    try:
        extraction_messages = [
            {"role": "user", "content": (
                f"Patient ({patient_name}) said: \"{patient_message}\"\n\n"
                f"Agent responded: \"{agent_response}\"\n\n"
                "Extract any clinical signals as a JSON array."
            )}
        ]
        raw = llm.generate(SIGNAL_EXTRACTION_PROMPT, extraction_messages)

        # Parse JSON — handle markdown code fences the LLM might wrap it in
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[-1].rsplit("```", 1)[0].strip()

        signals = json.loads(cleaned)

        if not isinstance(signals, list):
            log.warning("Signal extraction returned non-list: %s", type(signals))
            return

        for sig in signals:
            if not isinstance(sig, dict):
                continue
            sig_type = sig.get("type", "info")
            if sig_type not in ("critical", "warning", "positive", "info"):
                sig_type = "info"
            db.add(Signal(
                patient_id=patient_id,
                patient_name=patient_name,
                type=sig_type,
                text=sig.get("text", "Signal detected"),
                detail=sig.get("detail", ""),
                time=time_str,
                date=date_str,
            ))
        if signals:
            commit(db)
            log.info("Extracted %d signal(s) for patient %s", len(signals), patient_id)

    except json.JSONDecodeError as e:
        log.warning("Signal extraction JSON parse failed for %s: %s (raw: %s)",
                    patient_id, e, raw[:200] if 'raw' in dir() else "N/A")
    except Exception as e:
        log.warning("Signal extraction failed for %s: %s", patient_id, e)


# ── Patients ───────────────────────────────────────────────────

@app.get("/api/patients")
def list_patients(db: Session = Depends(get_db)):
    return [p.to_dict() for p in db.query(Patient).all()]


@app.get("/api/patients/{patient_id}")
def get_patient(patient_id: str, db: Session = Depends(get_db)):
    return get_or_404(db, Patient, id=patient_id).to_dict()


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
    commit(db)
    return patient.to_dict()


@app.put("/api/patients/{patient_id}/agent")
def update_agent(patient_id: str, body: AgentConfigUpdate, db: Session = Depends(get_db)):
    p = get_or_404(db, Patient, id=patient_id)
    p.set_agent(body.model_dump())
    commit(db)
    return p.to_dict()


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
    commit(db)
    return {"prompt": body.prompt}


# ── Chat (the core pipeline) ──────────────────────────────────

@app.post("/api/chat/{patient_id}")
def chat(patient_id: str, body: ChatMessage, db: Session = Depends(get_db)):
    patient = get_or_404(db, Patient, id=patient_id)
    agent = patient.get_agent() or DEFAULT_AGENT

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
        {"role": "user" if m.from_role == "patient" else "assistant", "content": m.text}
        for m in patient.messages
    ]
    conversation.append({"role": "user", "content": body.text})

    # ── Generate response ──
    try:
        response_text = llm.generate(system_prompt, conversation)
    except Exception as e:
        log.error("LLM generation failed for patient %s: %s", patient_id, e)
        raise HTTPException(503, "AI service temporarily unavailable")

    now = datetime.now()
    time_str = now.strftime("%-I:%M %p")
    date_str = "Today"

    # Persist both messages
    db.add(Message(patient_id=patient_id, from_role="patient", text=body.text, time=time_str, date=date_str))
    db.add(Message(patient_id=patient_id, from_role="agent", text=response_text, time=time_str, date=date_str))
    patient.last_active = f"Today, {time_str}"
    commit(db)

    # ── Extract clinical signals (non-blocking — never breaks chat) ──
    extract_signals(
        patient_message=body.text,
        agent_response=response_text,
        patient_name=patient.name,
        patient_id=patient_id,
        db=db,
        time_str=time_str,
        date_str=date_str,
    )

    return {
        "response": response_text,
    }


# ── Signals ────────────────────────────────────────────────────

@app.get("/api/signals")
def list_signals(db: Session = Depends(get_db)):
    return [s.to_dict() for s in db.query(Signal).order_by(Signal.id.desc()).all()]


@app.put("/api/signals/{signal_id}/acknowledge")
def acknowledge_signal(signal_id: int, db: Session = Depends(get_db)):
    s = get_or_404(db, Signal, id=signal_id)
    s.acknowledged = True
    commit(db)
    return s.to_dict()


# ── Appointments ───────────────────────────────────────────────

@app.get("/api/appointments")
def list_appointments(date: str | None = None, db: Session = Depends(get_db)):
    q = db.query(Appointment)
    if date:
        q = q.filter(Appointment.date == date)
    return [a.to_dict() for a in q.order_by(Appointment.date, Appointment.start_time).all()]


# ── Static frontend (Docker production build) ─────────────────

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"

if STATIC_DIR.is_dir():
    app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")

    @app.get("/{path:path}")
    def serve_spa(path: str):
        """Serve the React SPA — all non-API routes fall through to index.html."""
        file = STATIC_DIR / path
        if file.is_file():
            return FileResponse(file)
        return FileResponse(STATIC_DIR / "index.html")
