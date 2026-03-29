/**
 * Grid view of all patient agent configurations.
 *
 * Configured patients show as cards with template label, tone sliders (W/D/V),
 * styles, and boundary count. Unconfigured patients appear as dashed "+"
 * placeholders. Clicking any card opens the AgentConfigurator inline.
 */

import { Plus } from 'lucide-react'
import AgentConfigurator from './AgentConfigurator'

export default function AgentsGrid({ patients, editingAgentFor, onEditAgent, onCloseEditor, onSaveAgent }) {
  const configured = patients.filter(p => p.agent)
  const unconfigured = patients.filter(p => !p.agent)
  const editingPatient = editingAgentFor ? patients.find(p => p.id === editingAgentFor) : null

  if (editingPatient) {
    return (
      <AgentConfigurator
        patient={editingPatient}
        onBack={onCloseEditor}
        onSave={async (config) => {
          if (onSaveAgent) await onSaveAgent(editingPatient.id, config)
          onCloseEditor()
        }}
      />
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-8 py-8">
        <div className="mb-8">
          <h1 className="text-lg font-semibold text-stone-800 tracking-tight">Agents</h1>
          <p className="text-[13px] text-stone-400 mt-0.5">Manage sub-agent configurations</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {configured.map(p => (
            <div
              key={p.id}
              onClick={() => onEditAgent(p.id)}
              className="bg-white border border-stone-200/60 rounded-xl cursor-pointer hover:shadow-md hover:border-stone-300/60 transition-all duration-150 p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-[13px] font-medium text-stone-800">{p.agent.label}</div>
                  <div className="text-[11px] text-stone-400 mt-0.5">Assigned to {p.name}</div>
                </div>
              </div>

              <div className="flex gap-4 mb-3">
                {[
                  ['W', p.agent.tone.warmth],
                  ['D', p.agent.tone.directness],
                  ['V', p.agent.tone.verbosity],
                ].map(([label, val]) => (
                  <div key={label} className="flex items-center gap-1.5 text-[10px] text-stone-400">
                    <span className="font-medium">{label}</span>
                    <div className="w-10 h-1 bg-stone-200 rounded-full overflow-hidden">
                      <div className="h-full bg-sage-400 rounded-full" style={{ width: `${val * 10}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-1 mb-2.5">
                {p.agent.styles.map(s => (
                  <span key={s} className="text-[10px] text-sage-700 bg-sage-50 rounded-md px-1.5 py-0.5">{s}</span>
                ))}
              </div>

              <div className="text-[10px] text-stone-400">
                {p.agent.boundaries.length} boundar{p.agent.boundaries.length === 1 ? 'y' : 'ies'}
              </div>
            </div>
          ))}

          {unconfigured.map(p => (
            <div
              key={p.id}
              onClick={() => onEditAgent(p.id)}
              className="border-2 border-dashed border-stone-200 rounded-xl p-5 cursor-pointer hover:border-sage-300 hover:bg-sage-50/30 transition-colors flex flex-col items-center justify-center min-h-[140px] gap-2"
            >
              <Plus size={20} className="text-stone-300" />
              <span className="text-[13px] text-stone-400">Configure agent for {p.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
