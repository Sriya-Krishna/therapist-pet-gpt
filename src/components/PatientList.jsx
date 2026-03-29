import { Plus } from 'lucide-react'

const statusColors = {
  crisis: { border: 'border-l-red-500', text: 'text-red-700' },
  warning: { border: 'border-l-amber-500', text: 'text-amber-700' },
  active: { border: 'border-l-emerald-500', text: 'text-emerald-700' },
  quiet: { border: 'border-l-stone-400', text: 'text-stone-500' },
  new: { border: 'border-l-sky-400', text: 'text-sky-600' },
}

export default function PatientList({ patients, selectedId, onSelect, signals, onAddPatient }) {
  const activeToday = patients.filter(p => p.lastActive.includes('Today')).length
  const unack = signals.filter(s => !s.acknowledged).length

  return (
    <aside className="w-72 border-r border-stone-200/70 bg-white flex flex-col shrink-0">
      <div className="px-4 py-3.5 border-b border-stone-100">
        <div className="flex items-center justify-between">
          <div className="text-[13px] font-semibold text-stone-800">Patients</div>
          <button
            onClick={onAddPatient}
            className="w-6 h-6 flex items-center justify-center rounded-md text-stone-400 hover:text-sage-700 hover:bg-sage-50 transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>
        <div className="text-[11px] text-stone-400 mt-0.5">
          {unack} signal{unack !== 1 ? 's' : ''} &middot; {activeToday} active today
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {patients.map(p => {
          const sc = statusColors[p.status]
          const isSelected = selectedId === p.id
          return (
            <div
              key={p.id}
              onClick={() => onSelect(p.id)}
              className={`px-4 py-3 border-l-[3px] border-b border-b-stone-100/80 cursor-pointer transition-colors duration-100 ${
                isSelected
                  ? 'bg-sage-50/60 border-l-sage-500'
                  : `${sc.border} hover:bg-stone-50/80`
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[13px] font-medium ${isSelected ? 'text-sage-800' : 'text-stone-800'}`}>
                  {p.name}
                </span>
                <span className={`text-[10px] font-medium uppercase tracking-wider ${isSelected ? 'text-sage-600' : sc.text}`}>
                  {p.status}
                </span>
              </div>
              <div className="text-[11px] text-stone-400 mt-0.5 truncate">
                {p.agent ? p.agent.label : 'No agent configured'} &middot; {p.lastActive}
              </div>
            </div>
          )
        })}
      </div>
    </aside>
  )
}
