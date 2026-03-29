# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MindBridge is an AI-assisted mental wellness platform prototype. A therapist configures AI sub-agents per patient (personality, tone, boundaries). The AI mediates patient conversations, generates summaries, and surfaces signals to the therapist. The AI never provides clinical solutions — its behavior is entirely shaped by the therapist.

## Commands

```bash
npm run dev      # Start dev server (Vite, http://localhost:5173)
npm run build    # Production build to dist/
npm run preview  # Preview production build
```

## Tech Stack

Vite + React 19 + Tailwind CSS 3 + Lucide React icons. Inter font via Google Fonts. No backend — all data is in-memory state initialized from `src/data/mock.js`.

## Architecture

### Layout: Top Bar + Three Panels

The app uses a horizontal top navigation bar (`TopBar`) with three content views, plus a persona toggle to swap into patient mode. The logo acts as a home button (deselects patient, navigates to patients view).

```
TopBar:  [Logo=Home]  [Patients] [Agents] [Signals]     [Patient view]
Content: [PatientList | TherapistHome]                — default (no patient selected)
         [PatientList | Workspace | ContextPanel]     — patient selected
         [AgentsGrid]                                 — Agents view
         [SignalsFeed]                                — Signals view
         [PatientChat]                                — Patient mode (registered)
         [PatientChat registration]                   — Patient mode (unregistered)
         [AgentConfigurator]                          — overlay when configuring
         [AddPatientModal]                            — overlay when adding patient
```

### Prompt Hierarchy

The system uses a two-tier prompt architecture:

- **Master Prompt** (`masterPrompt` state in App.jsx): The base system instructions that all patient agents inherit. Editable from the TherapistHome dashboard. Defines the AI's core role, principles, and guardrails.
- **Per-patient agent config**: Each patient's agent (template, tone, response styles, boundaries) is layered on top of the master prompt. The per-patient config specializes behavior but never overrides the master prompt's core constraints.

All per-patient agents are derived from the master prompt. The master prompt is the single source of truth for the AI's fundamental behavior.

### State Management

All state lives in `App.jsx` and flows down via props. Key state:
- `view` — `'patients'` | `'agents'` | `'signals'`
- `selectedId` — which patient is selected in the list
- `isPatientMode` — swaps entire layout to journal-style chat
- `patients` — mutable array (initialized from mock data, new patients can be added)
- `signals` — array with `acknowledged` state (mutable)
- `masterPrompt` — base system prompt inherited by all agents
- `editingAgentFor` — patient ID when agent configurator is open
- `showAddPatient` — controls add-patient modal visibility
- `patientModeUser` — patient ID for patient-side session (null = unregistered)

### Views

- **Therapist Home** (default, no patient selected): `PatientList` sidebar + `TherapistHome` (calendar with clickable days, day schedule, master prompt editor). The "+" button in the PatientList header opens the add-patient modal.
- **Patients** (patient selected): `PatientList` + `Workspace` (center, transcript with date-grouped Slack-style messages) + `ContextPanel` (right, 320px, AI summary + signals + actions)
- **Agents**: Grid of configured sub-agent cards with tone mini-bars. Unconfigured patients show as dashed placeholder cards.
- **Signals**: Chronological timeline grouped by date. Includes both problems (critical/warning) and positive milestones. "Acknowledge" instead of "Resolve."
- **Agent Configurator**: Single-page split form (config left, live preview right). Opens from agent cards or context panel. Not a wizard — all settings visible at once.
- **Patient Chat**: Gated behind self-registration (name + optional intro). After registration: journal-style, centered text (no bubbles), multi-line textarea, breathing CSS animation, cream background. Includes session scheduler.
- **Add Patient Modal**: Therapist-side modal with name (required) + note (optional). Live initials preview. Auto-selects new patient on submit.

### Data Model (`src/data/mock.js`)

- 6 initial patients with 5 status levels: `crisis`, `warning`, `active`, `quiet`, `new`
- 5 agent templates: Steady anchor, Structured guide, Reflective guide, Perspective shifter, Soft presence
- Signals replace alerts — include positive milestones, not just problems
- Each patient has `agent` (config object or `null` for unconfigured) and `messages` (with `date` field for grouping)
- `defaultMasterPrompt` — pre-filled base prompt for all agents
- `appointments` — scheduled sessions with date, time, type, status

### Design System

- **Primary**: sage green (`sage-500: #4A7C6F`) — custom color in tailwind.config.js
- **Neutrals**: Tailwind `stone-*` (warm tones)
- **Status colors**: red (crisis), amber (warning), emerald (active), stone (quiet), sky (new) — all built-in Tailwind
- **Signal types**: critical (red), warning (amber), positive (emerald), info (sky)
- **Form inputs**: `text-[12px]` therapist-side, `text-[14px]` patient-side, sage focus rings
- **Modals**: fixed z-50 overlay with black/20 backdrop, click-outside-to-close

### Crisis Detection

Handled via the LLM prompt at inference time, not client-side. The frontend does not perform keyword matching.
