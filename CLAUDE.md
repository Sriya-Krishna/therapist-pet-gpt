# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MindBridge is an AI-assisted mental wellness platform prototype. A therapist configures AI sub-agents per patient (personality, tone, boundaries). The AI mediates patient conversations, generates summaries, and surfaces signals to the therapist. The AI never provides clinical solutions — its behavior is entirely shaped by the therapist.

## Commands

### Frontend (Vite + React)
```bash
npm install              # Install frontend dependencies
npm run dev              # Start dev server (http://localhost:5173)
npm run build            # Production build to dist/
npm run preview          # Preview production build
```

### Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
python seed.py           # First run only — creates and seeds mindbridge.db
uvicorn main:app --reload --port 8000
```

### Prompt debugging
```bash
cd backend
python -m prompts.demo   # Print assembled prompts for two contrasting agents
```

## Tech Stack

- **Frontend**: Vite + React 19 + Tailwind CSS 3 + Lucide React icons. Inter font via Google Fonts.
- **Backend**: FastAPI + SQLAlchemy ORM + SQLite (`backend/mindbridge.db`). Pydantic for request validation.
- **LLM**: Abstracted via `backend/llm.py`. Ships with `MockLLM` (random contextual responses). Swap to real provider by implementing `LLMProvider.generate(system_prompt, messages)`.

CORS is configured for `localhost:5173` only.

## Architecture

### Frontend: Top Bar + Three Panels

The app uses a horizontal top navigation bar (`TopBar`) with three content views, plus a persona toggle to swap into patient mode. The logo acts as a home button (deselects patient, navigates to patients view).

```
TopBar:  [Logo=Home]  [Patients] [Agents] [Signals]     [Patient view]
Content: [PatientList | TherapistHome]                — default (no patient selected)
         [PatientList | Workspace | ContextPanel]     — patient selected
         [AgentsGrid]                                 — Agents view
         [SignalsFeed]                                — Signals view
         [PatientChat]                                — Patient mode
         [AgentConfigurator]                          — overlay when configuring
         [AddPatientModal]                            — overlay when adding patient
```

**Frontend state** lives in `App.jsx` and flows down via props. The frontend still initializes from `src/data/mock.js` — it has not yet been wired to the backend API.

### Backend: REST API + Prompt Pipeline

`backend/main.py` is the FastAPI app. All endpoints under `/api/`. Key routes:
- `GET/POST /api/patients` — list / create
- `PUT /api/patients/{id}/agent` — update agent config
- `GET/PUT /api/master-prompt` — global master prompt
- `POST /api/chat/{patient_id}` — the core chat pipeline (assembles prompt, calls LLM, persists messages)
- `GET /api/signals`, `PUT /api/signals/{id}/acknowledge`
- `GET /api/appointments?date=YYYY-MM-DD`

Database models in `backend/db.py`: `Patient`, `Message`, `Signal`, `Appointment`, `Setting`. Patient agent config is stored as a JSON string column (`agent_config`) with `get_agent()`/`set_agent()` helpers.

### Prompt Assembly Pipeline (`backend/prompts/`)

This is the core non-obvious architecture. The system prompt is built in layers (order matters):

1. **Master prompt** (`Setting` table) — therapist's base instructions, inviolable
2. **Bridge text** — explicit instruction that foundation overrides everything below
3. **Template personality** (`prompts/templates.py`) — one of 5 archetypes: `anchor`, `structured`, `reflective`, `perspective`, `soft`
4. **Tone calibration** (`prompts/tone.py`) — translates numeric sliders (warmth/directness/verbosity, each 1-10) into behavioral instructions
5. **Response styles** — techniques to use naturally (not a checklist)
6. **Boundaries** — hard constraints that override everything above
7. **Patient context** — summary + recent signals (last so LLM has it freshest)

Sections are joined with `---` separators. Boundaries come late intentionally so they act as final authority. `prompts/demo.py` prints assembled prompts for two contrasting agents to verify the pipeline.

### Data Model

- 6 seed patients with 5 status levels: `crisis`, `warning`, `active`, `quiet`, `new`
- 5 agent templates with distinct therapeutic approaches
- Signals replace alerts — include positive milestones, not just problems. "Acknowledge" instead of "Resolve."
- `seed.py` mirrors `src/data/mock.js` data into SQLite. Skip if already seeded.

### Design System

- **Primary**: sage green (`sage-500: #4A7C6F`) — custom color in `tailwind.config.js`
- **Neutrals**: Tailwind `stone-*` (warm tones)
- **Status colors**: red (crisis), amber (warning), emerald (active), stone (quiet), sky (new)
- **Signal types**: critical (red), warning (amber), positive (emerald), info (sky)
- **Form inputs**: `text-[12px]` therapist-side, `text-[14px]` patient-side, sage focus rings
- **Modals**: fixed z-50 overlay with black/20 backdrop, click-outside-to-close

### Crisis Detection

Handled via the LLM prompt at inference time, not client-side. The frontend does not perform keyword matching.

## Key Design Decisions

- The frontend and backend currently hold duplicate data (mock.js vs SQLite). The frontend has not been wired to fetch from the API yet.
- The `MockLLM` detects which template is active by scanning the system prompt text, then returns a random response from a matching pool. This lets you test the full pipeline without API credits.
- The chat endpoint returns `systemPrompt` in its response for debugging — this should be removed in production.
