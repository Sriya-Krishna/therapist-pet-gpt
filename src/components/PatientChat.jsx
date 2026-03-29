import { useState, useRef, useEffect } from 'react'
import { Send, CalendarDays, ArrowLeft, Check, Loader2 } from 'lucide-react'
import * as api from '../api'

const agentFallbackReplies = [
  'Thank you for sharing that. What part of it feels most present right now?',
  'I\u2019m here with you. Take all the time you need.',
  'That\u2019s a really honest thing to say. What would feel supportive right now?',
  'I hear you. That sounds like it carries weight.',
  'You don\u2019t have to have it figured out. Just being here is enough.',
]

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function buildMonthAvailability() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const today = now.getDate()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const slotOptions = [
    ['9:00 AM', '10:30 AM', '2:00 PM', '4:00 PM'],
    ['10:00 AM', '11:30 AM', '3:00 PM'],
    ['9:00 AM', '1:00 PM', '3:30 PM', '5:00 PM'],
    [],
    ['10:00 AM', '2:00 PM', '4:30 PM'],
    ['9:30 AM', '11:00 AM'],
    [],
  ]

  const slotMap = {}
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(year, month, d).getDay()
    if (d <= today || dow === 0) {
      slotMap[d] = []
    } else {
      slotMap[d] = slotOptions[d % slotOptions.length]
    }
  }

  return { year, month, today, firstDay, daysInMonth, slotMap, monthLabel: `${MONTH_NAMES[month]} ${year}` }
}

const cal = buildMonthAvailability()

/* ── Theme definitions ──────────────────────────────────────────── */
const THEMES = {
  floral: {
    label: 'Floral',
    bg: 'linear-gradient(160deg, #fdf2f8 0%, #fce7f3 40%, #fff1f2 70%, #fefdfb 100%)',
    card: '#ffffff',
    accent: '#ec4899',
    accentHover: '#db2777',
    accentSoft: '#fce7f3',
    accentMuted: '#f472b6',
    heading: '#831843',
    body: '#78716c',
    muted: '#be185d',
    border: '#fecdd3',
    focusRing: '#fbcfe8',
    breathe: '#f9a8d4',
    input: '#44403c',
    placeholder: '#d4a0b0',
  },
  starryNight: {
    label: 'Starry Night',
    bg: 'linear-gradient(160deg, #0f172a 0%, #1e1b4b 50%, #172554 100%)',
    card: 'rgba(30,27,75,0.5)',
    accent: '#8b5cf6',
    accentHover: '#7c3aed',
    accentSoft: 'rgba(139,92,246,0.15)',
    accentMuted: '#a78bfa',
    heading: '#e2e8f0',
    body: '#94a3b8',
    muted: '#64748b',
    border: 'rgba(148,163,184,0.2)',
    focusRing: 'rgba(139,92,246,0.4)',
    breathe: '#a78bfa',
    input: '#e2e8f0',
    placeholder: '#475569',
  },
  enthusiastic: {
    label: 'Enthusiastic',
    bg: 'linear-gradient(160deg, #fff7ed 0%, #ffedd5 40%, #fef3c7 70%, #fffbeb 100%)',
    card: '#ffffff',
    accent: '#f97316',
    accentHover: '#ea580c',
    accentSoft: '#ffedd5',
    accentMuted: '#fb923c',
    heading: '#7c2d12',
    body: '#78716c',
    muted: '#c2410c',
    border: '#fed7aa',
    focusRing: '#fdba74',
    breathe: '#fb923c',
    input: '#44403c',
    placeholder: '#c49060',
  },
}

