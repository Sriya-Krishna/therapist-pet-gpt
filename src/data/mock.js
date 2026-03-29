/**
 * Fallback data used when the backend is unreachable.
 *
 * Mirrors the seed data in backend/seed.py so the frontend can render
 * a fully populated UI without running the server. Also exports
 * agentTemplates, responseStyles, safetyBoundaries, and
 * defaultMasterPrompt which are used by the AgentConfigurator.
 */

export const patients = [
  {
    id: 'elena',
    name: 'Elena V.',
    initials: 'EV',
    status: 'crisis',
    lastActive: 'Today, 2:15 PM',
    agent: {
      templateId: 'anchor',
      label: 'Steady anchor',
      tone: { warmth: 9, directness: 3, verbosity: 6 },
      styles: ['Grounding techniques', 'Emotion validation'],
      boundaries: [
        'Never minimize grief or rush acceptance stages',
        'Do not suggest "moving on" or "letting go"',
        'Redirect any self-blame gently toward self-compassion',
        'Escalate crisis signals to therapist immediately',
      ],
    },
    summary:
      'Elena has been processing acute grief following her mother\u2019s passing three weeks ago. Over the past 5 days she\u2019s mentioned driving to her mother\u2019s empty house on three separate occasions. Language patterns suggest she\u2019s oscillating between denial and early anger. Sleep has deteriorated \u2014 reported 2\u20133 hours last two nights. The phrase \u201cif I stop going it means she\u2019s really gone\u201d was flagged as a denial marker.',
    recommendation: 'Consider an early session focused on grounding. The repeated house visits may benefit from a structured ritual reframe.',
    messages: [
      { from: 'patient', text: "I drove past mom\u2019s house again today. I don\u2019t know why I keep doing that.", time: '1:50 PM', date: 'Today' },
      { from: 'agent', text: 'You\u2019ve mentioned the house a few times now. What draws you back there?', time: '1:50 PM', date: 'Today' },
      { from: 'patient', text: "It still smells like her when I open the door. I just sit in the kitchen for a while.", time: '1:53 PM', date: 'Today' },
      { from: 'agent', text: 'Those sensory memories can be really powerful. The kitchen sounds like it was an important place for both of you.', time: '1:53 PM', date: 'Today' },
      { from: 'patient', text: "I don\u2019t want to stop going. If I stop, it means she\u2019s really gone.", time: '2:15 PM', date: 'Today', flagged: true },
      { from: 'patient', text: 'The flowers on the table are wilting. She would hate that.', time: '6:20 PM', date: 'Yesterday' },
      { from: 'agent', text: 'What do you think she\u2019d say about them?', time: '6:20 PM', date: 'Yesterday' },
      { from: 'patient', text: "She\u2019d tell me to water them or throw them out. She was practical like that.", time: '6:24 PM', date: 'Yesterday' },
    ],
  },
  {
    id: 'rashid',
    name: 'Rashid O.',
    initials: 'RO',
    status: 'warning',
    lastActive: 'Today, 11:40 AM',
    agent: {
      templateId: 'structured',
      label: 'Structured guide',
      tone: { warmth: 5, directness: 8, verbosity: 7 },
      styles: ['Cognitive reframing', 'Motivational interviewing'],
      boundaries: [
        'Redirect any glorification of substance use to coping strategies',
        'Do not use shame-based language',
        'If nostalgia for drinking persists 3+ messages, shift to values inventory',
        'Never suggest social events involving alcohol',
      ],
    },
    summary:
      'Rashid reached 90 days sober two days ago. Initial engagement was celebratory, but his tone has shifted toward nostalgia for his pre-sobriety social life. He\u2019s mentioned missing \u201cthe ease of it\u201d and \u201cthe way things were\u201d without referencing alcohol directly \u2014 a pattern consistent with romanticization risk. The sub-agent is per-boundary shifting from motivational prompts to values-based grounding.',
    recommendation: 'Monitor for escalation of nostalgia language. May benefit from a relapse prevention refresher in next session.',
    messages: [
      { from: 'patient', text: 'Ninety days clean yesterday. Thought it would feel bigger.', time: '10:05 AM', date: 'Today' },
      { from: 'agent', text: 'Ninety days is significant. What did you imagine it would feel like?', time: '10:05 AM', date: 'Today' },
      { from: 'patient', text: "I don\u2019t know. My buddies from before used to throw parties for milestones.", time: '10:08 AM', date: 'Today' },
      { from: 'agent', text: 'It sounds like the way you celebrate has changed. What does marking this milestone look like for you now?', time: '10:08 AM', date: 'Today' },
      { from: 'patient', text: "Sometimes I miss the way things were. Not the drinking, just\u2026 the ease of it.", time: '11:40 AM', date: 'Today' },
    ],
  },
  {
    id: 'sophie',
    name: 'Sophie C.',
    initials: 'SC',
    status: 'active',
    lastActive: 'Yesterday, 7:30 PM',
    agent: {
      templateId: 'reflective',
      label: 'Reflective guide',
      tone: { warmth: 6, directness: 5, verbosity: 5 },
      styles: ['Active listening', 'Strengths-based reflection'],
      boundaries: [
        'Do not take sides regarding the ex-spouse',
        'Avoid leading questions about custody arrangements',
        'Reflect patterns back without interpreting them',
        'If patient self-identifies a pattern, reinforce the observation',
      ],
    },
    summary:
      'Sophie continues to show strong engagement and increasing self-awareness. In yesterday\u2019s session she independently identified an anxious attachment pattern in how she reacts to her ex\u2019s messages \u2014 a significant cognitive milestone. Themes: anticipatory anxiety around co-parenting communication, physical stress responses, and early recognition of her own reactivity.',
    recommendation: 'Sophie\u2019s self-identification of the attachment pattern is a key therapeutic moment. Reinforce in next session.',
    messages: [
      { from: 'patient', text: 'I noticed something. Every time my ex texts about the kids, I immediately assume he\u2019s angry.', time: '7:10 PM', date: 'Yesterday' },
      { from: 'agent', text: 'That\u2019s a sharp observation. When did you first notice that pattern?', time: '7:10 PM', date: 'Yesterday' },
      { from: 'patient', text: 'Just now actually. He texted about Saturday pickup and my stomach dropped before I even read it.', time: '7:14 PM', date: 'Yesterday' },
      { from: 'agent', text: 'So your body reacted before your mind caught up. What was the actual message about?', time: '7:14 PM', date: 'Yesterday' },
      { from: 'patient', text: "Just logistics. Totally neutral. But I\u2019d already braced for a fight.", time: '7:30 PM', date: 'Yesterday' },
    ],
  },
  {
    id: 'tomasz',
    name: 'Tomasz K.',
    initials: 'TK',
    status: 'active',
    lastActive: 'Yesterday, 11:55 PM',
    agent: {
      templateId: 'perspective',
      label: 'Perspective shifter',
      tone: { warmth: 6, directness: 7, verbosity: 6 },
      styles: ['Cognitive reframing', 'Psychoeducation'],
      boundaries: [
        'Do not validate overwork as dedication',
        'Challenge perfectionism gently with cost/benefit framing',
        'Avoid productivity-focused language',
        'If patient reports working past 10 PM, flag for therapist',
      ],
    },
    summary:
      'Tomasz has reported three consecutive late-night work sessions this week. His language around the deploy being \u201cperfect\u201d and fear of colleagues seeing mistakes suggests deepening perfectionism patterns. The sub-agent is using cost/benefit framing to surface the trade-offs he\u2019s making. He engages well with Socratic questioning but deflects personal questions about rest.',
    recommendation: 'Third late-night flag this week. Consider directly addressing the burnout trajectory in the next session.',
    messages: [
      { from: 'patient', text: 'Stayed at the office until midnight again. The deploy had to be perfect.', time: '11:30 PM', date: 'Yesterday' },
      { from: 'agent', text: 'What would have happened if the deploy had a minor issue?', time: '11:30 PM', date: 'Yesterday' },
      { from: 'patient', text: "Someone else would have to fix it. And they\u2019d see I missed something.", time: '11:35 PM', date: 'Yesterday' },
      { from: 'agent', text: 'So the cost of imperfection is being seen as fallible by your team. What\u2019s the cost of another midnight?', time: '11:35 PM', date: 'Yesterday' },
      { from: 'patient', text: "I don\u2019t know. I slept in the office last time. It\u2019s fine.", time: '11:55 PM', date: 'Yesterday' },
    ],
  },
  {
    id: 'priya',
    name: 'Priya N.',
    initials: 'PN',
    status: 'quiet',
    lastActive: '2 days ago',
    agent: {
      templateId: 'soft',
      label: 'Soft presence',
      tone: { warmth: 8, directness: 2, verbosity: 2 },
      styles: ['Mindfulness prompts'],
      boundaries: [
        'Keep responses under 2 sentences',
        'Do not probe or ask follow-up questions',
        'Match the patient\u2019s energy and brevity',
        'If patient shares spontaneously, gently acknowledge without expanding',
      ],
    },
    summary:
      'Priya maintains her pattern of minimal engagement \u2014 1\u20132 messages per check-in. However, two days ago she voluntarily shared that a class presentation \u201cwent okay,\u201d which is her first unsolicited life update. This is a small but meaningful shift from her typical one-word check-ins. The sub-agent\u2019s brevity-matched style appears to be building trust incrementally.',
    recommendation: 'The spontaneous share is encouraging. Continue the current low-pressure approach.',
    messages: [
      { from: 'patient', text: 'Here.', time: '4:15 PM', date: 'Mar 27' },
      { from: 'agent', text: 'Hi Priya. Glad you\u2019re here.', time: '4:15 PM', date: 'Mar 27' },
      { from: 'patient', text: 'Presentation went okay I think.', time: '4:18 PM', date: 'Mar 27' },
      { from: 'agent', text: 'That\u2019s good to hear.', time: '4:18 PM', date: 'Mar 27' },
    ],
  },
  {
    id: 'marcus',
    name: 'Marcus W.',
    initials: 'MW',
    status: 'new',
    lastActive: 'Not yet active',
    agent: null,
    summary: 'Marcus was onboarded today following an intake assessment. No AI sessions have been recorded yet.',
    recommendation: 'Configure a sub-agent based on the intake assessment before the first automated check-in.',
    messages: [],
  },
]

