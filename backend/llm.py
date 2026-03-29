"""
LLM abstraction layer.

Defines a provider interface for generating chat responses. Two implementations:

- OpenAILLM: Calls Anthropic's OpenAI-compatible endpoint using ANTHROPIC_API_KEY
  and ANTHROPIC_MODEL from backend/.env. Sends the full conversation history
  (system prompt + all prior messages) on every request.
- MockLLM: Returns template-aware canned responses for offline testing.

The module-level `llm` instance is auto-selected at import time based on
whether ANTHROPIC_API_KEY is set.
"""

import json
import os
import random
from abc import ABC, abstractmethod
from dotenv import load_dotenv

load_dotenv()


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
    OpenAI-compatible provider pointed at Anthropic's API.

    Env vars:
        ANTHROPIC_API_KEY — API key (required)
        ANTHROPIC_MODEL   — Model name (default: claude-sonnet-4-20250514)
    """

    def __init__(self):
        import httpx
        self.api_key = os.environ["ANTHROPIC_API_KEY"]
        self.base_url = "https://api.anthropic.com/v1"
        self.model = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-20250514")
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
        data = resp.json()
        return data["choices"][0]["message"]["content"]


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
        # Signal extraction calls use a different system prompt
        if "signal extraction system" in system_prompt.lower():
            return self._mock_signal_extraction(messages)

        # Boundary verification calls
        if "clinical safety auditor" in system_prompt.lower():
            return self._mock_boundary_check(messages)

        # Summary generation calls
        if "clinical summarization system" in system_prompt.lower():
            return self._mock_summary(messages)

        template_id = "_default"
        for tid in ("anchor", "structured", "reflective", "perspective", "soft"):
            if f"Therapeutic approach: {tid.capitalize()}" in system_prompt or \
               f"specialize in" in system_prompt and tid in system_prompt.lower():
                template_id = tid
                break

        pool = self.RESPONSES.get(template_id, self.RESPONSES["_default"])
        return random.choice(pool)

    def _mock_summary(self, messages: list[dict]) -> str:
        """Generate a mock clinical summary from the conversation."""
        summaries = [
            {"summary": "Patient is engaging consistently and showing willingness to explore emotional topics. Conversation patterns suggest moderate anxiety with increasing self-awareness. Recent exchanges indicate a shift toward reflective processing.", "recommendation": "Continue current approach and monitor for emerging pattern recognition."},
            {"summary": "Patient has been processing recent life events with fluctuating emotional intensity. Language suggests active coping but occasional avoidance of deeper themes. Engagement frequency is stable.", "recommendation": "Gently explore avoidance patterns in the next session."},
            {"summary": "Patient shows signs of progress in emotional regulation. Recent messages demonstrate increased self-reflection and a willingness to sit with discomfort. Engagement has been consistent.", "recommendation": "Reinforce self-reflection gains and introduce gentle perspective-taking exercises."},
        ]
        return json.dumps(random.choice(summaries))

    def _mock_boundary_check(self, messages: list[dict]) -> str:
        """Parse boundaries from the message and return all-pass verdicts."""
        content = messages[0]["content"] if messages else ""
        results = []
        for line in content.split("\n"):
            line = line.strip()
            if line.startswith("- ") and line != "- ":
                boundary = line[2:]
                results.append({"boundary": boundary, "verdict": "pass",
                                "explanation": "Response does not violate this boundary."})
        return json.dumps(results) if results else "[]"

    def _mock_signal_extraction(self, messages: list[dict]) -> str:
        """Return mock signals occasionally so the pipeline is testable."""
        # ~30% chance of generating a signal for demo purposes
        if random.random() > 0.3:
            return "[]"
        sig_type = random.choice(["positive", "info", "warning"])
        samples = {
            "positive": {"text": "Increased self-awareness observed", "detail": "Patient showed reflective engagement."},
            "info": {"text": "New topic introduced in session", "detail": "Patient mentioned a recent life event."},
            "warning": {"text": "Elevated emotional language detected", "detail": "Tone shift noted in latest message."},
        }
        sig = {"type": sig_type, **samples[sig_type]}
        return json.dumps([sig])


# ── Active provider ────────────────────────────────────────────
# Uses Anthropic API if ANTHROPIC_API_KEY is set, otherwise MockLLM.

if os.environ.get("ANTHROPIC_API_KEY"):
    llm = OpenAILLM()
else:
    llm = MockLLM()
