import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { appointments } from '../data/mock'

const TODAY = '2026-03-29'

const patientStatusStyle = {
  crisis:  { avatar: 'bg-red-100 text-red-700',    badge: 'bg-red-100 text-red-700',    dot: 'bg-red-400'    },
  warning: { avatar: 'bg-amber-100 text-amber-700', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400'  },
  active:  { avatar: 'bg-emerald-100 text-emerald-700', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-400' },
  quiet:   { avatar: 'bg-stone-100 text-stone-600', badge: 'bg-stone-100 text-stone-600', dot: 'bg-stone-400'  },
  new:     { avatar: 'bg-sky-100 text-sky-700',     badge: 'bg-sky-100 text-sky-700',     dot: 'bg-sky-400'    },
}

function fmt(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`
}

export default function TherapistHome() {
  const todayDate = new Date(2026, 2, 29) // March 29, 2026
  const [cal, setCal] = useState(new Date(2026, 2, 1))

  const year  = cal.getFullYear()
  const month = cal.getMonth()

  const monthLabel   = cal.toLocaleString('default', { month: 'long' })
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth  = new Date(year, month + 1, 0).getDate()

  const apptDateSet = new Set(appointments.map(a => a.date))

  const todayAppts = appointments
    .filter(a => a.date === TODAY)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  const completedCount = todayAppts.filter(a => a.status === 'completed').length

  function dateStr(d) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }

  function isToday(d) {
    return year === todayDate.getFullYear() && month === todayDate.getMonth() && d === todayDate.getDate()
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
                const today = isToday(d)
                const hasAppt = apptDateSet.has(dateStr(d))
                return (
                  <div key={i} className="flex flex-col items-center py-0.5">
                    <div className={`relative w-7 h-7 flex items-center justify-center rounded-full text-[12px] select-none
                      ${today ? 'bg-sage-500 text-white font-semibold' : 'text-stone-600 hover:bg-stone-50'}`}
                    >
                      {d}
                      {hasAppt && (
                        <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full
                          ${today ? 'bg-white/60' : 'bg-sage-400'}`}
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Stats row */}
          <div className="border-t border-stone-100 grid grid-cols-2 divide-x divide-stone-100">
            <div className="py-3 text-center">
              <div className="text-[17px] font-semibold text-stone-800">{todayAppts.length}</div>
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

      {/* ── Today's Schedule ────────────────────────────── */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <h2 className="text-[14px] font-semibold text-stone-800">Today's Schedule</h2>
            <p className="text-[11px] text-stone-400 mt-0.5">Sunday, March 29, 2026</p>
          </div>
          {completedCount > 0 && (
            <span className="text-[11px] text-stone-400">
              {completedCount} of {todayAppts.length} completed
            </span>
          )}
        </div>

        {todayAppts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-stone-300">
            <p className="text-[13px]">No sessions scheduled for today.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayAppts.map(appt => {
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
    </div>
  )
}