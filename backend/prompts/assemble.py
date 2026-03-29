"""
Prompt assembly.

Composes the final system prompt from the layered hierarchy:

    1. Master prompt        — therapist's base instructions (inviolable)
    2. Template personality  — archetype behavior
    3. Tone calibration     — warmth / directness / verbosity
    4. Response styles      — concrete techniques to use
    5. Boundaries           — hard constraints (override everything)
    6. Patient context      — summary, recent signals, session continuity

The ordering matters. Boundaries come late so they act as the final
authority. Patient context comes last so the LLM has it freshest in
the context window.
"""

from .templates import TEMPLATES
from .tone import tone_instructions


def assemble_system_prompt(
    master_prompt: str,
    template_id: str,
    tone: dict[str, int],
    styles: list[str],
    boundaries: list[str],
    patient_name: str,
    patient_summary: str = "",
    recent_signals: list[dict] | None = None,
) -> str:
    """
    Build the complete system prompt for a patient agent.

    Args:
        master_prompt:   The therapist's base instructions.
        template_id:     One of: anchor, structured, reflective, perspective, soft.
        tone:            Dict with keys: warmth, directness, verbosity (each 1–10).
        styles:          List of response style names the agent should use.
        boundaries:      List of hard constraint strings.
        patient_name:    The patient's display name.
        patient_summary: AI-generated summary of patient progress.
        recent_signals:  Recent signals/alerts for context.

    Returns:
        The assembled system prompt string.
    """
    sections: list[str] = []

    # ── 1. Master prompt ───────────────────────────────────────
    sections.append(master_prompt.strip())

    # ── Bridge: make the inheritance explicit ─────────────────
    sections.append(
        "The instructions above are your foundation — they define who you "
        "are and what you never do. Everything below specializes HOW you "
        "apply those principles for this specific patient. If anything "
        "below conflicts with the foundation above, the foundation wins."
    )

    # ── 2. Template personality ────────────────────────────────
    template = TEMPLATES.get(template_id)
    if template:
        sections.append(
            f"## Therapeutic approach: {template['label']}\n\n"
            f"{template['system']}"
        )

    # ── 3. Tone calibration ───────────────────────────────────
    sections.append(
        tone_instructions(
            warmth=tone.get("warmth", 5),
            directness=tone.get("directness", 5),
            verbosity=tone.get("verbosity", 5),
        )
    )

    # ── 4. Response styles ────────────────────────────────────
    if styles:
        style_text = "\n".join(f"- {s}" for s in styles)
        sections.append(
            "## Response techniques to incorporate\n\n"
            "Use these approaches when they fit the moment naturally. "
            "Do not force them — they are tools in your toolkit, not a "
            "checklist to complete each session.\n\n"
            f"{style_text}"
        )

    # ── 5. Boundaries (hard constraints) ──────────────────────
    if boundaries:
        boundary_text = "\n".join(f"- {b}" for b in boundaries)
        sections.append(
            "## Boundaries — STRICT\n\n"
            "The following constraints are absolute. They override your "
            "archetype, tone settings, and response styles. If a boundary "
            "conflicts with your natural inclination, the boundary wins. "
            "No exceptions.\n\n"
            f"{boundary_text}"
        )

    # ── 6. Patient context ────────────────────────────────────
    context_parts: list[str] = []
    context_parts.append(f"You are speaking with {patient_name}.")

    if patient_summary:
        context_parts.append(
            f"Therapist's summary of this patient:\n{patient_summary}"
        )

    if recent_signals:
        signal_lines = []
        for s in recent_signals:
            prefix = s.get("type", "info").upper()
            signal_lines.append(f"- [{prefix}] {s['text']}: {s.get('detail', '')}")
        context_parts.append(
            "Recent signals flagged for therapist awareness "
            "(use to inform your approach, do not mention directly to patient):\n"
            + "\n".join(signal_lines)
        )

    sections.append(
        "## Current patient context\n\n" + "\n\n".join(context_parts)
    )

    return "\n\n---\n\n".join(sections)
