/**
 * REST client for the MindBridge backend.
 *
 * All functions return a Promise that resolves to parsed JSON.
 * In development, Vite proxies /api to http://localhost:8000 (see vite.config.js).
 */

const BASE = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`${res.status}: ${body}`)
  }
  return res.json()
}

// ── Patients ──────────────────────────────────────────────────

export function getPatients() {
  return request('/patients')
}

export function getPatient(id) {
  return request(`/patients/${id}`)
}

export function createPatient(name, note = '') {
  return request('/patients', {
    method: 'POST',
    body: JSON.stringify({ name, note }),
  })
}

export function updateAgent(patientId, config) {
  return request(`/patients/${patientId}/agent`, {
    method: 'PUT',
    body: JSON.stringify(config),
  })
}

// ── Chat ──────────────────────────────────────────────────────

export function chat(patientId, text) {
  return request(`/chat/${patientId}`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  })
}

// ── Master Prompt ─────────────────────────────────────────────

export function getMasterPrompt() {
  return request('/master-prompt')
}

export function updateMasterPrompt(prompt) {
  return request('/master-prompt', {
    method: 'PUT',
    body: JSON.stringify({ prompt }),
  })
}

// ── Signals ───────────────────────────────────────────────────

export function getSignals() {
  return request('/signals')
}

export function acknowledgeSignal(id) {
  return request(`/signals/${id}/acknowledge`, { method: 'PUT' })
}

// ── Appointments ──────────────────────────────────────────────

export function getAppointments(date) {
  const qs = date ? `?date=${date}` : ''
  return request(`/appointments${qs}`)
}
