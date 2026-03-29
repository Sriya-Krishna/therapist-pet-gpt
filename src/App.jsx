import { useState } from 'react'
import TopBar from './components/TopBar'
import PatientList from './components/PatientList'
import Workspace from './components/Workspace'
import ContextPanel from './components/ContextPanel'
import AgentsGrid from './components/AgentsGrid'
import SignalsFeed from './components/SignalsFeed'
import PatientChat from './components/PatientChat'
import TherapistHome from './components/TherapistHome'
import AddPatientModal from './components/AddPatientModal'
import { patients as initialPatients, signals as initialSignals, defaultMasterPrompt } from './data/mock'

function generatePatientId(name) {
  return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') + '_' + Date.now().toString(36)
}

function deriveInitials(name) {
  return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function App() {
  const [view, setView] = useState('patients')
  const [selectedId, setSelectedId] = useState(null)
  const [isPatientMode, setIsPatientMode] = useState(false)
  const [patients, setPatients] = useState(initialPatients)
  const [signals, setSignals] = useState(initialSignals)
  const [editingAgentFor, setEditingAgentFor] = useState(null)
  const [showAddPatient, setShowAddPatient] = useState(false)
  const [patientModeUser, setPatientModeUser] = useState(null)
  const [masterPrompt, setMasterPrompt] = useState(defaultMasterPrompt)

  const unacknowledged = signals.filter(s => !s.acknowledged).length
  const selected = patients.find(p => p.id === selectedId) || null

  const acknowledge = (id) => {
    setSignals(prev => prev.map(s => s.id === id ? { ...s, acknowledged: true } : s))
  }

  const addPatient = (name, note = '') => {
    const id = generatePatientId(name)
    const newPatient = {
      id,
      name,
      initials: deriveInitials(name),
      status: 'new',
      lastActive: 'Not yet active',
      agent: null,
      summary: note || `${name} was added. No sessions recorded yet.`,
      recommendation: 'Configure a sub-agent before the first automated check-in.',
      messages: [],
    }
    setPatients(prev => [...prev, newPatient])
    return id
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
      />

      {isPatientMode ? (
        <PatientChat
          patientModeUser={patientModeUser}
          onRegister={(name, intro) => {
            const id = addPatient(name, intro)
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
                <TherapistHome masterPrompt={masterPrompt} onSaveMasterPrompt={setMasterPrompt} />
              )}
            </>
          )}
          {view === 'agents' && (
            <AgentsGrid
              patients={patients}
              editingAgentFor={editingAgentFor}
              onEditAgent={setEditingAgentFor}
              onCloseEditor={() => setEditingAgentFor(null)}
            />
          )}
          {view === 'signals' && (
            <SignalsFeed signals={signals} onAcknowledge={acknowledge} />
          )}
        </div>
      )}

      {showAddPatient && (
        <AddPatientModal
          onSubmit={(name, note) => {
            const id = addPatient(name, note)
            setSelectedId(id)
            setShowAddPatient(false)
          }}
          onClose={() => setShowAddPatient(false)}
        />
      )}
    </div>
  )
}
