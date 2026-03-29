/**
 * Chronological feed of AI-generated signals across all patients.
 *
 * Grouped by date. Each signal shows a type-colored dot (critical=red,
 * warning=amber, positive=emerald, info=sky), patient name, timestamp,
 * summary text, and detail. Unacknowledged signals have a card border
 * and an "Ack" button; acknowledged ones are dimmed.
 */

import { Check } from 'lucide-react'
import { signalDot, signalLabel } from '../constants/statusColors'

export default function SignalsFeed({ signals, onAcknowledge }) {
  const grouped = {}
  signals.forEach(s => {
    if (!grouped[s.date]) grouped[s.date] = []
    grouped[s.date].push(s)
  })

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-8 py-8">
        <div className="mb-8">
          <h1 className="text-lg font-semibold text-stone-800 tracking-tight">Signals</h1>
          <p className="text-[13px] text-stone-400 mt-0.5">AI observations across all patients</p>
        </div>

        {Object.entries(grouped).map(([date, items]) => (
          <div key={date} className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">{date}</span>
              <div className="h-px flex-1 bg-stone-200/80" />
            </div>

            <div className="space-y-1">
              {items.map(s => (
                <div
                  key={s.id}
                  className={`flex gap-3.5 p-3.5 rounded-lg transition-opacity duration-200 ${
                    s.acknowledged ? 'opacity-45' : 'bg-white border border-stone-200/60'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full mt-[7px] shrink-0 ${signalDot[s.type]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-medium rounded-full px-2 py-0.5 ${signalLabel[s.type]}`}>
                        {s.type}
                      </span>
                      <span className="text-[12px] font-medium text-stone-700">{s.patientName}</span>
                      <span className="text-[11px] text-stone-300">{s.time}</span>
                    </div>
                    <p className="text-[13px] text-stone-700 mb-0.5">{s.text}</p>
                    <p className="text-[12px] text-stone-400">{s.detail}</p>
                  </div>
                  <div className="shrink-0 pt-0.5">
                    {!s.acknowledged ? (
                      <button
                        onClick={() => onAcknowledge(s.id)}
                        className="flex items-center gap-1 text-[11px] text-stone-400 hover:text-sage-700 border border-stone-200 hover:border-sage-300 rounded-md px-2 py-1 transition-colors"
                      >
                        <Check size={11} />
                        Ack
                      </button>
                    ) : (
                      <span className="text-[11px] text-stone-300">Ack&apos;d</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
