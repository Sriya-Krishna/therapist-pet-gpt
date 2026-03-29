/**
 * Boundary enforcement audit log — shows every boundary check performed
 * by the verifier LLM, with pass/violation verdicts and actions taken.
 *
 * This is the "proof of safety" view — therapists can verify that their
 * configured boundaries are actually being enforced in real time.
 */

import { useState, useEffect } from 'react'
import { ShieldCheck, ShieldAlert, RefreshCw } from 'lucide-react'
import * as api from '../api'

const verdictStyle = {
  pass:      { icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Pass' },
  violation: { icon: ShieldAlert,  color: 'text-red-600',     bg: 'bg-red-50',     label: 'Violation' },
}

const actionLabel = {
  none:        'No action needed',
  regenerated: 'Response regenerated',
  fallback:    'Safe fallback used',
}

export default function AuditLog({ backendAvailable }) {
  const [audits, setAudits] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = () => {
    if (!backendAvailable) return
    setLoading(true)
    api.getAuditLog()
      .then(setAudits)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(refresh, [backendAvailable])

  const violations = audits.filter(a => a.verdict === 'violation')
  const passes = audits.filter(a => a.verdict === 'pass')

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold text-stone-800 tracking-tight">Boundary Audit Log</h1>
            <p className="text-[13px] text-stone-400 mt-0.5">
              Verifier LLM checks every agent response against therapist-defined boundaries
            </p>
          </div>
          <button
            onClick={refresh}
            className="flex items-center gap-1.5 text-[12px] text-stone-500 hover:text-stone-700 border border-stone-200 rounded-md px-3 py-1.5 transition-colors"
          >
            <RefreshCw size={12} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-white rounded-xl border border-stone-200/60 p-4 text-center">
            <div className="text-[22px] font-semibold text-stone-800">{audits.length}</div>
            <div className="text-[11px] text-stone-400 mt-0.5">Total checks</div>
          </div>
          <div className="bg-white rounded-xl border border-stone-200/60 p-4 text-center">
            <div className="text-[22px] font-semibold text-emerald-600">{passes.length}</div>
            <div className="text-[11px] text-stone-400 mt-0.5">Passed</div>
          </div>
          <div className="bg-white rounded-xl border border-stone-200/60 p-4 text-center">
            <div className="text-[22px] font-semibold text-red-600">{violations.length}</div>
            <div className="text-[11px] text-stone-400 mt-0.5">Violations caught</div>
          </div>
        </div>

        {loading && audits.length === 0 && (
          <div className="text-center py-16 text-stone-300 text-[13px]">Loading audit log...</div>
        )}

        {!loading && audits.length === 0 && (
          <div className="text-center py-16">
            <ShieldCheck size={28} className="mx-auto mb-2 text-stone-300" strokeWidth={1.5} />
            <p className="text-[13px] text-stone-400">No boundary checks recorded yet.</p>
            <p className="text-[12px] text-stone-300 mt-1">Checks are performed automatically after each chat exchange.</p>
          </div>
        )}

        {/* Audit entries */}
        <div className="space-y-2">
          {audits.map(a => {
            const v = verdictStyle[a.verdict] || verdictStyle.pass
            const Icon = v.icon
            return (
              <div
                key={a.id}
                className={`bg-white border rounded-lg p-4 transition-all ${
                  a.verdict === 'violation'
                    ? 'border-red-200'
                    : 'border-stone-200/60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-full ${v.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                    <Icon size={14} className={v.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-semibold uppercase tracking-wider ${v.color}`}>
                        {v.label}
                      </span>
                      <span className="text-[12px] font-medium text-stone-700">{a.patientName}</span>
                      <span className="text-[11px] text-stone-300">{a.time} &middot; {a.date}</span>
                    </div>

                    <div className="text-[12px] text-stone-600 mb-1.5">
                      <span className="font-medium text-stone-500">Boundary:</span> {a.boundary}
                    </div>

                    {a.explanation && (
                      <div className="text-[12px] text-stone-500 mb-1.5">
                        <span className="font-medium text-stone-400">Reason:</span> {a.explanation}
                      </div>
                    )}

                    {a.verdict === 'violation' && a.actionTaken !== 'none' && (
                      <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-700 bg-amber-50 rounded-full px-2.5 py-0.5 mt-1">
                        {actionLabel[a.actionTaken] || a.actionTaken}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
