"""
SQLite database models and session management.

Single-file DB layer. All models use SQLAlchemy ORM with a local
mindbridge.db file. The database is created and seeded on first run.
"""

import json
from sqlalchemy import create_engine, Column, String, Integer, Boolean, Text, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

DATABASE_URL = "sqlite:///mindbridge.db"

engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()


# ── Models ─────────────────────────────────────────────────────

class Setting(Base):
    __tablename__ = "settings"
    key = Column(String, primary_key=True)
    value = Column(Text, nullable=False)


class Patient(Base):
    __tablename__ = "patients"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    initials = Column(String(2), nullable=False)
    status = Column(String, nullable=False, default="new")
    last_active = Column(String, default="Not yet active")
    summary = Column(Text, default="")
    recommendation = Column(Text, default="")

    # Agent config stored as JSON (null = unconfigured)
    agent_config = Column(Text, nullable=True)

    messages = relationship("Message", back_populates="patient", order_by="Message.id")
    signals = relationship("Signal", back_populates="patient")

    def get_agent(self) -> dict | None:
        if self.agent_config is None:
            return None
        return json.loads(self.agent_config)

    def set_agent(self, config: dict | None):
        self.agent_config = json.dumps(config) if config else None

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "initials": self.initials,
            "status": self.status,
            "lastActive": self.last_active,
            "summary": self.summary,
            "recommendation": self.recommendation,
            "agent": self.get_agent(),
            "messages": [m.to_dict() for m in self.messages],
        }


class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False)
    from_role = Column(String, nullable=False)  # 'patient' or 'agent'
    text = Column(Text, nullable=False)
    time = Column(String, nullable=False)
    date = Column(String, nullable=False)
    flagged = Column(Boolean, default=False)

    patient = relationship("Patient", back_populates="messages")

    def to_dict(self) -> dict:
        return {
            "from": self.from_role,
            "text": self.text,
            "time": self.time,
            "date": self.date,
            "flagged": self.flagged,
        }


class Signal(Base):
    __tablename__ = "signals"
    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False)
    patient_name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # critical, warning, positive, info
    text = Column(String, nullable=False)
    detail = Column(Text, default="")
    time = Column(String, nullable=False)
    date = Column(String, nullable=False)
    acknowledged = Column(Boolean, default=False)

    patient = relationship("Patient", back_populates="signals")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "patientId": self.patient_id,
            "patientName": self.patient_name,
            "type": self.type,
            "text": self.text,
            "detail": self.detail,
            "time": self.time,
            "date": self.date,
            "acknowledged": self.acknowledged,
        }


class BoundaryAudit(Base):
    """Log of boundary enforcement checks on agent responses."""
    __tablename__ = "boundary_audits"
    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False)
    patient_name = Column(String, nullable=False)
    boundary = Column(Text, nullable=False)
    agent_response = Column(Text, nullable=False)
    verdict = Column(String, nullable=False)  # 'pass' or 'violation'
    explanation = Column(Text, default="")
    action_taken = Column(String, nullable=False)  # 'none', 'regenerated', 'fallback'
    time = Column(String, nullable=False)
    date = Column(String, nullable=False)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "patientId": self.patient_id,
            "patientName": self.patient_name,
            "boundary": self.boundary,
            "agentResponse": self.agent_response[:120] + ("..." if len(self.agent_response) > 120 else ""),
            "verdict": self.verdict,
            "explanation": self.explanation,
            "actionTaken": self.action_taken,
            "time": self.time,
            "date": self.date,
        }


class Appointment(Base):
    __tablename__ = "appointments"
    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False)
    patient_name = Column(String, nullable=False)
    initials = Column(String(2), nullable=False)
    patient_status = Column(String, nullable=False)
    type = Column(String, nullable=False)
    date = Column(String, nullable=False)
    start_time = Column(String, nullable=False)
    end_time = Column(String, nullable=False)
    status = Column(String, nullable=False, default="upcoming")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "patientId": self.patient_id,
            "patientName": self.patient_name,
            "initials": self.initials,
            "patientStatus": self.patient_status,
            "type": self.type,
            "date": self.date,
            "startTime": self.start_time,
            "endTime": self.end_time,
            "status": self.status,
        }


# ── DB lifecycle ───────────────────────────────────────────────

def init_db():
    """Create tables if they don't exist."""
    Base.metadata.create_all(engine)


def get_db():
    """FastAPI dependency — yields a session, closes after request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
