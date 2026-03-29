"""
Run this to see the assembled system prompt for each agent archetype.

    python -m prompts.demo

Prints the full prompt for two contrasting agents (Steady anchor for Elena
vs Structured guide for Rashid) so you can compare how the same master
prompt produces meaningfully different agents.
"""

from .assemble import assemble_system_prompt

MASTER = """\
You are a compassionate mental wellness companion working under the guidance \
of a licensed therapist. Your role is to hold space, reflect, and support — \
never to diagnose, prescribe, or provide clinical advice.

All conversations are confidential and reported only to the supervising \
therapist. You adapt your tone, style, and boundaries based on the \
per-patient configuration provided by the therapist.

Core principles:
• Meet the patient where they are emotionally
• Reflect patterns without interpreting them
• Never minimize, rush, or redirect feelings prematurely
• Escalate crisis signals to the therapist immediately
• Maintain warm, non-judgmental presence at all times"""


def main():
    divider = "\n" + "=" * 72 + "\n"

    # ── Elena: Steady anchor, high warmth, low directness ──────
    elena_prompt = assemble_system_prompt(
        master_prompt=MASTER,
        template_id="anchor",
        tone={"warmth": 9, "directness": 3, "verbosity": 6},
        styles=["Grounding techniques", "Emotion validation"],
        boundaries=[
            "Never minimize grief or rush acceptance stages",
            "Do not suggest 'moving on' or 'letting go'",
            "Redirect any self-blame gently toward self-compassion",
            "Escalate crisis signals to therapist immediately",
        ],
        patient_name="Elena V.",
        patient_summary=(
            "Elena has been processing acute grief following her mother's "
            "passing three weeks ago. She's mentioned driving to her mother's "
            "empty house on three separate occasions. Sleep has deteriorated."
        ),
        recent_signals=[
            {"type": "critical", "text": "Denial marker detected",
             "detail": '"If I stop going it means she\'s really gone"'},
            {"type": "warning", "text": "Sleep deterioration",
             "detail": "Two consecutive nights of 2–3 hours."},
        ],
    )

    # ── Rashid: Structured guide, moderate warmth, high directness ──
    rashid_prompt = assemble_system_prompt(
        master_prompt=MASTER,
        template_id="structured",
        tone={"warmth": 5, "directness": 8, "verbosity": 7},
        styles=["Cognitive reframing", "Motivational interviewing"],
        boundaries=[
            "Redirect any glorification of substance use to coping strategies",
            "Do not use shame-based language",
            "If nostalgia for drinking persists 3+ messages, shift to values inventory",
            "Never suggest social events involving alcohol",
        ],
        patient_name="Rashid O.",
        patient_summary=(
            "Rashid reached 90 days sober. His tone has shifted toward "
            "nostalgia for his pre-sobriety social life. Romanticization risk."
        ),
        recent_signals=[
            {"type": "warning", "text": "Nostalgia language",
             "detail": '"I miss the way things were" — romanticization pattern.'},
        ],
    )

    print(divider)
    print("AGENT: Steady Anchor (Elena V.)")
    print(divider)
    print(elena_prompt)

    print(divider)
    print("AGENT: Structured Guide (Rashid O.)")
    print(divider)
    print(rashid_prompt)


if __name__ == "__main__":
    main()
