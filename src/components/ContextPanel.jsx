/**
 * Right sidebar showing details for the selected patient.
 *
 * Sections (top to bottom):
 *   - Patient name, status, last active
 *   - AI-generated summary
 *   - Recent signals (up to 4, with type-colored dots)
 *   - Sub-agent config (template, tone bars W/D/V, styles, boundary count)
 *   - Therapist recommendation
 *   - "Schedule session" button
 *
 * The "Edit in Agents" link navigates to the AgentConfigurator for this patient.
 */

import { Bot, CalendarPlus } from 'lucide-react'

const statusText = {
  crisis: 'text-red-700',
  warning: 'text-amber-700',
  active: 'text-emerald-700',
  quiet: 'text-stone-500',
  new: 'text-sky-600',
}

const signalDot = {
  critical: 'bg-red-500',
  warning: 'bg-amber-500',
  positive: 'bg-emerald-500',
  info: 'bg-sky-400',
}

export default function ContextPanel({ patient, signals, onConfigureAgent }) {
  return (
    <aside className="w-80 border-l border-stone-200/70 bg-white overflow-y-auto shrink-0">
      <div className="px-5 py-4 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-semibold text-stone-800">{patient.name}</span>
          <span className={`text-[10px] font-semibold uppercase tracking-wider ${statusText[patient.status]}`}>
            {patient.status}
          </span>
        </div>
        <div className="text-[11px] text-stone-400 mt-0.5">{patient.lastActive}</div>
      </div>

      <div className="px-5 py-4 border-b border-stone-100">
        <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-2">AI Summary</div>
        <p className="text-[12px] text-stone-600 leading-relaxed">{patient.summary}</p>
      </div>

      {signals.length > 0 && (
        <div className="px-5 py-4 border-b border-stone-100">
          <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-2.5">Recent Signals</div>
          <div className="space-y-2.5">
            {signals.slice(0, 4).map(s => (
              <div key={s.id} className="flex gap-2.5">
                <div className={`w-1.5 h-1.5 rounded-full mt-[7px] shrink-0 ${signalDot[s.type]}`} />
                <div>
                  <p className="text-[12px] text-stone-600 leading-snug">{s.text}</p>
                  <span className="text-[10px] text-stone-400">{s.time} &middot; {s.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agent info */}
      <div className="px-5 py-4 border-b border-stone-100">
        <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-2.5">Sub-agent</div>
        {patient.agent ? (
          <div>
            <div className="text-[13px] font-medium text-stone-800">{patient.agent.label}</div>
            <div className="flex gap-3 mt-2 mb-2.5">
              {[
                ['W', patient.agent.tone.warmth],
                ['D', patient.agent.tone.directness],
                ['V', patient.agent.tone.verbosity],
              ].map(([label, val]) => (
                <div key={label} className="flex items-center gap-1.5 text-[10px] text-stone-400">
                  <span className="font-medium">{label}</span>
                  <div className="w-8 h-1 bg-stone-200 rounded-full overflow-hidden">
                    <div className="h-full bg-sage-400 rounded-full" style={{ width: `${val * 10}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-1 mb-2">
              {patient.agent.styles.map(s => (
                <span key={s} className="text-[10px] text-sage-700 bg-sage-50 rounded px-1.5 py-0.5">{s}</span>
              ))}
            </div>
            <div className="text-[10px] text-stone-400 mb-3">
              {patient.agent.boundaries.length} boundar{patient.agent.boundaries.length === 1 ? 'y' : 'ies'}
            </div>
            <button
              onClick={onConfigureAgent}
              className="flex items-center gap-1.5 text-[12px] text-sage-600 hover:text-sage-800 font-medium transition-colors"
            >
              <Bot size={12} />
              Edit in Agents &rarr;
            </button>
          </div>
        ) : (
          <div>
            <p className="text-[12px] text-stone-400 mb-2.5">No agent configured yet.</p>
            <button
              onClick={onConfigureAgent}
              className="flex items-center gap-1.5 text-[12px] text-sage-600 hover:text-sage-800 font-medium transition-colors"
            >
              <Bot size={12} />
              Set up in Agents &rarr;
            </button>
          </div>
        )}
      </div>

      {patient.recommendation && (
        <div className="px-5 py-4 border-b border-stone-100">
          <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-2">Recommendation</div>
          <p className="text-[12px] text-stone-600 leading-relaxed">{patient.recommendation}</p>
        </div>
      )}

      <div className="px-5 py-4">
        <button className="w-full flex items-center justify-center gap-1.5 text-[13px] text-stone-500 font-medium border border-stone-200 hover:bg-stone-50 rounded-lg px-3 py-2.5 transition-colors">
          <CalendarPlus size={14} />
          Schedule session
        </button>
      </div>
    </aside>
  )
}