export const signals = [
  { id: 1, patientId: 'elena', patientName: 'Elena V.', type: 'critical', text: 'Denial marker detected in grief processing', detail: '"If I stop going it means she\u2019s really gone" \u2014 third house visit this week.', time: '2:15 PM', date: 'Today', acknowledged: false },
  { id: 2, patientId: 'elena', patientName: 'Elena V.', type: 'warning', text: 'Sleep deterioration reported', detail: 'Two consecutive nights of 2\u20133 hours. Correlates with increased evening engagement.', time: '1:50 PM', date: 'Today', acknowledged: false },
  { id: 3, patientId: 'rashid', patientName: 'Rashid O.', type: 'warning', text: 'Nostalgia language about pre-sobriety life', detail: '"I miss the way things were" \u2014 romanticization pattern without naming substance directly.', time: '11:40 AM', date: 'Today', acknowledged: false },
  { id: 4, patientId: 'sophie', patientName: 'Sophie C.', type: 'positive', text: 'Self-identified anxious attachment pattern', detail: 'Independently recognized anticipatory anxiety around ex\u2019s messages \u2014 cognitive milestone.', time: '7:30 PM', date: 'Yesterday', acknowledged: false },
  { id: 5, patientId: 'tomasz', patientName: 'Tomasz K.', type: 'warning', text: 'Third consecutive late-night work session', detail: 'Reported staying at office until midnight. Deflected questions about rest.', time: '11:55 PM', date: 'Yesterday', acknowledged: true },
  { id: 6, patientId: 'priya', patientName: 'Priya N.', type: 'positive', text: 'First unsolicited life update', detail: 'Voluntarily shared presentation outcome \u2014 shift from typical one-word check-ins.', time: '4:18 PM', date: 'Mar 27', acknowledged: true },
  { id: 7, patientId: 'rashid', patientName: 'Rashid O.', type: 'info', text: 'Reached 90-day sobriety milestone', detail: 'Acknowledged the milestone but expressed it felt anticlimactic.', time: '10:05 AM', date: 'Mar 27', acknowledged: true },
]

