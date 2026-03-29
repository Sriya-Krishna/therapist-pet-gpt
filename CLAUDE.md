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

### Docker
```bash
docker compose up --build       # Build and run at http://localhost:8000
docker build -t mindbridge .    # Or build manually
docker run -p 8000:8000 --env-file backend/.env mindbridge
```

The Docker image is a multi-stage build: Node 20 compiles the frontend, Python 3.13-slim runs the backend and serves static files. `docker-entrypoint.sh` seeds the database on first start. In the container, FastAPI serves the React SPA via a catch-all route at the bottom of `main.py` (only activates when `static/` directory exists).

There are no tests, linters, or CI pipelines configured yet.

## Tech Stack

- **Frontend**: Vite + React 19 + Tailwind CSS 3 + Lucide React icons. Inter font via Google Fonts.
- **Backend**: FastAPI + SQLAlchemy ORM + SQLite (`backend/mindbridge.db`). Pydantic for request validation. python-dotenv loads `backend/.env`.
- **LLM**: Abstracted via `backend/llm.py`. Uses Anthropic's OpenAI-compatible API (`ANTHROPIC_API_KEY` in `.env`). Falls back to `MockLLM` if no key is set.

In development, Vite proxies `/api` requests to `localhost:8000`. CORS is configured for `localhost:5173`. In Docker production, FastAPI serves the built frontend directly — no proxy needed.

## Architecture

### Frontend: Top Bar + Four Panels

The app uses a horizontal top navigation bar (`TopBar`) with four content views, plus a persona toggle to swap into patient mode. The logo acts as a home button (deselects patient, navigates to patients view).

```
TopBar:  [Logo=Home]  [Patients] [Agents] [Signals] [Audit]  [Theme ▾]  [Patient view]
Content: [PatientList | TherapistHome]                — default (no patient selected)
         [PatientList | Workspace | ContextPanel]     — patient selected
         [AgentsGrid]                                 — Agents view
         [SignalsFeed]                                — Signals view
         [AuditLog]                                   — Boundary audit trail
         [PatientChat]                                — Patient mode
         [AgentConfigurator]                          — overlay when configuring
         [AddPatientModal]                            — overlay when adding patient
```

Frontend state lives in `App.jsx` and flows down via props. On mount it fetches from the backend API (`src/api.js`); if the backend is unreachable it falls back to `src/data/mock.js`. Status color constants are shared via `src/constants/statusColors.js`.

### Patient-Side Themes

`PatientChat.jsx` supports four visual themes selectable from the TopBar when in patient mode: Default, Floral, Starry Night, Enthusiastic. Each theme defines a full color palette applied via inline styles and CSS custom properties. Decorative background elements are rendered as positioned DOM elements and CSS pseudo-elements in `index.css`. Theme selection is not persisted to the backend.

### Backend: REST API + Post-Chat Pipeline

`backend/main.py` is the FastAPI app. All endpoints under `/api/`. Key routes:
- `GET/POST /api/patients` — list / create
- `PUT /api/patients/{id}/agent` — update agent config
- `GET/PUT /api/master-prompt` — global master prompt
- `POST /api/chat/{patient_id}` — the core pipeline (see below)
- `GET /api/signals`, `PUT /api/signals/{id}/acknowledge`
- `GET /api/audit-log` — boundary enforcement audit trail
- `GET /api/appointments?date=YYYY-MM-DD`

Database models in `backend/db.py`: `Patient`, `Message`, `Signal`, `BoundaryAudit`, `Appointment`, `Setting`. Patient agent config is stored as a JSON string column (`agent_config`) with `get_agent()`/`set_agent()` helpers. Each model has a `to_dict()` method for serialization.

### Post-Chat Pipeline (`POST /api/chat/{patient_id}`)

This is the core pipeline. After every patient message, the following chain runs:

1. **Prompt assembly** — 7-layer system prompt (see below)
2. **Response generation** — LLM call with full conversation history
3. **Boundary enforcement** — verifier LLM checks response against every therapist-defined boundary. If violation detected: regenerate with violation context (up to 2 retries), then fall back to safe response
4. **Persist messages** — both patient message and agent response saved to DB
5. **Signal extraction** — secondary LLM call analyzes the exchange for clinical signals (critical/warning/positive/info), creates Signal records
6. **Status auto-update** — patient status recalculated from unacknowledged signals (critical→crisis, warning→warning, active conversation→active, else quiet)
7. **Summary regeneration** — summarization LLM call regenerates patient summary and recommendation from last 20 messages

