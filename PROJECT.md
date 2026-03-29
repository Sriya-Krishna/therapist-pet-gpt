# MindBridge — Project Brief

## Problem

60% of therapy patients now use generic AI chatbots (ChatGPT, character.ai) between sessions — with zero clinical oversight. Three failure modes:

1. **Harmful advice** — Generic AI gives medication suggestions, diagnostic labels, or invalidating responses that contradict the therapist's approach
2. **Context blindness** — The AI has no awareness of the patient's clinical history, active risks, or therapeutic goals
3. **Invisible crises** — When a patient discloses self-harm intent to a chatbot at 2 AM, no one is alerted

MindBridge replaces this with therapist-controlled AI sub-agents that are personalized per patient, clinically bounded, and wired to surface crisis signals in real time.

## Impact Hypothesis

If therapists see crisis signals within 2 hours instead of discovering them at the next weekly session, early intervention rates could improve by an estimated 40% — based on research showing that crisis response time is the strongest predictor of positive outcomes in acute mental health episodes.

## Architecture

### Data Model

```
Patient (1) ──→ (N) Message       Ordered conversation history
   │                               from_role: 'patient' | 'agent'
   │                               flagged: boolean
   │
   ├──→ (1) agent_config (JSON)   Template, tone, styles, boundaries
   │
   ├──→ (N) Signal                Clinical observations extracted by AI
   │                               type: critical | warning | positive | info
   │                               acknowledged: boolean
   │
   └──→ (N) Appointment           Therapy sessions linked to patient

Setting (key-value)               Stores master_prompt (therapist's base instructions)
```

**Key relationships:**
- Patient → has many Messages (ordered by insertion), has many Signals, has one agent_config stored as JSON
- Signal has a severity tier (`critical` > `warning` > `positive` > `info`) and an `acknowledged` flag — therapists acknowledge rather than "resolve," because positive signals are milestones, not problems
- Appointment links to Patient with denormalized `patient_name`, `initials`, and `patient_status` for fast query rendering

### Prompt Assembly Pipeline

The system prompt is composed from 7 hierarchical layers at inference time (not pre-computed):

1. **Master prompt** — therapist's base instructions, inviolable
2. **Bridge text** — explicit inheritance: "foundation overrides everything below"
3. **Template** — one of 5 archetypes (anchor, structured, reflective, perspective, soft)
4. **Tone calibration** — warmth/directness/verbosity sliders translated to behavioral instructions
5. **Response styles** — techniques to use naturally (not a checklist)
6. **Boundaries** — hard constraints that override everything above
7. **Patient context** — summary + recent signals (last so LLM has it freshest)

Boundaries are positioned late intentionally so they act as final authority. This ordering was validated by testing with `python -m prompts.demo`.

### Signal Extraction Pipeline

After each chat exchange, a secondary LLM call analyzes the patient message and agent response for clinically relevant signals. The extraction system uses four defined categories:

- **Critical** — Imminent risk markers: self-harm language, suicidal ideation, harm to others, acute crisis escalation. These demand immediate therapist attention.
- **Warning** — Behavioral pattern shifts: sleep deterioration, substance nostalgia, social withdrawal, escalating avoidance, perfectionism deepening.
- **Positive** — Therapeutic milestones: self-identified patterns, increased engagement, coping strategy use, emotional regulation improvement.
- **Info** — Neutral observations: milestone dates, engagement frequency changes, new topics introduced.

The categories were chosen based on clinical triage frameworks — separating positive signals from problem signals lets therapists see progress alongside risk, which reduces alert fatigue and supports strengths-based practice.

Signal extraction is wrapped in full error handling: if the LLM returns malformed JSON or the call fails entirely, the chat response is still delivered normally. The extraction is non-blocking — a failed signal extraction never breaks the patient experience. This graceful degradation pattern ensures production reliability while enabling the clinical insight layer.

## Ecosystem Integration

The REST API is designed for third-party consumption. Patient summaries, signal feeds, and conversation metadata can be exposed as FHIR-compatible resources for EHR integration (Epic, Cerner). Webhook endpoints for crisis escalation can push to existing practice management notification systems. The signal extraction schema maps directly to standard clinical alert tiers used in EHR systems.

## Go-to-Market

Direct outreach to independent therapy practices (60% of US therapists are solo/small practice), followed by integration into EHR marketplaces (Epic App Orchard, Cerner Open). Independent practices have the fastest adoption cycle because they control their own tool stack without institutional procurement.

## Competitive Moat

Compounding moat: anonymized signal pattern data across a therapist's full patient panel improves the extraction model over time — a therapist with 30 configured patients generates signal training data that makes their dashboard increasingly accurate, creating a data flywheel that cannot be replicated by a new competitor. The per-patient agent configuration is itself a retention mechanism: a therapist who has tuned 30 sub-agents with custom boundaries has invested hours of clinical thinking that doesn't transfer to a competitor.
