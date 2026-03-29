"""
LLM abstraction layer.

Defines a simple interface for generating responses. Ships with a mock
implementation and an OpenAI-compatible implementation that reads
OPENAI_API_BASE and OPENAI_API_KEY from the environment.
"""

import os
import random
from abc import ABC, abstractmethod


class LLMProvider(ABC):
    @abstractmethod
    def generate(self, system_prompt: str, messages: list[dict]) -> str:
        """
        Generate a response given a system prompt and conversation history.

        Args:
            system_prompt: The assembled system prompt (master + template + tone + etc.)
            messages:      List of {"role": "user"|"assistant", "content": str}

        Returns:
            The assistant's response text.
        """
        ...


class OpenAILLM(LLMProvider):
    """
    OpenAI-compatible provider. Works with OpenAI, Azure OpenAI, LMStudio,
    Ollama, or any API that follows the OpenAI chat completions format.

    Env vars:
        OPENAI_API_KEY   — API key (required)
        OPENAI_API_BASE  — Base URL (default: https://api.openai.com/v1)
        OPENAI_MODEL     — Model name (default: gpt-4o-mini)
    """

    def __init__(self):
        import httpx
        self.api_key = os.environ["OPENAI_API_KEY"]
        self.base_url = os.environ.get("OPENAI_API_BASE", "https://api.openai.com/v1").rstrip("/")
        self.model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
        self.client = httpx.Client(timeout=60)

    def generate(self, system_prompt: str, messages: list[dict]) -> str:
        full_messages = [{"role": "system", "content": system_prompt}] + messages
        resp = self.client.post(
            f"{self.base_url}/chat/completions",
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": self.model,
                "messages": full_messages,
                "max_tokens": 512,
                "temperature": 0.7,
            },
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]


class MockLLM(LLMProvider):
    """
    Returns contextually varied mock responses based on the template in
    the system prompt. Good enough to test the full pipeline without
    burning API credits.
    """

    RESPONSES = {
        "anchor": [
            "I hear you. That sounds like it carries real weight.",
            "You're here, and that matters. Take all the time you need.",
            "That makes a lot of sense given what you've been through.",
            "I'm here with you. There's no rush.",
            "What you're feeling right now — it's allowed to just be here.",
        ],
        "structured": [
            "Let's break that down. What feels like the most pressing piece?",
            "That's an important observation. What would the smallest next step look like?",
            "You mentioned something similar last time. How does it connect for you?",
            "What would you say to a friend in the same spot?",
            "Ninety days is real. What does honoring that look like for you now?",
        ],
        "reflective": [
            "That's a really sharp catch. When did you first start noticing that?",
            "I notice a theme here. Does that resonate with you?",
            "You handled that even though it was hard — that took something.",
            "Does this remind you of anything else you've experienced?",
            "What comes up for you when you sit with that observation?",
        ],
        "perspective": [
            "I wonder if there's another way to read that situation.",
            "What does staying with that pattern give you? What does it cost?",
            "What evidence supports that thought? What goes against it?",
            "That fight-or-flight response makes sense — your brain learned that was dangerous.",
            "Fair enough — what does feel more accurate to you?",
        ],
        "soft": [
            "I'm here.",
            "That's good to hear.",
            "Glad you're here.",
            "Take your time.",
            "That sounds okay.",
        ],
        "_default": [
            "Thank you for sharing that. What part of it feels most present right now?",
            "I'm here with you. Take all the time you need.",
            "That's a really honest thing to say. What would feel supportive right now?",
            "I hear you. That sounds like it carries weight.",
            "You don't have to have it figured out. Just being here is enough.",
        ],
    }

    def generate(self, system_prompt: str, messages: list[dict]) -> str:
        template_id = "_default"
        for tid in ("anchor", "structured", "reflective", "perspective", "soft"):
            if f"Therapeutic approach: {tid.capitalize()}" in system_prompt or \
               f"specialize in" in system_prompt and tid in system_prompt.lower():
                template_id = tid
                break

        pool = self.RESPONSES.get(template_id, self.RESPONSES["_default"])
        return random.choice(pool)


# ── Active provider ────────────────────────────────────────────
# Uses OpenAI-compatible API if OPENAI_API_KEY is set, otherwise MockLLM.

if os.environ.get("OPENAI_API_KEY"):
    llm = OpenAILLM()
else:
    llm = MockLLM()
