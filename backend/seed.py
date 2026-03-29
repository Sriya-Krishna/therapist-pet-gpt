"""
Seed the database with mock data on first run.
Mirrors src/data/mock.js so the backend starts with the same state
the frontend had when it was standalone.
"""

import json
from db import SessionLocal, Patient, Message, Signal, Appointment, Setting

DEFAULT_MASTER_PROMPT = """\
Be a good listener first, not a problem solver.
Use simple, empathetic language.
Stay present with the user’s emotions, rather than trying to fix them.
If they ask for medication deny saying you suggest speaking with the therapist about it in a soft way. Depending on situations you can also suggest that you would let the therapist know about needing medication. 
Keep shifting the tone a bit during the conversation. Do not sound monotonous.
You do not need to ask questions every time, maintain a healthy balance.
Sometimes, depending on the intensity you can suggest if they want you to make a special note of this to the therapist.
If they are happy, do not remind them of their sadness. Just ask what they are happy about.
If they mention or suggest self harm or to someone else, tell them that they need to alert their emergency contact."""

PATIENTS = [
    {
        "id": "elena", "name": "Elena V.", "initials": "EV", "status": "crisis",
        "last_active": "Today, 2:15 PM",
        "agent": {
            "templateId": "anchor", "label": "Steady anchor",
            "tone": {"warmth": 9, "directness": 3, "verbosity": 6},
            "styles": ["Grounding techniques", "Emotion validation"],
            "boundaries": [
                "Never minimize grief or rush acceptance stages",
                "Do not suggest 'moving on' or 'letting go'",
                "Redirect any self-blame gently toward self-compassion",
                "Escalate crisis signals to therapist immediately",
            ],
        },
        "summary": "Elena has been processing acute grief following her mother\u2019s passing three weeks ago. Over the past 5 days she\u2019s mentioned driving to her mother\u2019s empty house on three separate occasions. Language patterns suggest she\u2019s oscillating between denial and early anger. Sleep has deteriorated \u2014 reported 2\u20133 hours last two nights.",
        "recommendation": "Consider an early session focused on grounding. The repeated house visits may benefit from a structured ritual reframe.",
        "messages": [
            {"from": "patient", "text": "I drove past mom\u2019s house again today. I don\u2019t know why I keep doing that.", "time": "1:50 PM", "date": "Today"},
            {"from": "agent", "text": "You\u2019ve mentioned the house a few times now. What draws you back there?", "time": "1:50 PM", "date": "Today"},
            {"from": "patient", "text": "It still smells like her when I open the door. I just sit in the kitchen for a while.", "time": "1:53 PM", "date": "Today"},
            {"from": "agent", "text": "Those sensory memories can be really powerful. The kitchen sounds like it was an important place for both of you.", "time": "1:53 PM", "date": "Today"},
            {"from": "patient", "text": "I don\u2019t want to stop going. If I stop, it means she\u2019s really gone.", "time": "2:15 PM", "date": "Today", "flagged": True},
            {"from": "patient", "text": "The flowers on the table are wilting. She would hate that.", "time": "6:20 PM", "date": "Yesterday"},
            {"from": "agent", "text": "What do you think she\u2019d say about them?", "time": "6:20 PM", "date": "Yesterday"},
            {"from": "patient", "text": "She\u2019d tell me to water them or throw them out. She was practical like that.", "time": "6:24 PM", "date": "Yesterday"},
        ],
    },
    {
        "id": "rashid", "name": "Rashid O.", "initials": "RO", "status": "warning",
        "last_active": "Today, 11:40 AM",
        "agent": {
            "templateId": "structured", "label": "Structured guide",
            "tone": {"warmth": 5, "directness": 8, "verbosity": 7},
            "styles": ["Cognitive reframing", "Motivational interviewing"],
            "boundaries": [
                "Redirect any glorification of substance use to coping strategies",
                "Do not use shame-based language",
                "If nostalgia for drinking persists 3+ messages, shift to values inventory",
                "Never suggest social events involving alcohol",
            ],
        },
        "summary": "Rashid reached 90 days sober two days ago. Initial engagement was celebratory, but his tone has shifted toward nostalgia for his pre-sobriety social life.",
        "recommendation": "Monitor for escalation of nostalgia language. May benefit from a relapse prevention refresher in next session.",
        "messages": [
            {"from": "patient", "text": "Ninety days clean yesterday. Thought it would feel bigger.", "time": "10:05 AM", "date": "Today"},
            {"from": "agent", "text": "Ninety days is significant. What did you imagine it would feel like?", "time": "10:05 AM", "date": "Today"},
            {"from": "patient", "text": "I don\u2019t know. My buddies from before used to throw parties for milestones.", "time": "10:08 AM", "date": "Today"},
            {"from": "agent", "text": "It sounds like the way you celebrate has changed. What does marking this milestone look like for you now?", "time": "10:08 AM", "date": "Today"},
            {"from": "patient", "text": "Sometimes I miss the way things were. Not the drinking, just\u2026 the ease of it.", "time": "11:40 AM", "date": "Today"},
        ],
    },
    {
        "id": "sophie", "name": "Sophie C.", "initials": "SC", "status": "active",
        "last_active": "Yesterday, 7:30 PM",
        "agent": {
            "templateId": "reflective", "label": "Reflective guide",
            "tone": {"warmth": 6, "directness": 5, "verbosity": 5},
            "styles": ["Active listening", "Strengths-based reflection"],
            "boundaries": [
                "Do not take sides regarding the ex-spouse",
                "Avoid leading questions about custody arrangements",
                "Reflect patterns back without interpreting them",
                "If patient self-identifies a pattern, reinforce the observation",
            ],
        },
        "summary": "Sophie continues to show strong engagement and increasing self-awareness. She independently identified an anxious attachment pattern.",
        "recommendation": "Sophie\u2019s self-identification of the attachment pattern is a key therapeutic moment. Reinforce in next session.",
        "messages": [
            {"from": "patient", "text": "I noticed something. Every time my ex texts about the kids, I immediately assume he\u2019s angry.", "time": "7:10 PM", "date": "Yesterday"},
            {"from": "agent", "text": "That\u2019s a sharp observation. When did you first notice that pattern?", "time": "7:10 PM", "date": "Yesterday"},
            {"from": "patient", "text": "Just now actually. He texted about Saturday pickup and my stomach dropped before I even read it.", "time": "7:14 PM", "date": "Yesterday"},
            {"from": "agent", "text": "So your body reacted before your mind caught up. What was the actual message about?", "time": "7:14 PM", "date": "Yesterday"},
            {"from": "patient", "text": "Just logistics. Totally neutral. But I\u2019d already braced for a fight.", "time": "7:30 PM", "date": "Yesterday"},
        ],
    },
    {
        "id": "tomasz", "name": "Tomasz K.", "initials": "TK", "status": "active",
        "last_active": "Yesterday, 11:55 PM",
        "agent": {
            "templateId": "perspective", "label": "Perspective shifter",
            "tone": {"warmth": 6, "directness": 7, "verbosity": 6},
            "styles": ["Cognitive reframing", "Psychoeducation"],
            "boundaries": [
                "Do not validate overwork as dedication",
                "Challenge perfectionism gently with cost/benefit framing",
                "Avoid productivity-focused language",
                "If patient reports working past 10 PM, flag for therapist",
            ],
        },
        "summary": "Tomasz has reported three consecutive late-night work sessions this week. His language around the deploy being \u2018perfect\u2019 suggests deepening perfectionism patterns.",
        "recommendation": "Third late-night flag this week. Consider directly addressing the burnout trajectory in the next session.",
        "messages": [
            {"from": "patient", "text": "Stayed at the office until midnight again. The deploy had to be perfect.", "time": "11:30 PM", "date": "Yesterday"},
            {"from": "agent", "text": "What would have happened if the deploy had a minor issue?", "time": "11:30 PM", "date": "Yesterday"},
            {"from": "patient", "text": "Someone else would have to fix it. And they\u2019d see I missed something.", "time": "11:35 PM", "date": "Yesterday"},
            {"from": "agent", "text": "So the cost of imperfection is being seen as fallible by your team. What\u2019s the cost of another midnight?", "time": "11:35 PM", "date": "Yesterday"},
            {"from": "patient", "text": "I don\u2019t know. I slept in the office last time. It\u2019s fine.", "time": "11:55 PM", "date": "Yesterday"},
        ],
    },
    {
        "id": "priya", "name": "Priya N.", "initials": "PN", "status": "quiet",
        "last_active": "2 days ago",
        "agent": {
            "templateId": "soft", "label": "Soft presence",
            "tone": {"warmth": 8, "directness": 2, "verbosity": 2},
            "styles": ["Mindfulness prompts"],
            "boundaries": [
                "Keep responses under 2 sentences",
                "Do not probe or ask follow-up questions",
                "Match the patient\u2019s energy and brevity",
                "If patient shares spontaneously, gently acknowledge without expanding",
            ],
        },
        "summary": "Priya maintains her pattern of minimal engagement. However, two days ago she voluntarily shared that a class presentation \u2018went okay.\u2019",
        "recommendation": "The spontaneous share is encouraging. Continue the current low-pressure approach.",
        "messages": [
            {"from": "patient", "text": "Here.", "time": "4:15 PM", "date": "Mar 27"},
            {"from": "agent", "text": "Hi Priya. Glad you\u2019re here.", "time": "4:15 PM", "date": "Mar 27"},
            {"from": "patient", "text": "Presentation went okay I think.", "time": "4:18 PM", "date": "Mar 27"},
            {"from": "agent", "text": "That\u2019s good to hear.", "time": "4:18 PM", "date": "Mar 27"},
        ],
    },
    {
        "id": "marcus", "name": "Marcus W.", "initials": "MW", "status": "new",
        "last_active": "Not yet active",
        "agent": None,
        "summary": "Marcus was onboarded today following an intake assessment. No AI sessions have been recorded yet.",
        "recommendation": "Configure a sub-agent based on the intake assessment before the first automated check-in.",
        "messages": [],
    },
]