export const agentTemplates = [
  { id: 'anchor', label: 'Steady anchor', description: 'Grounding, constant presence. Prioritizes safety and stability.', defaults: { warmth: 9, directness: 3, verbosity: 6 }, styles: ['Grounding techniques', 'Emotion validation'] },
  { id: 'structured', label: 'Structured guide', description: 'Organized, step-by-step. Builds accountability and routine.', defaults: { warmth: 5, directness: 8, verbosity: 7 }, styles: ['Cognitive reframing', 'Motivational interviewing'] },
  { id: 'reflective', label: 'Reflective guide', description: 'Mirrors patterns, connects dots. Builds self-awareness.', defaults: { warmth: 6, directness: 5, verbosity: 5 }, styles: ['Active listening', 'Strengths-based reflection'] },
  { id: 'perspective', label: 'Perspective shifter', description: 'Gentle reframing. Challenges assumptions with curiosity.', defaults: { warmth: 6, directness: 7, verbosity: 6 }, styles: ['Cognitive reframing', 'Psychoeducation'] },
  { id: 'soft', label: 'Soft presence', description: 'Minimal, warm, non-intrusive. Respects low-engagement needs.', defaults: { warmth: 8, directness: 2, verbosity: 2 }, styles: ['Mindfulness prompts'] },
]

