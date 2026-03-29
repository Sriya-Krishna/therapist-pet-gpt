/**
 * Default view when no patient is selected — calendar + master prompt editor.
 *
 * Left column: interactive monthly calendar with appointment dots.
 *   Clicking a day shows that day's schedule. Stats row at the bottom.
 *
 * Right column:
 *   - Day schedule: list of appointments sorted by start time, with
 *     patient avatars, status badges, and completion state.
 *   - Master prompt editor: textarea with save button. The master prompt
 *     is inherited by every patient agent (see backend/prompts/assemble.py).
 */

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { appointments as fallbackAppointments } from '../data/mock'
import * as api from '../api'

const TODAY = '2026-03-29'

const patientStatusStyle = {
  crisis:  { avatar: 'bg-red-100 text-red-700',    badge: 'bg-red-100 text-red-700',    dot: 'bg-red-400'    },
  warning: { avatar: 'bg-amber-100 text-amber-700', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400'  },
  active:  { avatar: 'bg-emerald-100 text-emerald-700', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-400' },
  quiet:   { avatar: 'bg-stone-100 text-stone-600', badge: 'bg-stone-100 text-stone-600', dot: 'bg-stone-400'  },
  new:     { avatar: 'bg-sky-100 text-sky-700',     badge: 'bg-sky-100 text-sky-700',     dot: 'bg-sky-400'    },
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function fmt(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`
}

function formatDateLabel(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const weekday = WEEKDAYS[date.getDay()]
  const month = MONTHS[date.getMonth()]
  return `${weekday}, ${month} ${d}, ${y}`
}

export default function TherapistHome({ masterPrompt, onSaveMasterPrompt, backendAvailable }) {
  const [draft, setDraft] = useState(masterPrompt)
  const [saved, setSaved] = useState(false)
  const [appointments, setAppointments] = useState(fallbackAppointments)
  const dirty = draft !== masterPrompt

  useEffect(() => {
    if (backendAvailable) {
      api.getAppointments().then(setAppointments).catch(() => {})
    }
  }, [backendAvailable])

  useEffect(() => {
    setDraft(masterPrompt)
  }, [masterPrompt])

  const saveMasterPrompt = () => {
    onSaveMasterPrompt(draft)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const [selectedDate, setSelectedDate] = useState(TODAY)
  const [cal, setCal] = useState(() => {
    const [y, m] = TODAY.split('-').map(Number)
    return new Date(y, m - 1, 1)
  })

  const year  = cal.getFullYear()
  const month = cal.getMonth()

  const monthLabel   = MONTHS[month]
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth  = new Date(year, month + 1, 0).getDate()

  const apptDateSet = new Set(appointments.map(a => a.date))

  const dayAppts = appointments
    .filter(a => a.date === selectedDate)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  const completedCount = dayAppts.filter(a => a.status === 'completed').length
  const isToday = selectedDate === TODAY

  function dateStr(d) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }

  function isTodayCell(d) {
    const [ty, tm, td] = TODAY.split('-').map(Number)
    return year === ty && month === tm - 1 && d === td
  }

  function isSelectedCell(d) {
    return dateStr(d) === selectedDate
  }

  const cells = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div className="flex-1 flex gap-5 p-6 overflow-auto bg-stone-50 min-w-0">

      {/* ── Calendar ────────────────────────────────────── */}
      <div className="w-72 shrink-0 flex flex-col gap-4">
        <div className="bg-white rounded-xl border border-stone-200/70 shadow-sm overflow-hidden">

          {/* Month header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
            <span className="text-[13px] font-semibold text-stone-800">{monthLabel} {year}</span>
            <div className="flex gap-0.5">
              <button
                onClick={() => setCal(new Date(year, month - 1, 1))}
                className="p-1.5 rounded-md hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
              >
                <ChevronLeft size={13} />
              </button>
              <button
                onClick={() => setCal(new Date(year, month + 1, 1))}
                className="p-1.5 rounded-md hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>

          <div className="px-4 pt-3 pb-4">
            {/* Weekday labels */}
            <div className="grid grid-cols-7 mb-1">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d, i) => (
                <div key={i} className="text-center text-[10px] font-medium text-stone-400 py-1">{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-y-0.5">
              {cells.map((d, i) => {
                if (!d) return <div key={i} />
                const today = isTodayCell(d)
                const selected = isSelectedCell(d)
                const hasAppt = apptDateSet.has(dateStr(d))
                return (
                  <div key={i} className="flex flex-col items-center py-0.5">
                    <button
                      onClick={() => setSelectedDate(dateStr(d))}
                      className={`relative w-7 h-7 flex items-center justify-center rounded-full text-[12px] select-none transition-colors
                        ${selected
                          ? 'bg-sage-500 text-white font-semibold'
                          : today
                            ? 'ring-1 ring-sage-400 text-sage-700 font-semibold hover:bg-sage-50'
                            : 'text-stone-600 hover:bg-stone-100'
                        }`}
                    >
                      {d}
                      {hasAppt && (
                        <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full
                          ${selected ? 'bg-white/60' : 'bg-sage-400'}`}
                        />
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Stats row */}
          <div className="border-t border-stone-100 grid grid-cols-2 divide-x divide-stone-100">
            <div className="py-3 text-center">
              <div className="text-[17px] font-semibold text-stone-800">
                {appointments.filter(a => a.date === TODAY).length}
              </div>
              <div className="text-[10px] text-stone-400 mt-0.5">Today</div>
            </div>
            <div className="py-3 text-center">
              <div className="text-[17px] font-semibold text-stone-800">{appointments.length}</div>
              <div className="text-[10px] text-stone-400 mt-0.5">This week</div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 px-1">
          <span className="w-2 h-2 rounded-full bg-sage-400 shrink-0" />
          <span className="text-[11px] text-stone-400">Session scheduled</span>
        </div>
      </div>

      {/* ── Day Schedule + Master Prompt ──────────────── */}
      <div className="flex-1 min-w-0 flex flex-col gap-6">
        {/* Schedule */}
        <div>
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <h2 className="text-[14px] font-semibold text-stone-800">
                {isToday ? "Today's Schedule" : 'Schedule'}
              </h2>
              <p className="text-[11px] text-stone-400 mt-0.5">{formatDateLabel(selectedDate)}</p>
            </div>
            {completedCount > 0 && (
              <span className="text-[11px] text-stone-400">
                {completedCount} of {dayAppts.length} completed
              </span>
            )}
          </div>

          {dayAppts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-stone-300">
              <p className="text-[13px]">No sessions scheduled for this day.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {dayAppts.map(appt => {
                const style = patientStatusStyle[appt.patientStatus] ?? patientStatusStyle.active
                const done  = appt.status === 'completed'
                return (
                  <div
                    key={appt.id}
                    className={`bg-white rounded-lg border shadow-sm px-4 py-3.5 flex items-center gap-4
                      ${done ? 'border-stone-100 opacity-60' : 'border-stone-200/70'}`}
                  >
                    {/* Time block */}
                    <div className="w-[88px] shrink-0">
                      <div className="text-[12px] font-medium text-stone-700">{fmt(appt.startTime)}</div>
                      <div className="text-[10px] text-stone-400 mt-0.5">{fmt(appt.endTime)}</div>
                    </div>

                    <div className="w-px h-8 bg-stone-100 shrink-0" />

                    {/* Avatar + name */}
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 ${style.avatar}`}>
                        {appt.initials}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[13px] font-medium text-stone-800 truncate">{appt.patientName}</div>
                        <div className="text-[11px] text-stone-400">{appt.type}</div>
                      </div>
                    </div>

                    {/* Patient status */}
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide ${style.badge}`}>
                      {appt.patientStatus}
                    </span>

                    {/* Appointment status */}
                    <span className={`shrink-0 text-[11px] font-medium w-16 text-right
                      ${done ? 'text-stone-400' : 'text-stone-500'}`}>
                      {done ? 'Done' : 'Upcoming'}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Master Prompt ────────────────────────────── */}
        <div className="bg-white rounded-xl border border-stone-200/70 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-100">
            <div>
              <h2 className="text-[13px] font-semibold text-stone-800">Master Prompt</h2>
              <p className="text-[11px] text-stone-400 mt-0.5">Base instructions inherited by all patient agents</p>
            </div>
            <div className="flex items-center gap-2">
              {saved && (
                <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                  <Check size={12} />
                  Saved
                </span>
              )}
              <button
                onClick={saveMasterPrompt}
                disabled={!dirty}
                className="text-[12px] font-medium text-white bg-sage-500 hover:bg-sage-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg px-4 py-1.5 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
          <div className="p-4">
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              rows={8}
              className="w-full text-[12px] leading-relaxed border border-stone-200 rounded-lg px-3.5 py-3 focus:outline-none focus:ring-2 focus:ring-sage-200 focus:border-sage-300 placeholder:text-stone-300 bg-stone-50/50 resize-y font-mono"
              placeholder="Enter the base system prompt that all patient agents will inherit..."
            />
          </div>
        </div>
      </div>
    </div>
  )
}