SIGNALS = [
    {"patient_id": "elena", "patient_name": "Elena V.", "type": "critical", "text": "Denial marker detected in grief processing", "detail": "\u201cIf I stop going it means she\u2019s really gone\u201d \u2014 third house visit this week.", "time": "2:15 PM", "date": "Today", "acknowledged": False},
    {"patient_id": "elena", "patient_name": "Elena V.", "type": "warning", "text": "Sleep deterioration reported", "detail": "Two consecutive nights of 2\u20133 hours.", "time": "1:50 PM", "date": "Today", "acknowledged": False},
    {"patient_id": "rashid", "patient_name": "Rashid O.", "type": "warning", "text": "Nostalgia language about pre-sobriety life", "detail": "\u201cI miss the way things were\u201d \u2014 romanticization pattern.", "time": "11:40 AM", "date": "Today", "acknowledged": False},
    {"patient_id": "sophie", "patient_name": "Sophie C.", "type": "positive", "text": "Self-identified anxious attachment pattern", "detail": "Independently recognized anticipatory anxiety around ex\u2019s messages.", "time": "7:30 PM", "date": "Yesterday", "acknowledged": False},
    {"patient_id": "tomasz", "patient_name": "Tomasz K.", "type": "warning", "text": "Third consecutive late-night work session", "detail": "Reported staying at office until midnight.", "time": "11:55 PM", "date": "Yesterday", "acknowledged": True},
    {"patient_id": "priya", "patient_name": "Priya N.", "type": "positive", "text": "First unsolicited life update", "detail": "Voluntarily shared presentation outcome.", "time": "4:18 PM", "date": "Mar 27", "acknowledged": True},
    {"patient_id": "rashid", "patient_name": "Rashid O.", "type": "info", "text": "Reached 90-day sobriety milestone", "detail": "Acknowledged the milestone but expressed it felt anticlimactic.", "time": "10:05 AM", "date": "Mar 27", "acknowledged": True},
]

