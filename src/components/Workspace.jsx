import { Users, Flag } from 'lucide-react'

export default function Workspace({ patient }) {
  if (!patient) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Users size={28} className="mx-auto mb-2 text-stone-300" strokeWidth={1.5} />
          <p className="text-[13px] text-stone-400">Select a patient to view their session</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      <div className="border-b border-stone-200/70 bg-white px-6 py-3 shrink-0">
        <span className="text-[13px] font-medium text-stone-800">Transcript</span>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        <Transcript patient={patient} />
      </div>
    </div>
  )
}

function Transcript({ patient }) {
  if (patient.messages.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[13px] text-stone-400">No messages yet.</p>
        <p className="text-[12px] text-stone-300 mt-1">Sessions will appear here once the patient begins.</p>
      </div>
    )
  }

  const grouped = {}
  patient.messages.forEach(m => {
    if (!grouped[m.date]) grouped[m.date] = []
    grouped[m.date].push(m)
  })

  return (
    <div>
      {Object.entries(grouped).map(([date, msgs]) => (
        <div key={date}>
          <div className="flex items-center gap-3 my-5 first:mt-0">
            <div className="h-px flex-1 bg-stone-200/80" />
            <span className="text-[11px] text-stone-400 font-medium shrink-0">{date}</span>
            <div className="h-px flex-1 bg-stone-200/80" />
          </div>
          {msgs.map((m, i) => (
            <div key={i} className={`py-2.5 flex ${m.from === 'agent' ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[75%] ${m.from === 'agent' ? '' : 'text-right'}`}>
                <div className={`flex items-center gap-2 mb-0.5 ${m.from === 'agent' ? '' : 'justify-end'}`}>
                  {m.flagged && <Flag size={11} className="text-red-500" fill="currentColor" />}
                  <span className={`text-[12px] font-semibold ${m.from === 'agent' ? 'text-sage-700' : 'text-stone-700'}`}>
                    {m.from === 'agent' ? 'AI Agent' : patient.name}
                  </span>
                  <span className="text-[11px] text-stone-300">{m.time}</span>
                </div>
                <p className={`text-[13px] leading-relaxed px-3.5 py-2.5 rounded-xl ${
                  m.from === 'agent'
                    ? 'bg-sage-50/70 text-stone-600 rounded-tl-sm'
                    : `bg-stone-100 text-stone-600 rounded-tr-sm ${m.flagged ? 'ring-1 ring-red-300' : ''}`
                }`}>{m.text}</p>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
