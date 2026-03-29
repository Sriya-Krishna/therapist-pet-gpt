## Idea:
The proposed system is an AI-assisted mental wellness platform built on a three-component architecture: a User interface, a Therapist dashboard, and a Master AI Agent. On the user side, patients can freely express whatever comes to mind, with all conversations being recorded and stored by the AI agent. 

The therapist operates through a customizable dashboard where they define how the AI agent communicates with each patient. This includes the ability to create personalized sub-agents tailored to individual patient needs — for example, configuring one sub-agent to calm an emotionally exhausted patient through soothing engagement, while configuring another to respond with gentle acknowledgments like "I hear you" or "I understand" for a patient who is calm but still processing underlying issues. The AI agent never provides direct clinical solutions to the patient; its conversational behavior is entirely shaped and controlled by the therapist.

The Master AI Agent serves as the central mediator between the patient and the therapist. It stores all patient conversations, generates summaries based on the therapist's direction, and surfaces relevant interaction data back to the therapist for clinical review. Critically, the system includes built-in guardrails with keyword-based alerting — when high-risk terms such as "murder," "kill," or "suicide" are detected, the agent can push urgent alerts to the therapist or escalate to the necessary authorities depending on the severity. 

Each sub-agent operates under the therapist's predefined rules, ensuring that patient interactions remain supportive and safe without overstepping into clinical territory. This design keeps the therapist firmly in control of the therapeutic process while leveraging AI to extend their reach and capture patient insights that would otherwise be lost between sessions.

Instead of having unsafe convos with chatgpt this can be a safer alternative.

# MindBridge

An AI-assisted mental wellness platform where therapists configure per-patient AI sub-agents. The AI mediates patient conversations under the therapist's full control — it never diagnoses, prescribes, or provides clinical advice.


check out the live app here on vercel: https://therapist-pet-gpt.vercel.app/

## What's Built

**Therapist dashboard**
- Patient list with status indicators (crisis, warning, active, quiet, new)
- Conversation transcript viewer with flagged-message highlighting
- Context panel: AI summary, recent signals, agent config overview, recommendations
- Calendar with day-by-day appointment schedule
- Master prompt editor — base instructions inherited by every patient agent

**Agent configuration**
- 5 personality templates: Steady anchor, Structured guide, Reflective guide, Perspective shifter, Soft presence
- Tone sliders: warmth, directness, verbosity (1–10 each), translated to concrete behavioral instructions
- Response style toggles (grounding techniques, cognitive reframing, motivational interviewing, etc.)
- Custom boundary rules with a preset safety checklist

**Prompt assembly pipeline**
- 7-layer system prompt built at inference time: master prompt → bridge text → template → tone → styles → boundaries → patient context
- Boundaries are positioned late in the prompt so they act as final authority
- `python -m prompts.demo` prints assembled prompts for two contrasting agents

**Patient chat**
- Real-time chat powered by Anthropic Claude (via OpenAI-compatible API)
- Full conversation history sent to the LLM on each request
- Falls back to a MockLLM with template-aware canned responses when no API key is set
- Self-registration flow for new patients
- Session scheduling UI (client-side mockup)
- 4 visual themes: Default, Floral, Starry Night, Enthusiastic

**Signals feed**
- AI observations across all patients (critical, warning, positive, info)
- Acknowledge workflow — signals dim after acknowledgment

## Not Yet Implemented

- Real appointment booking (scheduler is a client-side mockup)
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

The frontend works without the backend (falls back to mock data), but chat responses require the backend running. Without an `ANTHROPIC_API_KEY`, the backend uses MockLLM.

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
  components/          — 10 React components (see file headers for docs)

backend/
  main.py              — FastAPI app, all /api/ endpoints
  db.py                — SQLAlchemy models (Patient, Message, Signal, etc.)
  llm.py               — LLM provider abstraction (Anthropic + MockLLM)
  seed.py              — database seeder with 6 patients, signals, appointments
  prompts/
    templates.py       — 5 personality archetypes
    tone.py            — slider-to-instruction translator
    assemble.py        — 7-layer prompt composer
    demo.py            — prints assembled prompts for debugging
```

See [CLAUDE.md](CLAUDE.md) for detailed architecture notes.