export default function PatientChat({ patientModeUser, backendAvailable, onRegister, theme = 'floral' }) {
  const [regName, setRegName] = useState('')
  const [regIntro, setRegIntro] = useState('')
  const [messages, setMessages] = useState([
    { from: 'agent', text: 'Welcome back. How are you feeling today?' },
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [showScheduler, setShowScheduler] = useState(false)
  const [selectedDay, setSelectedDay] = useState(null)
  const [bookedSlot, setBookedSlot] = useState(null)
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const t = THEMES[theme] || THEMES.floral

  const themeVars = {
    '--theme-accent': t.accent,
    '--theme-focus': t.focusRing,
    '--theme-placeholder': t.placeholder,
  }

  const breatheStyle = {
    backgroundColor: t.breathe,
    boxShadow: theme === 'starryNight' ? `0 0 24px ${t.breathe}50` : 'none',
  }

  const send = async () => {
    if (!input.trim() || sending) return
    const text = input
    setInput('')
    setMessages(prev => [...prev, { from: 'patient', text }])

    if (backendAvailable && patientModeUser) {
      setSending(true)
      try {
        const data = await api.chat(patientModeUser, text)
        setMessages(prev => [...prev, { from: 'agent', text: data.response }])
      } catch {
        setMessages(prev => [...prev, { from: 'agent', text: 'Sorry, something went wrong. Please try again.' }])
      } finally {
        setSending(false)
      }
    } else {
      const reply = agentFallbackReplies[Math.floor(Math.random() * agentFallbackReplies.length)]
      setMessages(prev => [...prev, { from: 'agent', text: reply }])
    }
  }

  const bookSlot = (date, slot) => {
    setBookedSlot({ date, slot })
  }

  const calCells = []
  for (let i = 0; i < cal.firstDay; i++) calCells.push(null)
  for (let d = 1; d <= cal.daysInMonth; d++) calCells.push(d)

  const selectedSlots = selectedDay ? (cal.slotMap[selectedDay] || []) : []
  const selectedDow = selectedDay ? DAY_HEADERS[new Date(cal.year, cal.month, selectedDay).getDay()] : ''

  /* ── Registration ──────────────────────────────────────────────── */
  if (!patientModeUser) {
    return (
      <div
        className={`flex-1 flex flex-col items-center justify-center relative overflow-hidden isolate theme-${theme}`}
        style={{ background: t.bg, ...themeVars }}
      >
        <div className="w-full max-w-sm px-4 relative z-10">
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-full animate-breathe" style={breatheStyle} />
          </div>

          <div className="text-center mb-6">
            <h1 className="text-base font-medium" style={{ color: t.heading }}>Welcome to MindBridge</h1>
            <p className="text-[12px] mt-1" style={{ color: t.muted }}>Tell us a little about yourself to get started</p>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault()
            if (!regName.trim()) return
            onRegister(regName.trim(), regIntro.trim())
          }}>
            <div className="mb-4">
              <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5" style={{ color: t.muted }}>
                Your name
              </label>
              <input
                value={regName}
                onChange={e => setRegName(e.target.value)}
                placeholder="First and last name"
                autoFocus
                className="w-full text-[14px] border rounded-xl px-4 py-3 themed-input"
                style={{ borderColor: t.border, backgroundColor: t.card, color: t.input }}
              />
            </div>

            <div className="mb-5">
              <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5" style={{ color: t.muted }}>
                Brief intro <span className="font-normal normal-case tracking-normal" style={{ color: t.muted, opacity: 0.65 }}>(optional)</span>
              </label>
              <textarea
                value={regIntro}
                onChange={e => setRegIntro(e.target.value)}
                rows={3}
                placeholder="What brings you here today?"
                className="w-full text-[14px] border rounded-xl px-4 py-3 resize-none themed-input"
                style={{ borderColor: t.border, backgroundColor: t.card, color: t.input }}
              />
            </div>

            <button
              type="submit"
              disabled={!regName.trim()}
              className="w-full text-[14px] font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed rounded-xl px-5 py-3 themed-btn-primary"
              style={{ backgroundColor: t.accent }}
            >
              Get started
            </button>

            <p className="text-center text-[11px] mt-4" style={{ color: t.muted, opacity: 0.6 }}>
              Everything here is between you and your care team
            </p>
          </form>
        </div>
      </div>
    )
  }

  /* ── Scheduler ─────────────────────────────────────────────────── */
  if (showScheduler) {
    return (
      <div
        className={`flex-1 flex flex-col items-center overflow-y-auto relative isolate theme-${theme}`}
        style={{ background: t.bg, ...themeVars }}
      >
        <div className="w-full max-w-md px-4 pt-8 pb-8 relative z-10">
          <button
            onClick={() => { setShowScheduler(false); setSelectedDay(null); setBookedSlot(null) }}
            className="flex items-center gap-1.5 text-[13px] mb-6 transition-colors"
            style={{ color: t.muted }}
          >
            <ArrowLeft size={14} />
            Back to chat
          </button>

          <h1 className="text-lg font-medium mb-1" style={{ color: t.heading }}>Schedule a session</h1>
          <p className="text-[13px] mb-6" style={{ color: t.muted }}>Pick a day to see Dr. Rivera&apos;s availability</p>

          {bookedSlot ? (
            <div className="rounded-xl p-6 text-center" style={{ backgroundColor: t.card, border: `1px solid ${t.border}` }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: t.accentSoft }}>
                <Check size={20} style={{ color: t.accent }} />
              </div>
              <p className="text-[15px] font-medium mb-1" style={{ color: t.heading }}>Session booked</p>
              <p className="text-[13px]" style={{ color: t.body }}>
                {selectedDow}, {MONTH_NAMES[cal.month]} {bookedSlot.date} at {bookedSlot.slot}
              </p>
              <p className="text-[12px] mt-1" style={{ color: t.muted }}>with Dr. Rivera</p>
              <button
                onClick={() => { setShowScheduler(false); setBookedSlot(null); setSelectedDay(null) }}
                className="mt-4 text-[13px] font-medium transition-colors"
                style={{ color: t.accent }}
              >
                Return to chat
              </button>
            </div>
          ) : (
            <>
              {/* Month calendar */}
              <div className="rounded-xl p-4 mb-5" style={{ backgroundColor: t.card, border: `1px solid ${t.border}` }}>
                <div className="text-[13px] font-semibold text-center mb-3" style={{ color: t.heading }}>{cal.monthLabel}</div>
                <div className="grid grid-cols-7 gap-y-1 gap-x-0">
                  {DAY_HEADERS.map(d => (
                    <div key={d} className="text-[10px] font-medium text-center pb-2" style={{ color: t.muted }}>{d}</div>
                  ))}
                  {calCells.map((day, i) => {
                    if (day === null) return <div key={`e${i}`} />
                    const slots = cal.slotMap[day] || []
                    const available = slots.length > 0
                    const isPast = day <= cal.today
                    const isSelected = selectedDay === day
                    return (
                      <button
                        key={day}
                        onClick={() => available && setSelectedDay(day)}
                        disabled={!available}
                        className="relative mx-auto w-9 h-9 rounded-lg text-[13px] transition-all"
                        style={{
                          backgroundColor: isSelected ? t.accent : 'transparent',
                          color: isSelected ? '#ffffff' : available ? t.heading : t.muted,
                          fontWeight: isSelected ? 600 : available ? 500 : 400,
                          filter: !available && !isPast ? 'blur(1.5px)' : 'none',
                          cursor: available ? 'pointer' : 'default',
                          boxShadow: isSelected ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
                          opacity: !available && isPast ? 0.5 : 1,
                        }}
                      >
                        {day}
                        {available && !isSelected && (
                          <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ backgroundColor: t.accentMuted }} />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Time slots */}
              {selectedDay && selectedSlots.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: t.muted }}>
                    {selectedDow}, {MONTH_NAMES[cal.month]} {selectedDay}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedSlots.map(slot => (
                      <button
                        key={slot}
                        onClick={() => bookSlot(selectedDay, slot)}
                        className="rounded-lg px-4 py-3 text-[14px] transition-all text-center themed-btn-outline"
                        style={{ backgroundColor: t.card, border: `1px solid ${t.border}`, color: t.heading }}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!selectedDay && (
                <div className="text-center py-6">
                  <p className="text-[13px]" style={{ color: t.muted, opacity: 0.6 }}>Select an available day to see open times</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  /* ── Chat ───────────────────────────────────────────────────────── */
  return (
    <div
      className={`flex-1 flex flex-col items-center relative overflow-hidden isolate theme-${theme}`}
      style={{ background: t.bg, ...themeVars }}
    >
      {/* Breathing circle */}
      <div className="pt-8 pb-2 relative z-10">
        <div className="w-14 h-14 rounded-full animate-breathe" style={breatheStyle} />
      </div>

      <div className="text-center mb-2 relative z-10">
        <h1 className="text-base font-medium" style={{ color: t.heading }}>Your space</h1>
        <p className="text-[12px] mt-0.5" style={{ color: t.muted }}>Everything here is between you and your care team</p>
      </div>

      <button
        onClick={() => setShowScheduler(true)}
        className="flex items-center gap-1.5 text-[12px] font-medium mb-4 px-3 py-1.5 rounded-full transition-colors relative z-10"
        style={{ color: t.accent, border: `1px solid ${t.border}` }}
      >
        <CalendarDays size={13} />
        Schedule a session
      </button>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto w-full max-w-lg px-4 relative z-10">
        {messages.map((m, i) => (
          <div key={i} className="py-3">
            {m.from === 'agent' && (
              <span className="text-[10px] uppercase tracking-wider font-medium block mb-1" style={{ color: t.accentMuted }}>Care agent</span>
            )}
            <p className="text-[15px] leading-relaxed" style={{ color: m.from === 'agent' ? t.heading : t.body }}>
              {m.text}
            </p>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="w-full max-w-lg px-4 pb-8 pt-4 relative z-10">
        <div className="relative">
          <textarea
            rows={2}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            placeholder="Write what&#x2019;s on your mind&#x2026;"
            className="w-full border rounded-xl px-4 py-3 pr-12 text-[14px] resize-none themed-input"
            style={{ borderColor: t.border, color: t.input, backgroundColor: t.card }}
          />
          <button
            onClick={send}
            disabled={sending}
            className="absolute right-3 bottom-3 disabled:opacity-40 transition-colors"
            style={{ color: t.accent }}
          >
            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  )
}