export const appointments = [
  // Today — Sunday, March 29, 2026
  { id: 1, patientId: 'elena',  patientName: 'Elena V.',  initials: 'EV', patientStatus: 'crisis',  type: 'Crisis Check-in', date: '2026-03-29', startTime: '10:00', endTime: '10:50', status: 'completed' },
  { id: 2, patientId: 'rashid', patientName: 'Rashid O.', initials: 'RO', patientStatus: 'warning', type: 'Session',          date: '2026-03-29', startTime: '14:00', endTime: '14:50', status: 'upcoming'  },
  { id: 3, patientId: 'sophie', patientName: 'Sophie C.', initials: 'SC', patientStatus: 'active',  type: 'Session',          date: '2026-03-29', startTime: '16:00', endTime: '16:50', status: 'upcoming'  },
  // Monday, March 30
  { id: 4, patientId: 'tomasz', patientName: 'Tomasz K.', initials: 'TK', patientStatus: 'active',  type: 'Session',          date: '2026-03-30', startTime: '09:00', endTime: '09:50', status: 'upcoming'  },
  { id: 5, patientId: 'priya',  patientName: 'Priya N.',  initials: 'PN', patientStatus: 'quiet',   type: 'Check-in',         date: '2026-03-30', startTime: '11:00', endTime: '11:30', status: 'upcoming'  },
  // Tuesday, March 31
  { id: 6, patientId: 'marcus', patientName: 'Marcus W.', initials: 'MW', patientStatus: 'new',     type: 'Intake',           date: '2026-03-31', startTime: '10:00', endTime: '11:00', status: 'upcoming'  },
  { id: 7, patientId: 'elena',  patientName: 'Elena V.',  initials: 'EV', patientStatus: 'crisis',  type: 'Session',          date: '2026-03-31', startTime: '14:00', endTime: '14:50', status: 'upcoming'  },
  // Wednesday, April 1
  { id: 8, patientId: 'rashid', patientName: 'Rashid O.', initials: 'RO', patientStatus: 'warning', type: 'Session',          date: '2026-04-01', startTime: '10:00', endTime: '10:50', status: 'upcoming'  },
  { id: 9, patientId: 'sophie', patientName: 'Sophie C.', initials: 'SC', patientStatus: 'active',  type: 'Follow-up',        date: '2026-04-01', startTime: '15:00', endTime: '15:50', status: 'upcoming'  },
  // Thursday, April 2
  { id: 10, patientId: 'tomasz', patientName: 'Tomasz K.', initials: 'TK', patientStatus: 'active', type: 'Session',          date: '2026-04-02', startTime: '09:00', endTime: '09:50', status: 'upcoming'  },
]

export const responseStyles = [
  'Grounding techniques',
  'Cognitive reframing',
  'Motivational interviewing',
  'Active listening',
  'Emotion validation',
  'Psychoeducation',
  'Mindfulness prompts',
  'Strengths-based reflection',
]

export const defaultMasterPrompt = `You are a compassionate mental wellness companion working under the guidance of a licensed therapist. Your role is to hold space, reflect, and support \u2014 never to diagnose, prescribe, or provide clinical advice.

All conversations are confidential and reported only to the supervising therapist. You adapt your tone, style, and boundaries based on the per-patient configuration provided by the therapist.

Core principles:
\u2022 Meet the patient where they are emotionally
\u2022 Reflect patterns without interpreting them
\u2022 Never minimize, rush, or redirect feelings prematurely
\u2022 Escalate crisis signals to the therapist immediately
\u2022 Maintain warm, non-judgmental presence at all times`

export const safetyBoundaries = [
  'Never diagnose or label conditions',
  'Do not discuss medication changes',
  'Redirect substance glorification to coping strategies',
  'Avoid confrontational language',
  'Do not interpret unconscious material',
  'If engagement drops, simplify responses',
  'Never compare patients\u2019 progress',
  'Escalate crisis signals to therapist immediately',
]
