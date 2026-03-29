/**
 * Shared color mappings for patient statuses and signal types.
 *
 * Single source of truth — imported by PatientList, ContextPanel,
 * SignalsFeed, and TherapistHome instead of defining their own copies.
 */

// ── Patient status colors ────────────────────────────────────────

export const patientStatusBorder = {
  crisis:  'border-l-red-500',
  warning: 'border-l-amber-500',
  active:  'border-l-emerald-500',
  quiet:   'border-l-stone-400',
  new:     'border-l-sky-400',
}

export const patientStatusText = {
  crisis:  'text-red-700',
  warning: 'text-amber-700',
  active:  'text-emerald-700',
  quiet:   'text-stone-500',
  new:     'text-sky-600',
}

export const patientStatusStyle = {
  crisis:  { avatar: 'bg-red-100 text-red-700',     badge: 'bg-red-100 text-red-700',     dot: 'bg-red-400'     },
  warning: { avatar: 'bg-amber-100 text-amber-700',  badge: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-400'   },
  active:  { avatar: 'bg-emerald-100 text-emerald-700', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-400' },
  quiet:   { avatar: 'bg-stone-100 text-stone-600',  badge: 'bg-stone-100 text-stone-600',  dot: 'bg-stone-400'   },
  new:     { avatar: 'bg-sky-100 text-sky-700',      badge: 'bg-sky-100 text-sky-700',      dot: 'bg-sky-400'     },
}

// ── Signal type colors ───────────────────────────────────────────

export const signalDot = {
  critical: 'bg-red-500',
  warning:  'bg-amber-500',
  positive: 'bg-emerald-500',
  info:     'bg-sky-400',
}

export const signalLabel = {
  critical: 'text-red-700 bg-red-50',
  warning:  'text-amber-700 bg-amber-50',
  positive: 'text-emerald-700 bg-emerald-50',
  info:     'text-sky-700 bg-sky-50',
}
