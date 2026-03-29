/**
 * Patient-facing chat interface with visual themes.
 *
 * Three sub-views: registration form → chat → scheduler.
 * Supports four themes (default, floral, starryNight, enthusiastic) selected
 * via the TopBar dropdown. Themes define a full color palette applied through
 * inline styles and CSS custom properties (--theme-accent, --theme-focus,
 * --theme-placeholder). Decorative background elements (blurred shapes, star
 * field) are rendered by the ThemeDecor component and styled via CSS classes
 * in index.css (e.g. .theme-starryNight::before).
 *
 * Props:
 *   patientModeUser  — patient ID after registration (null = show registration)
 *   backendAvailable — whether to call the real chat API or use fallback replies
 *   onRegister       — callback(name, intro) to create a patient
 *   theme            — one of: 'default' | 'floral' | 'starryNight' | 'enthusiastic'
 */

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
  default: {
    label: 'Default',
    bg: '#FEFDFB',
    card: '#ffffff',
    accent: '#4A7C6F',
    accentHover: '#3d6a5e',
    accentSoft: '#f2f7f5',
    accentMuted: '#6b9e91',
    heading: '#57534e',
    body: '#78716c',
    muted: '#a8a29e',
    border: '#e7e5e4',
    focusRing: '#c7ddd5',
    breathe: '#c7ddd5',
    input: '#44403c',
    placeholder: '#d6d3d1',
  },
  floral: {
    label: 'Floral',
    bg: [
      'radial-gradient(circle at 80% 10%, rgba(249,168,212,0.25) 0%, transparent 40%)',
      'radial-gradient(circle at 15% 85%, rgba(251,207,232,0.3) 0%, transparent 45%)',
      'radial-gradient(circle at 55% 45%, rgba(253,242,248,0.4) 0%, transparent 55%)',
      'radial-gradient(circle at 35% 15%, rgba(244,114,182,0.1) 0%, transparent 35%)',
      'linear-gradient(160deg, #fdf2f8 0%, #fce7f3 30%, #fff1f2 60%, #fefdfb 100%)',
    ].join(', '),
    card: 'rgba(255,255,255,0.85)',
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
    bg: [
      'radial-gradient(ellipse at 70% 20%, rgba(88,28,135,0.35) 0%, transparent 50%)',
      'radial-gradient(ellipse at 25% 75%, rgba(30,58,138,0.4) 0%, transparent 50%)',
      'radial-gradient(ellipse at 90% 80%, rgba(67,56,202,0.2) 0%, transparent 40%)',
      'radial-gradient(circle at 50% 50%, rgba(15,23,42,0.3) 0%, transparent 70%)',
      'linear-gradient(160deg, #0f172a 0%, #1e1b4b 45%, #172554 80%, #0c1222 100%)',
    ].join(', '),
    card: 'rgba(30,27,75,0.45)',
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
    bg: [
      'radial-gradient(circle at 50% 0%, rgba(251,191,36,0.22) 0%, transparent 50%)',
      'radial-gradient(circle at 85% 75%, rgba(251,146,60,0.18) 0%, transparent 45%)',
      'radial-gradient(circle at 15% 55%, rgba(252,211,77,0.15) 0%, transparent 40%)',
      'radial-gradient(circle at 60% 90%, rgba(249,115,22,0.1) 0%, transparent 35%)',
      'linear-gradient(160deg, #fff7ed 0%, #ffedd5 30%, #fef3c7 60%, #fffbeb 100%)',
    ].join(', '),
    card: 'rgba(255,255,255,0.88)',
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

/* ── Decorative background elements per theme ───────────────────── */
function ThemeDecor({ theme }) {
  const base = { position: 'absolute', pointerEvents: 'none', borderRadius: '50%' }

  if (theme === 'floral') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        {/* Large organic petal shapes */}
        <div style={{ ...base, width: 340, height: 340, borderRadius: '62% 38% 28% 72% / 58% 32% 68% 42%', background: 'rgba(249,168,212,0.14)', filter: 'blur(45px)', top: -90, right: -70 }} />
        <div style={{ ...base, width: 280, height: 280, borderRadius: '38% 62% 72% 28% / 42% 68% 32% 58%', background: 'rgba(251,207,232,0.2)', filter: 'blur(40px)', bottom: -50, left: -50 }} />
        <div style={{ ...base, width: 200, height: 200, borderRadius: '50% 50% 30% 70% / 60% 40% 60% 40%', background: 'rgba(244,114,182,0.1)', filter: 'blur(30px)', top: '30%', left: '10%' }} />
        <div style={{ ...base, width: 150, height: 150, background: 'rgba(232,121,249,0.08)', filter: 'blur(25px)', top: '15%', right: '20%' }} />
        <div style={{ ...base, width: 120, height: 100, borderRadius: '70% 30% 50% 50% / 40% 60% 40% 60%', background: 'rgba(236,72,153,0.06)', filter: 'blur(20px)', bottom: '20%', right: '10%' }} />
        {/* Small petal accents */}
        <div style={{ ...base, width: 60, height: 60, background: 'rgba(249,168,212,0.15)', filter: 'blur(8px)', top: '55%', left: '50%' }} />
        <div style={{ ...base, width: 40, height: 40, background: 'rgba(244,114,182,0.12)', filter: 'blur(6px)', top: '70%', left: '25%' }} />
      </div>
    )
  }

  if (theme === 'starryNight') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        {/* Nebula clouds */}
        <div style={{ ...base, width: 420, height: 320, background: 'radial-gradient(ellipse, rgba(88,28,135,0.22) 0%, transparent 70%)', filter: 'blur(50px)', top: -40, right: -100 }} />
        <div style={{ ...base, width: 380, height: 280, background: 'radial-gradient(ellipse, rgba(30,58,138,0.28) 0%, transparent 70%)', filter: 'blur(45px)', bottom: 30, left: -80 }} />
        <div style={{ ...base, width: 250, height: 200, background: 'radial-gradient(ellipse, rgba(67,56,202,0.15) 0%, transparent 70%)', filter: 'blur(35px)', top: '40%', right: '15%' }} />
        {/* Moon glow */}
        <div style={{ ...base, width: 90, height: 90, background: 'radial-gradient(circle, rgba(253,230,138,0.14) 0%, rgba(253,230,138,0.05) 50%, transparent 70%)', top: 50, right: 70 }} />
        <div style={{ ...base, width: 40, height: 40, background: 'radial-gradient(circle, rgba(253,230,138,0.25) 0%, transparent 70%)', top: 75, right: 95 }} />
      </div>
    )
  }

  if (theme === 'enthusiastic') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        {/* Sunburst glow */}
        <div style={{ ...base, width: 550, height: 550, background: 'radial-gradient(circle, rgba(251,191,36,0.16) 0%, rgba(251,191,36,0.04) 40%, transparent 60%)', top: -250, left: '50%', transform: 'translateX(-50%)' }} />
        {/* Warm orbs */}
        <div style={{ ...base, width: 260, height: 260, background: 'rgba(251,146,60,0.1)', filter: 'blur(35px)', bottom: -60, right: -40 }} />
        <div style={{ ...base, width: 180, height: 180, background: 'rgba(252,211,77,0.12)', filter: 'blur(28px)', top: '35%', left: -30 }} />
        <div style={{ ...base, width: 120, height: 120, background: 'rgba(249,115,22,0.08)', filter: 'blur(20px)', bottom: '25%', left: '55%' }} />
        {/* Bright small accents */}
        <div style={{ ...base, width: 50, height: 50, background: 'rgba(251,191,36,0.18)', filter: 'blur(10px)', top: '20%', right: '25%' }} />
        <div style={{ ...base, width: 35, height: 35, background: 'rgba(251,146,60,0.15)', filter: 'blur(8px)', bottom: '40%', left: '30%' }} />
      </div>
    )
  }

  return null
}

