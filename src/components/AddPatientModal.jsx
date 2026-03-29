import { useState } from 'react'
import { X, UserPlus } from 'lucide-react'

export default function AddPatientModal({ onSubmit, onClose }) {
  const [name, setName] = useState('')
  const [note, setNote] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit(name.trim(), note.trim())
  }

  const initials = name.trim()
    ? name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '??'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />

      <div className="relative bg-white rounded-xl shadow-xl border border-stone-200/60 w-full max-w-md mx-4 p-6">
        <button onClick={onClose} className="absolute top-4 right-4 text-stone-300 hover:text-stone-500 transition-colors">
          <X size={18} />
        </button>

        <h2 className="text-[15px] font-semibold text-stone-800 mb-1">Add new patient</h2>
        <p className="text-[12px] text-stone-400 mb-5">They'll appear in your sidebar with "new" status.</p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block mb-1.5">
              Full name
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Jordan Rivera"
              autoFocus
              className="w-full text-[12px] border border-stone-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sage-200 focus:border-sage-300 placeholder:text-stone-300 bg-white"
            />
          </div>

          {name.trim() && (
            <div className="flex items-center gap-2.5 mb-4 px-1">
              <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-[10px] font-semibold">
                {initials}
              </div>
              <span className="text-[12px] text-stone-500">
                {name.trim()} <span className="text-stone-300">&middot; new</span>
              </span>
            </div>
          )}

          <div className="mb-5">
            <label className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block mb-1.5">
              Initial note <span className="font-normal normal-case tracking-normal text-stone-300">(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
              placeholder="Intake notes, referral context, etc."
              className="w-full text-[12px] border border-stone-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sage-200 focus:border-sage-300 placeholder:text-stone-300 bg-white resize-none"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-[13px] text-stone-500 hover:text-stone-700 px-4 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex items-center gap-1.5 text-[13px] font-medium text-white bg-sage-500 hover:bg-sage-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg px-5 py-2.5 transition-colors"
            >
              <UserPlus size={14} />
              Add patient
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
