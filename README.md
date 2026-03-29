## Idea:
The proposed system is an AI-assisted mental wellness platform built on a three-component architecture: a User interface, a Therapist dashboard, and a Master AI Agent. On the user side, patients can freely express whatever comes to mind, with all conversations being recorded and stored by the AI agent. 

The therapist operates through a customizable dashboard where they define how the AI agent communicates with each patient. This includes the ability to create personalized sub-agents tailored to individual patient needs — for example, configuring one sub-agent to calm an emotionally exhausted patient through soothing engagement, while configuring another to respond with gentle acknowledgments like "I hear you" or "I understand" for a patient who is calm but still processing underlying issues. The AI agent never provides direct clinical solutions to the patient; its conversational behavior is entirely shaped and controlled by the therapist.

The Master AI Agent serves as the central mediator between the patient and the therapist. It stores all patient conversations, generates summaries based on the therapist's direction, and surfaces relevant interaction data back to the therapist for clinical review. Critically, the system includes built-in guardrails with keyword-based alerting — when high-risk terms such as "murder," "kill," or "suicide" are detected, the agent can push urgent alerts to the therapist or escalate to the necessary authorities depending on the severity. 

Each sub-agent operates under the therapist's predefined rules, ensuring that patient interactions remain supportive and safe without overstepping into clinical territory. This design keeps the therapist firmly in control of the therapeutic process while leveraging AI to extend their reach and capture patient insights that would otherwise be lost between sessions.

Instead of having unsafe convos with chatgpt this can be a safer alternative.

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
- **Backend**: FastAPI + SQLAlchemy ORM + SQLite (`backend/mindbridge.db`). Pydantic for request validation. python-dotenv loads `backend/.env`.
- **LLM**: Abstracted via `backend/llm.py`. Uses Anthropic's OpenAI-compatible API (`ANTHROPIC_API_KEY` in `.env`). Falls back to `MockLLM` if no key is set.

Vite proxies `/api` requests to `localhost:8000`. CORS is configured for `localhost:5173` only.

## Architecture

### Frontend: Top Bar + Three Panels

The app uses a horizontal top navigation bar (`TopBar`) with three content views, plus a persona toggle to swap into patient mode. The logo acts as a home button (deselects patient, navigates to patients view).

```
TopBar:  [Logo=Home]  [Patients] [Agents] [Signals]  [Theme dropdown]  [Patient view]
Content: [PatientList | TherapistHome]                — default (no patient selected)
         [PatientList | Workspace | ContextPanel]     — patient selected
         [AgentsGrid]                                 — Agents view
         [SignalsFeed]                                — Signals view
         [PatientChat]                                — Patient mode
         [AgentConfigurator]                          — overlay when configuring
         [AddPatientModal]                            — overlay when adding patient
```

Frontend state lives in `App.jsx` and flows down via props. On mount it fetches from the backend API (`src/api.js`); if the backend is unreachable it falls back to `src/data/mock.js`.



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

### LLM Integration

`backend/llm.py` reads `ANTHROPIC_API_KEY` and optionally `ANTHROPIC_MODEL` (default: `claude-sonnet-4-20250514`) from `backend/.env` via python-dotenv. It calls Anthropic's OpenAI-compatible endpoint (`https://api.anthropic.com/v1/chat/completions`). The chat endpoint sends the full conversation history per patient to the LLM on every request.

The `MockLLM` detects which template is active by scanning the system prompt text, then returns a random response from a matching pool. This lets you test the full pipeline without API credits.



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

- The frontend and backend hold duplicate seed data (mock.js vs SQLite). The frontend fetches from the API when available but falls back to mock.js if the backend is down.
- The chat endpoint returns `systemPrompt` in its response for debugging — this should be removed in production.
- Patient themes are purely client-side (CSS/inline styles). Theme selection is not persisted to the backend.