export default function PatientChat({ patientModeUser, backendAvailable, onRegister, theme = 'default' }) {
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

  // Load conversation history when patient is identified
  useEffect(() => {
    if (!patientModeUser || !backendAvailable) return
    api.getPatients().then(patients => {
      const p = patients.find(pt => pt.id === patientModeUser)
      if (p && p.messages.length > 0) {
        setMessages(p.messages.map(m => ({ from: m.from, text: m.text })))
      }
    }).catch(() => {})
  }, [patientModeUser, backendAvailable])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const t = THEMES[theme] || THEMES.default

  const themeVars = {
    '--theme-accent': t.accent,
    '--theme-focus': t.focusRing,
    '--theme-placeholder': t.placeholder,
  }

  const breatheStyle = {
    backgroundColor: t.breathe,
    boxShadow: theme === 'starryNight' ? `0 0 28px ${t.breathe}55` : 'none',
  }

  const containerClass = `flex-1 flex flex-col items-center relative overflow-hidden isolate ${theme !== 'default' ? `theme-${theme}` : ''}`

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

  const bookSlot = (day, slot) => {
    setBookedSlot({ date: day, slot })

    // Persist to backend
    if (backendAvailable && patientModeUser) {
      const dateStr = `${cal.year}-${String(cal.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      // Parse "9:00 AM" → "09:00", add 50 min for end
      const [time, ampm] = slot.split(' ')
      const [h, m] = time.split(':').map(Number)
      const hour24 = ampm === 'PM' && h !== 12 ? h + 12 : ampm === 'AM' && h === 12 ? 0 : h
      const start = `${String(hour24).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      const endH = hour24 + (m + 50 >= 60 ? 1 : 0)
      const endM = (m + 50) % 60
      const end = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
      api.createAppointment(patientModeUser, dateStr, start, end).catch(() => {})
    }
  }

  const calCells = []
  for (let i = 0; i < cal.firstDay; i++) calCells.push(null)
  for (let d = 1; d <= cal.daysInMonth; d++) calCells.push(d)

  const selectedSlots = selectedDay ? (cal.slotMap[selectedDay] || []) : []
  const selectedDow = selectedDay ? DAY_HEADERS[new Date(cal.year, cal.month, selectedDay).getDay()] : ''

  /* ── Registration ──────────────────────────────────────────────── */
  if (!patientModeUser) {
    return (
      <div className={`${containerClass} justify-center`} style={{ background: t.bg, ...themeVars }}>
        <ThemeDecor theme={theme} />

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
                Brief intro <span className="font-normal normal-case tracking-normal" style={{ opacity: 0.65 }}>(optional)</span>
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
      <div className={`${containerClass} overflow-y-auto`} style={{ background: t.bg, ...themeVars }}>
        <ThemeDecor theme={theme} />

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
    <div className={containerClass} style={{ background: t.bg, ...themeVars }}>
      <ThemeDecor theme={theme} />

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
