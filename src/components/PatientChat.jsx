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

export default function PatientChat({ patientModeUser, backendAvailable, onRegister }) {
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

  // Build calendar grid cells
  const calCells = []
  for (let i = 0; i < cal.firstDay; i++) calCells.push(null)
  for (let d = 1; d <= cal.daysInMonth; d++) calCells.push(d)

  const selectedSlots = selectedDay ? (cal.slotMap[selectedDay] || []) : []
  const selectedDow = selectedDay ? DAY_HEADERS[new Date(cal.year, cal.month, selectedDay).getDay()] : ''

  if (!patientModeUser) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center" style={{ background: '#FEFDFB' }}>
        <div className="w-full max-w-sm px-4">
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-full bg-sage-200 animate-breathe" />
          </div>

          <div className="text-center mb-6">
            <h1 className="text-base font-medium text-stone-600">Welcome to MindBridge</h1>
            <p className="text-[12px] text-stone-400 mt-1">Tell us a little about yourself to get started</p>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault()
            if (!regName.trim()) return
            onRegister(regName.trim(), regIntro.trim())
          }}>
            <div className="mb-4">
              <label className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block mb-1.5">
                Your name
              </label>
              <input
                value={regName}
                onChange={e => setRegName(e.target.value)}
                placeholder="First and last name"
                autoFocus
                className="w-full text-[14px] border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sage-200 focus:border-sage-300 placeholder:text-stone-300 bg-white"
              />
            </div>

            <div className="mb-5">
              <label className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block mb-1.5">
                Brief intro <span className="font-normal normal-case tracking-normal text-stone-300">(optional)</span>
              </label>
              <textarea
                value={regIntro}
                onChange={e => setRegIntro(e.target.value)}
                rows={3}
                placeholder="What brings you here today?"
                className="w-full text-[14px] border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sage-200 focus:border-sage-300 placeholder:text-stone-300 bg-white resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={!regName.trim()}
              className="w-full text-[14px] font-medium text-white bg-sage-500 hover:bg-sage-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl px-5 py-3 transition-colors"
            >
              Get started
            </button>

            <p className="text-center text-[11px] text-stone-300 mt-4">
              Everything here is between you and your care team
            </p>
          </form>
        </div>
      </div>
    )
  }

  if (showScheduler) {
    return (
      <div className="flex-1 flex flex-col items-center overflow-y-auto" style={{ background: '#FEFDFB' }}>
        <div className="w-full max-w-md px-4 pt-8 pb-8">
          <button
            onClick={() => { setShowScheduler(false); setSelectedDay(null); setBookedSlot(null) }}
            className="flex items-center gap-1.5 text-[13px] text-stone-400 hover:text-stone-600 mb-6 transition-colors"
          >
            <ArrowLeft size={14} />
            Back to chat
          </button>

          <h1 className="text-lg font-medium text-stone-700 mb-1">Schedule a session</h1>
          <p className="text-[13px] text-stone-400 mb-6">Pick a day to see Dr. Rivera&apos;s availability</p>

          {bookedSlot ? (
            <div className="bg-white border border-sage-200 rounded-xl p-6 text-center">
              <div className="w-10 h-10 rounded-full bg-sage-100 flex items-center justify-center mx-auto mb-3">
                <Check size={20} className="text-sage-600" />
              </div>
              <p className="text-[15px] font-medium text-stone-800 mb-1">Session booked</p>
              <p className="text-[13px] text-stone-500">
                {selectedDow}, {MONTH_NAMES[cal.month]} {bookedSlot.date} at {bookedSlot.slot}
              </p>
              <p className="text-[12px] text-stone-400 mt-1">with Dr. Rivera</p>
              <button
                onClick={() => { setShowScheduler(false); setBookedSlot(null); setSelectedDay(null) }}
                className="mt-4 text-[13px] text-sage-600 hover:text-sage-800 font-medium transition-colors"
              >
                Return to chat
              </button>
            </div>
          ) : (
            <>
              {/* Month calendar */}
              <div className="bg-white border border-stone-200/60 rounded-xl p-4 mb-5">
                <div className="text-[13px] font-semibold text-stone-700 text-center mb-3">{cal.monthLabel}</div>
                <div className="grid grid-cols-7 gap-y-1 gap-x-0">
                  {DAY_HEADERS.map(d => (
                    <div key={d} className="text-[10px] text-stone-400 font-medium text-center pb-2">{d}</div>
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
                        className={`relative mx-auto w-9 h-9 rounded-lg text-[13px] transition-all ${
                          isSelected
                            ? 'bg-sage-500 text-white font-semibold shadow-sm'
                            : available
                              ? 'text-stone-700 hover:bg-sage-50 font-medium'
                              : isPast
                                ? 'text-stone-300 cursor-default'
                                : 'text-stone-300 blur-[1.5px] cursor-default'
                        }`}
                      >
                        {day}
                        {available && !isSelected && (
                          <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-sage-400" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Time slots */}
              {selectedDay && selectedSlots.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-3">
                    {selectedDow}, {MONTH_NAMES[cal.month]} {selectedDay}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedSlots.map(slot => (
                      <button
                        key={slot}
                        onClick={() => bookSlot(selectedDay, slot)}
                        className="bg-white border border-stone-200 rounded-lg px-4 py-3 text-[14px] text-stone-700 hover:border-sage-400 hover:bg-sage-50/50 transition-all text-center"
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!selectedDay && (
                <div className="text-center py-6">
                  <p className="text-[13px] text-stone-300">Select an available day to see open times</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col items-center" style={{ background: '#FEFDFB' }}>
      {/* Breathing circle */}
      <div className="pt-8 pb-2">
        <div className="w-14 h-14 rounded-full bg-sage-200 animate-breathe" />
      </div>

      <div className="text-center mb-2">
        <h1 className="text-base font-medium text-stone-600">Your space</h1>
        <p className="text-[12px] text-stone-400 mt-0.5">Everything here is between you and your care team</p>
      </div>

      <button
        onClick={() => setShowScheduler(true)}
        className="flex items-center gap-1.5 text-[12px] text-sage-600 hover:text-sage-800 font-medium mb-4 px-3 py-1.5 rounded-full border border-sage-200 hover:bg-sage-50 transition-colors"
      >
        <CalendarDays size={13} />
        Schedule a session
      </button>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto w-full max-w-lg px-4">
        {messages.map((m, i) => (
          <div key={i} className="py-3">
            {m.from === 'agent' && (
              <span className="text-[10px] text-sage-500 uppercase tracking-wider font-medium block mb-1">Care agent</span>
            )}
            <p className={`text-[15px] leading-relaxed ${m.from === 'agent' ? 'text-sage-800' : 'text-stone-700'}`}>
              {m.text}
            </p>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="w-full max-w-lg px-4 pb-8 pt-4">
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
            placeholder="Write what\u2019s on your mind\u2026"
            className="w-full border border-stone-200 rounded-xl px-4 py-3 pr-12 text-[14px] text-stone-700 resize-none focus:outline-none focus:ring-2 focus:ring-sage-200 focus:border-sage-300 placeholder:text-stone-300 bg-white"
          />
          <button
            onClick={send}
            disabled={sending}
            className="absolute right-3 bottom-3 text-sage-500 hover:text-sage-700 disabled:opacity-40 transition-colors"
          >
            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  )
}