Steps 3-7 each fail independently — a failed signal extraction or summary generation never breaks the chat response.

### Prompt Assembly Pipeline (`backend/prompts/`)

The system prompt is built in layers (order matters):

1. **Master prompt** (`Setting` table) — therapist's base instructions, inviolable
2. **Bridge text** — explicit instruction that foundation overrides everything below
3. **Template personality** (`prompts/templates.py`) — one of 5 archetypes: `anchor`, `structured`, `reflective`, `perspective`, `soft`
4. **Tone calibration** (`prompts/tone.py`) — translates numeric sliders (warmth/directness/verbosity, each 1-10) into behavioral instructions
5. **Response styles** — techniques to use naturally (not a checklist)
6. **Boundaries** — hard constraints that override everything above
7. **Patient context** — summary + recent signals (last so LLM has it freshest)

Sections are joined with `---` separators. Boundaries come late intentionally so they act as final authority.

### Boundary Enforcement

The verifier LLM (`BOUNDARY_VERIFY_PROMPT` in main.py) checks every agent response against therapist-defined boundaries before it reaches the patient. Returns a JSON array with one pass/violation verdict per boundary. On violation:
- Regenerate with violation context injected into the prompt (up to `MAX_REGENERATION_ATTEMPTS = 2`)
- If still violating, substitute `SAFE_FALLBACK` response
- Every check is logged to the `BoundaryAudit` table with verdict, explanation, and action taken (`none`, `regenerated`, or `fallback`)

The Audit tab in the frontend (`AuditLog.jsx`) displays all checks with stats (total/passed/violations).

### Signal Extraction

The signal extraction LLM (`SIGNAL_EXTRACTION_PROMPT` in main.py) analyzes each patient-agent exchange and returns a JSON array of signals. Four clinical categories:
- **critical** — imminent risk (self-harm, crisis escalation)
- **warning** — behavioral pattern shifts (sleep, substance nostalgia, avoidance)
- **positive** — therapeutic milestones (self-identified patterns, coping use)
- **info** — neutral observations (milestones, engagement changes)

JSON parsing handles markdown code fences. Malformed responses are logged and silently dropped.

### LLM Integration

`backend/llm.py` reads `ANTHROPIC_API_KEY` and optionally `ANTHROPIC_MODEL` (default: `claude-sonnet-4-20250514`) from `backend/.env`. The chat endpoint uses the LLM for four distinct purposes:
1. Response generation (main conversation)
2. Boundary verification (safety auditor prompt)
3. Signal extraction (clinical signal prompt)
4. Summary generation (summarization prompt)

`MockLLM` detects which call type it's handling by scanning the system prompt and returns appropriate mock data for each. This lets you test the full pipeline without API credits.

### Data Model

- 6 seed patients with 5 status levels: `crisis`, `warning`, `active`, `quiet`, `new`
- 5 agent templates with distinct therapeutic approaches
- Signals include positive milestones, not just problems. "Acknowledge" instead of "Resolve"
- `BoundaryAudit` logs every boundary check with verdict and action taken
- `seed.py` mirrors `src/data/mock.js` data into SQLite. Skip if already seeded

### Design System

- **Primary**: sage green (`sage-500: #4A7C6F`) — custom color in `tailwind.config.js`
- **Neutrals**: Tailwind `stone-*` (warm tones)
- **Status colors**: red (crisis), amber (warning), emerald (active), stone (quiet), sky (new)
- **Signal types**: critical (red), warning (amber), positive (emerald), info (sky)
- **Form inputs**: `text-[12px]` therapist-side, `text-[14px]` patient-side, sage focus rings
- **Modals**: fixed z-50 overlay with black/20 backdrop, click-outside-to-close

### Crisis Detection

Handled via the LLM at inference time through two mechanisms:
1. The system prompt includes boundaries that instruct the agent to escalate crisis signals
2. The signal extraction pipeline post-chat detects crisis markers and creates `critical` signals that auto-update patient status to `crisis`

## Key Design Decisions

- The frontend and backend hold duplicate seed data (mock.js vs SQLite). The frontend fetches from the API when available but falls back to mock.js if the backend is down.
- Patient themes are purely client-side (CSS/inline styles). Theme selection is not persisted.
- The post-chat pipeline (boundary enforcement, signals, summaries, status) runs synchronously but each step is wrapped in independent error handling. A production deployment would make these async/background tasks.
- `MockLLM` supports all four LLM call types (chat, boundary check, signal extraction, summary) by detecting the system prompt content.
