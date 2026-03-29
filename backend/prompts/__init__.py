"""
Prompt assembly pipeline.

Builds a layered system prompt from a therapist's master prompt, a personality
template, tone sliders, response styles, boundaries, and patient context.

Public API:
    assemble_system_prompt()  — compose the full prompt for a patient agent
    TEMPLATES                 — dict of personality archetypes (anchor, structured, …)
    tone_instructions()       — translate numeric sliders to behavioral instructions
"""

from .templates import TEMPLATES
from .tone import tone_instructions
from .assemble import assemble_system_prompt

__all__ = ["TEMPLATES", "tone_instructions", "assemble_system_prompt"]
