import { useState, useEffect, useCallback } from 'react'
import TopBar from './components/TopBar'
import PatientList from './components/PatientList'
import Workspace from './components/Workspace'
import ContextPanel from './components/ContextPanel'
import AgentsGrid from './components/AgentsGrid'
import SignalsFeed from './components/SignalsFeed'
import PatientChat from './components/PatientChat'
import TherapistHome from './components/TherapistHome'
import AddPatientModal from './components/AddPatientModal'
import { patients as fallbackPatients, signals as fallbackSignals, defaultMasterPrompt } from './data/mock'
import * as api from './api'

export default function App() {
  const [view, setView] = useState('patients')
  const [selectedId, setSelectedId] = useState(null)
  const [isPatientMode, setIsPatientMode] = useState(false)
  const [patients, setPatients] = useState([])
  const [signals, setSignals] = useState([])
  const [editingAgentFor, setEditingAgentFor] = useState(null)
  const [showAddPatient, setShowAddPatient] = useState(false)
  const [patientModeUser, setPatientModeUser] = useState(null)
  const [masterPrompt, setMasterPrompt] = useState(defaultMasterPrompt)
  const [backendAvailable, setBackendAvailable] = useState(false)
  const [patientTheme, setPatientTheme] = useState('floral')

  // ── Load from backend on mount, fall back to mock data ──────
  useEffect(() => {
    Promise.all([api.getPatients(), api.getSignals(), api.getMasterPrompt()])
      .then(([p, s, mp]) => {
        setPatients(p)
        setSignals(s)
        if (mp.prompt) setMasterPrompt(mp.prompt)
        setBackendAvailable(true)
      })
      .catch(() => {
        console.warn('Backend not available — using mock data')
        setPatients(fallbackPatients)
        setSignals(fallbackSignals)
      })
  }, [])

  const refreshPatients = useCallback(() => {
    if (!backendAvailable) return
    api.getPatients().then(setPatients).catch(() => {})
  }, [backendAvailable])

  const refreshSignals = useCallback(() => {
    if (!backendAvailable) return
    api.getSignals().then(setSignals).catch(() => {})
  }, [backendAvailable])

  const unacknowledged = signals.filter(s => !s.acknowledged).length
  const selected = patients.find(p => p.id === selectedId) || null

  const acknowledge = async (id) => {
    setSignals(prev => prev.map(s => s.id === id ? { ...s, acknowledged: true } : s))
    if (backendAvailable) {
      api.acknowledgeSignal(id).catch(() => {})
    }
  }

  const addPatient = async (name, note = '') => {
    if (backendAvailable) {
      const created = await api.createPatient(name, note)
      setPatients(prev => [...prev, created])
      return created.id
    }
    // Fallback: local-only
    const id = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') + '_' + Date.now().toString(36)
    const newPatient = {
      id, name,
      initials: name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2),
      status: 'new', lastActive: 'Not yet active', agent: null,
      summary: note || `${name} was added. No sessions recorded yet.`,
      recommendation: 'Configure a sub-agent before the first automated check-in.',
      messages: [],
    }
    setPatients(prev => [...prev, newPatient])
    return id
  }

  const saveAgent = async (patientId, config) => {
    if (backendAvailable) {
      const updated = await api.updateAgent(patientId, config)
      setPatients(prev => prev.map(p => p.id === patientId ? updated : p))
    } else {
      setPatients(prev => prev.map(p => p.id === patientId ? { ...p, agent: config } : p))
    }
  }

  const saveMasterPrompt = async (prompt) => {
    setMasterPrompt(prompt)
    if (backendAvailable) {
      api.updateMasterPrompt(prompt).catch(() => {})
    }
  }

  const goToAgent = (patientId) => {
    setEditingAgentFor(patientId)
    setView('agents')
  }

  const navigate = (v) => {
    setView(v)
    if (v !== 'agents') setEditingAgentFor(null)
  }

  return (
    <div className="flex flex-col h-screen bg-stone-50 font-sans">
      <TopBar
        view={view}
        onNavigate={navigate}
        onGoHome={() => { setSelectedId(null); navigate('patients') }}
        isPatientMode={isPatientMode}
        onToggleMode={() => setIsPatientMode(m => !m)}
        signalCount={unacknowledged}
        patientTheme={patientTheme}
        onChangeTheme={setPatientTheme}
      />

      {isPatientMode ? (
        <PatientChat
          patientModeUser={patientModeUser}
          backendAvailable={backendAvailable}
          theme={patientTheme}
          onRegister={async (name, intro) => {
            const id = await addPatient(name, intro)
            setPatientModeUser(id)
          }}
        />
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {view === 'patients' && (
            <>
              <PatientList
                patients={patients}
                selectedId={selectedId}
                onSelect={setSelectedId}
                signals={signals}
                onAddPatient={() => setShowAddPatient(true)}
              />
              {selected ? (
                <>
                  <Workspace patient={selected} />
                  <ContextPanel
                    patient={selected}
                    signals={signals.filter(s => s.patientId === selected.id)}
                    onConfigureAgent={() => goToAgent(selected.id)}
                  />
                </>
              ) : (
                <TherapistHome
                  masterPrompt={masterPrompt}
                  onSaveMasterPrompt={saveMasterPrompt}
                  backendAvailable={backendAvailable}
                />
              )}
            </>
          )}
          {view === 'agents' && (
            <AgentsGrid
              patients={patients}
              editingAgentFor={editingAgentFor}
              onEditAgent={setEditingAgentFor}
              onCloseEditor={() => setEditingAgentFor(null)}
              onSaveAgent={saveAgent}
            />
          )}
          {view === 'signals' && (
            <SignalsFeed signals={signals} onAcknowledge={acknowledge} />
          )}
        </div>
      )}

      {showAddPatient && (
        <AddPatientModal
          onSubmit={async (name, note) => {
            const id = await addPatient(name, note)
            setSelectedId(id)
            setShowAddPatient(false)
          }}
          onClose={() => setShowAddPatient(false)}
        />
      )}
    </div>
  )
}
