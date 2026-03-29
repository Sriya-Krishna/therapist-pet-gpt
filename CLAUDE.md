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

Vite + React 19 + Tailwind CSS 3 + Lucide React icons. Inter font via Google Fonts. No backend — all data is hardcoded in `src/data/mock.js`.

## Architecture

### Layout: Top Bar + Three Panels

The app uses a horizontal top navigation bar (`TopBar`) with three content views, plus a persona toggle to swap into patient mode.

```
TopBar:  [Logo]  [Patients] [Agents] [Signals]          [Patient view]
Content: [PatientList | Workspace | ContextPanel]  — for Patients view
         [AgentsGrid]                               — for Agents view
         [SignalsFeed]                              — for Signals view
         [PatientChat]                              — for Patient mode
         [AgentConfigurator]                        — overlay when configuring
```

### State Management

All state lives in `App.jsx` and flows down via props. Key state:
- `view` — `'patients'` | `'agents'` | `'signals'`
- `selectedId` — which patient is selected in the list
- `isPatientMode` — swaps entire layout to journal-style chat
- `configuringFor` — patient ID when agent configurator is open (replaces content area)
- `signals` — array with `acknowledged` state (mutable)

### Views

- **Patients** (three-panel): `PatientList` (always visible left, 280px) + `Workspace` (center, transcript with date-grouped Slack-style messages or agent config) + `ContextPanel` (right, 320px, AI summary + signals + actions, shows when patient selected)
- **Agents**: Grid of configured sub-agent cards with tone mini-bars. Unconfigured patients show as dashed placeholder cards.
- **Signals**: Chronological timeline grouped by date. Includes both problems (critical/warning) and positive milestones. "Acknowledge" instead of "Resolve."
- **Agent Configurator**: Single-page split form (config left, live preview right). Opens from agent cards or context panel. Not a wizard — all settings visible at once.
- **Patient Chat**: Journal-style, centered text (no bubbles), multi-line textarea, breathing CSS animation, cream background.

### Data Model (`src/data/mock.js`)

- 6 patients with 5 status levels: `crisis`, `warning`, `active`, `quiet`, `new`
- 5 agent templates: Steady anchor, Structured guide, Reflective guide, Perspective shifter, Soft presence
- Signals replace alerts — include positive milestones, not just problems
- Each patient has `agent` (config object or `null` for unconfigured) and `messages` (with `date` field for grouping)

### Design System

- **Primary**: sage green (`sage-500: #4A7C6F`) — custom color in tailwind.config.js
- **Neutrals**: Tailwind `stone-*` (warm tones)
- **Status colors**: red (crisis), amber (warning), emerald (active), stone (quiet), sky (new) — all built-in Tailwind
- **Signal types**: critical (red), warning (amber), positive (emerald), info (sky)

### Crisis Detection

Handled via the LLM prompt at inference time, not client-side. The frontend does not perform keyword matching.
