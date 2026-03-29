## Idea:
The proposed system is an AI-assisted mental wellness platform built on a three-component architecture: a User interface, a Therapist dashboard, and a Master AI Agent. On the user side, patients can freely express whatever comes to mind, with all conversations being recorded and stored by the AI agent.

The therapist operates through a customizable dashboard where they define how the AI agent communicates with each patient. This includes the ability to create personalized sub-agents tailored to individual patient needs — for example, configuring one sub-agent to calm an emotionally exhausted patient through soothing engagement, while configuring another to respond with gentle acknowledgments like "I hear you" or "I understand" for a patient who is calm but still processing underlying issues. The AI agent never provides direct clinical solutions to the patient; its conversational behavior is entirely shaped and controlled by the therapist.

Each sub-agent operates under the therapist's predefined rules, ensuring that patient interactions remain supportive and safe without overstepping into clinical territory. This design keeps the therapist firmly in control of the therapeutic process while leveraging AI to extend their reach and capture patient insights that would otherwise be lost between sessions.

Instead of having unsafe convos with chatgpt this can be a safer alternative.

# MindBridge

An AI-assisted mental wellness platform where therapists configure per-patient AI sub-agents. The AI mediates patient conversations under the therapist's full control — it never diagnoses, prescribes, or provides clinical advice.

check out the live app here on vercel: https://therapist-pet-gpt.vercel.app/

## What's Built

### Therapist Dashboard
- Patient list with **dynamic status indicators** (crisis, warning, active, quiet, new) — status auto-updates based on unacknowledged signal severity and conversation activity
- Conversation transcript viewer with flagged-message highlighting
- Context panel with **AI-generated summaries** — regenerated after every chat exchange using a summarization LLM call, not static text
- Calendar with day-by-day appointment schedule
- Master prompt editor — base instructions inherited by every patient agent

### Agent Configuration
- 5 personality templates: Steady anchor, Structured guide, Reflective guide, Perspective shifter, Soft presence
- Tone sliders: warmth, directness, verbosity (1-10 each), translated to concrete behavioral instructions
- Response style toggles (grounding techniques, cognitive reframing, motivational interviewing, etc.)
- Custom boundary rules with a preset safety checklist

### Prompt Assembly Pipeline
- 7-layer system prompt built at inference time: master prompt -> bridge text -> template -> tone -> styles -> boundaries -> patient context
- Boundaries are positioned late in the prompt so they act as final authority
- `python -m prompts.demo` prints assembled prompts for two contrasting agents

### Boundary Enforcement (Verifier LLM)
The core safety feature. Every agent response is verified by a second LLM call before reaching the patient:

1. Agent generates a response
2. **Verifier LLM** checks the response against every therapist-defined boundary, returning pass/violation per rule
3. If a violation is detected, the response is **regenerated** with the violation flagged as context
4. Up to 2 regeneration attempts. If boundaries are still violated, a **safe fallback** response is used
5. Every check (pass or violation) is logged to the **Audit Log** with verdict, explanation, and action taken

The therapist can open the Audit tab and see proof that their configured rules are being enforced. This creates a verifiable trust layer between therapist instructions and AI behavior.

### Signal Extraction
After each chat exchange, a secondary LLM call analyzes the patient message and agent response for clinically relevant signals across four tiers:

- **Critical** — imminent risk markers (self-harm language, crisis escalation)
- **Warning** — behavioral pattern shifts (sleep deterioration, substance nostalgia)
- **Positive** — therapeutic milestones (self-identified patterns, increased engagement)
- **Info** — neutral observations (milestone dates, new topics)

Signals appear in the Signals feed and are used to auto-update patient status. Signal extraction is wrapped in full error handling — if the LLM returns malformed JSON or the call fails, the chat response is still delivered normally.

### Patient Chat
- Real-time chat powered by Anthropic Claude (via OpenAI-compatible API)
- Full conversation history loaded on mount and sent to the LLM on each request
- Falls back to MockLLM with template-aware responses when no API key is set
- Self-registration flow for new patients
- Session scheduling with backend persistence (`POST /api/appointments`)
- 4 visual themes: Default, Floral, Starry Night, Enthusiastic

### Post-Chat Pipeline
Every chat exchange triggers a chain of non-blocking backend operations:

```
Patient message
  -> Generate response
  -> Verify boundaries (regenerate or fallback if violated)
  -> Persist messages
  -> Extract clinical signals
  -> Auto-update patient status
  -> Regenerate AI summary
  -> Return response
```

Each step fails independently — a failed signal extraction or summary generation never breaks the chat.

## Not Yet Implemented

- Authentication / user accounts

## Getting Started

### Frontend
```bash
npm install
npm run dev              # http://localhost:5173
```

### Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env     # add your ANTHROPIC_API_KEY
python seed.py           # first run only — creates mindbridge.db
uvicorn main:app --reload --port 8000
```

The frontend works without the backend (falls back to mock data), but chat responses, signal extraction, boundary enforcement, and AI summaries require the backend running. Without an `ANTHROPIC_API_KEY`, the backend uses MockLLM.

### Docker

Run the entire app as a single container:

```bash
# Make sure backend/.env has your ANTHROPIC_API_KEY, then:
docker compose up --build
```

The app will be available at `http://localhost:8000`.

Or without Compose:

```bash
docker build -t mindbridge .
docker run -p 8000:8000 --env-file backend/.env mindbridge
```

The Docker image uses a multi-stage build: Node builds the frontend, then Python serves both the API and the static files. The database is seeded automatically on first start.

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS 3, Lucide React
- **Backend**: FastAPI, SQLAlchemy, SQLite, python-dotenv
- **LLM**: Anthropic Claude via OpenAI-compatible API (`backend/llm.py`)

## Project Structure

```
src/
  App.jsx              — root state, view routing, API data loading
  api.js               — REST client (proxied to backend via Vite)
  data/mock.js         — fallback data when backend is offline
  constants/
    statusColors.js    — shared patient/signal color mappings
  components/
    TopBar.jsx         — navigation (Patients, Agents, Signals, Audit)
    PatientList.jsx    — sidebar with status-colored patient list
    Workspace.jsx      — therapist-side conversation transcript
    ContextPanel.jsx   — AI summary, signals, agent config, recommendations
    PatientChat.jsx    — patient-side chat with 4 visual themes
    AgentsGrid.jsx     — agent configuration cards
    AgentConfigurator.jsx — template/tone/styles/boundaries editor
    SignalsFeed.jsx    — chronological signal feed with acknowledge
    AuditLog.jsx       — boundary enforcement audit trail
    TherapistHome.jsx  — calendar + master prompt editor
    AddPatientModal.jsx — new patient creation

backend/
  main.py              — FastAPI app, all /api/ endpoints, post-chat pipeline
  db.py                — SQLAlchemy models (Patient, Message, Signal, BoundaryAudit, etc.)
  llm.py               — LLM provider abstraction (Anthropic + MockLLM)
  seed.py              — database seeder with 6 patients, signals, appointments
  prompts/
    templates.py       — 5 personality archetypes
    tone.py            — slider-to-instruction translator
    assemble.py        — 7-layer prompt composer
    demo.py            — prints assembled prompts for debugging
```

See [CLAUDE.md](CLAUDE.md) for detailed architecture notes and [PROJECT.md](PROJECT.md) for the project brief, impact hypothesis, and clinical signal taxonomy.