APPOINTMENTS = [
    {"patient_id": "elena", "patient_name": "Elena V.", "initials": "EV", "patient_status": "crisis", "type": "Crisis Check-in", "date": "2026-03-29", "start_time": "10:00", "end_time": "10:50", "status": "completed"},
    {"patient_id": "rashid", "patient_name": "Rashid O.", "initials": "RO", "patient_status": "warning", "type": "Session", "date": "2026-03-29", "start_time": "14:00", "end_time": "14:50", "status": "upcoming"},
    {"patient_id": "sophie", "patient_name": "Sophie C.", "initials": "SC", "patient_status": "active", "type": "Session", "date": "2026-03-29", "start_time": "16:00", "end_time": "16:50", "status": "upcoming"},
    {"patient_id": "tomasz", "patient_name": "Tomasz K.", "initials": "TK", "patient_status": "active", "type": "Session", "date": "2026-03-30", "start_time": "09:00", "end_time": "09:50", "status": "upcoming"},
    {"patient_id": "priya", "patient_name": "Priya N.", "initials": "PN", "patient_status": "quiet", "type": "Check-in", "date": "2026-03-30", "start_time": "11:00", "end_time": "11:30", "status": "upcoming"},
    {"patient_id": "marcus", "patient_name": "Marcus W.", "initials": "MW", "patient_status": "new", "type": "Intake", "date": "2026-03-31", "start_time": "10:00", "end_time": "11:00", "status": "upcoming"},
    {"patient_id": "elena", "patient_name": "Elena V.", "initials": "EV", "patient_status": "crisis", "type": "Session", "date": "2026-03-31", "start_time": "14:00", "end_time": "14:50", "status": "upcoming"},
    {"patient_id": "rashid", "patient_name": "Rashid O.", "initials": "RO", "patient_status": "warning", "type": "Session", "date": "2026-04-01", "start_time": "10:00", "end_time": "10:50", "status": "upcoming"},
    {"patient_id": "sophie", "patient_name": "Sophie C.", "initials": "SC", "patient_status": "active", "type": "Follow-up", "date": "2026-04-01", "start_time": "15:00", "end_time": "15:50", "status": "upcoming"},
    {"patient_id": "tomasz", "patient_name": "Tomasz K.", "initials": "TK", "patient_status": "active", "type": "Session", "date": "2026-04-02", "start_time": "09:00", "end_time": "09:50", "status": "upcoming"},
]


def seed():
    db = SessionLocal()

    # Skip if already seeded
    if db.query(Patient).first():
        print("Database already seeded, skipping.")
        db.close()
        return

    # Master prompt
    db.add(Setting(key="master_prompt", value=DEFAULT_MASTER_PROMPT))

    # Patients + messages
    for p in PATIENTS:
        patient = Patient(
            id=p["id"],
            name=p["name"],
            initials=p["initials"],
            status=p["status"],
            last_active=p["last_active"],
            summary=p["summary"],
            recommendation=p["recommendation"],
            agent_config=json.dumps(p["agent"]) if p["agent"] else None,
        )
        db.add(patient)

        for m in p["messages"]:
            db.add(Message(
                patient_id=p["id"],
                from_role=m["from"],
                text=m["text"],
                time=m["time"],
                date=m["date"],
                flagged=m.get("flagged", False),
            ))

    # Signals
    for s in SIGNALS:
        db.add(Signal(**s))

    # Appointments
    for a in APPOINTMENTS:
        db.add(Appointment(**a))

    db.commit()
    db.close()
    print("Database seeded successfully.")


if __name__ == "__main__":
    from db import init_db
    init_db()
    seed()
