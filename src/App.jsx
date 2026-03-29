import { useState } from 'react'
import TopBar from './components/TopBar'
import PatientList from './components/PatientList'
import Workspace from './components/Workspace'
import ContextPanel from './components/ContextPanel'
import AgentsGrid from './components/AgentsGrid'
import SignalsFeed from './components/SignalsFeed'
import PatientChat from './components/PatientChat'
import { patients, signals as initialSignals } from './data/mock'

export default function App() {
  const [view, setView] = useState('patients')
  const [selectedId, setSelectedId] = useState(null)
  const [isPatientMode, setIsPatientMode] = useState(false)
  const [signals, setSignals] = useState(initialSignals)
  const [editingAgentFor, setEditingAgentFor] = useState(null)

  const unacknowledged = signals.filter(s => !s.acknowledged).length
  const selected = patients.find(p => p.id === selectedId) || null

  const acknowledge = (id) => {
    setSignals(prev => prev.map(s => s.id === id ? { ...s, acknowledged: true } : s))
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
        isPatientMode={isPatientMode}
        onToggleMode={() => setIsPatientMode(m => !m)}
        signalCount={unacknowledged}
      />

      {isPatientMode ? (
        <PatientChat />
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {view === 'patients' && (
            <>
              <PatientList
                patients={patients}
                selectedId={selectedId}
                onSelect={setSelectedId}
                signals={signals}
              />
              <Workspace patient={selected} />
              {selected && (
                <ContextPanel
                  patient={selected}
                  signals={signals.filter(s => s.patientId === selected.id)}
                  onConfigureAgent={() => goToAgent(selected.id)}
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
            />
          )}
          {view === 'signals' && (
            <SignalsFeed signals={signals} onAcknowledge={acknowledge} />
          )}
        </div>
      )}
    </div>
  )
}
