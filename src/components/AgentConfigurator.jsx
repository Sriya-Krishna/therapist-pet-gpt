import { useState } from 'react'
import { ArrowLeft, Save } from 'lucide-react'
import { agentTemplates, responseStyles, safetyBoundaries } from '../data/mock'

export default function AgentConfigurator({ patient, onBack, onSave }) {
  const [config, setConfig] = useState(() => {
    if (patient.agent) {
      return {
        template: patient.agent.templateId,
        tone: { ...patient.agent.tone },
        styles: [...patient.agent.styles],
        boundaries: [...patient.agent.boundaries],
        customBoundary: '',
      }
    }
    return { template: '', tone: { warmth: 5, directness: 5, verbosity: 5 }, styles: [], boundaries: [], customBoundary: '' }
  })
  const [testInput, setTestInput] = useState('')
  const [testResult, setTestResult] = useState(null)

  const selectTemplate = (id) => {
    const t = agentTemplates.find(x => x.id === id)
    setConfig(prev => ({ ...prev, template: id, tone: { ...t.defaults }, styles: [...t.styles] }))
  }

  const toggleStyle = (s) =>
    setConfig(prev => ({ ...prev, styles: prev.styles.includes(s) ? prev.styles.filter(x => x !== s) : [...prev.styles, s] }))

  const toggleBoundary = (b) =>
    setConfig(prev => ({ ...prev, boundaries: prev.boundaries.includes(b) ? prev.boundaries.filter(x => x !== b) : [...prev.boundaries, b] }))

  const addCustom = () => {
    if (!config.customBoundary.trim()) return
    setConfig(prev => ({ ...prev, boundaries: [...prev.boundaries, prev.customBoundary.trim()], customBoundary: '' }))
  }

  const runPreview = () => {
    if (!testInput.trim()) return
    const previews = {
      anchor: 'That sounds like it\u2019s weighing on you. Let\u2019s take a breath here. What\u2019s one thing you can feel or see right now?',
      structured: 'I hear you. Let\u2019s break this down \u2014 what\u2019s the one part of this that feels most within your control right now?',
      reflective: 'You said that twice now. What do you think that pattern is trying to tell you?',
      perspective: 'What if you looked at this from the other side \u2014 what would a friend say about this situation?',
      soft: 'I\u2019m here. Take your time.',
    }
    setTestResult(previews[config.template] || 'I hear you. That sounds like a lot to sit with right now.')
  }

  const tmpl = agentTemplates.find(t => t.id === config.template)

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left: Config form */}
      <div className="flex-1 overflow-y-auto px-8 py-6 border-r border-stone-200/70">
        <button onClick={onBack} className="flex items-center gap-1.5 text-[13px] text-stone-400 hover:text-stone-600 mb-5 transition-colors">
          <ArrowLeft size={14} />
          Back
        </button>

        <div className="mb-7">
          <h1 className="text-lg font-semibold text-stone-800 tracking-tight">
            Configure agent {patient ? `\u2014 ${patient.name}` : ''}
          </h1>
        </div>

        {/* Template */}
        <section className="mb-8">
          <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-3">Template</div>
          <div className="grid grid-cols-3 gap-2">
            {agentTemplates.map(t => (
              <div
                key={t.id}
                onClick={() => selectTemplate(t.id)}
                className={`p-3 rounded-lg cursor-pointer transition-all duration-150 ${
                  config.template === t.id
                    ? 'bg-sage-50 border-2 border-sage-400'
                    : 'bg-white border border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="text-[12px] font-medium text-stone-800">{t.label}</div>
                <div className="text-[10px] text-stone-400 mt-0.5">{t.description}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Tone */}
        <section className="mb-8">
          <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-3">Tone</div>
          {[
            ['Warmth', 'warmth', 'Clinical', 'Compassionate'],
            ['Directness', 'directness', 'Indirect', 'Direct'],
            ['Verbosity', 'verbosity', 'Brief', 'Detailed'],
          ].map(([label, key, low, high]) => (
            <div key={key} className="mb-4 last:mb-0">
              <div className="text-[12px] font-medium text-stone-600 mb-2">{label}</div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-stone-400 w-16 shrink-0">{low}</span>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={config.tone[key]}
                  onChange={e => setConfig(prev => ({ ...prev, tone: { ...prev.tone, [key]: parseInt(e.target.value) } }))}
                  className="flex-1 h-1 accent-sage-500 cursor-pointer"
                />
                <span className="text-[10px] text-stone-400 w-16 text-right shrink-0">{high}</span>
                <span className="text-[13px] font-semibold text-sage-700 w-5 text-center shrink-0">{config.tone[key]}</span>
              </div>
            </div>
          ))}
        </section>

        {/* Styles */}
        <section className="mb-8">
          <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-3">Response styles</div>
          <div className="flex flex-wrap gap-1.5">
            {responseStyles.map(s => (
              <button
                key={s}
                onClick={() => toggleStyle(s)}
                className={`px-3 py-1.5 text-[12px] rounded-md transition-colors ${
                  config.styles.includes(s)
                    ? 'bg-sage-100 text-sage-800 border border-sage-300 font-medium'
                    : 'bg-white text-stone-500 border border-stone-200 hover:border-stone-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </section>

        {/* Boundaries */}
        <section className="mb-8">
          <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-3">Boundaries</div>
          <div className="space-y-1 mb-4">
            {safetyBoundaries.map(b => (
              <label
                key={b}
                onClick={() => toggleBoundary(b)}
                className="flex items-start gap-2.5 cursor-pointer px-2 py-1.5 rounded-md hover:bg-stone-50 transition-colors"
              >
                <div className={`w-3.5 h-3.5 mt-0.5 rounded border flex items-center justify-center text-[9px] shrink-0 transition-colors ${
                  config.boundaries.includes(b) ? 'bg-sage-500 border-sage-500 text-white' : 'border-stone-300 bg-white'
                }`}>
                  {config.boundaries.includes(b) && '\u2713'}
                </div>
                <span className="text-[12px] text-stone-600">{b}</span>
              </label>
            ))}
            {config.boundaries.filter(b => !safetyBoundaries.includes(b)).map(b => (
              <div key={b} className="flex items-start gap-2.5 px-2 py-1.5">
                <div className="w-3.5 h-3.5 mt-0.5 rounded bg-sage-500 border-sage-500 text-white flex items-center justify-center text-[9px] shrink-0">{'\u2713'}</div>
                <span className="text-[12px] text-stone-600 flex-1">{b}</span>
                <button onClick={() => toggleBoundary(b)} className="text-[10px] text-red-500 hover:text-red-700">remove</button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={config.customBoundary}
              onChange={e => setConfig(prev => ({ ...prev, customBoundary: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && addCustom()}
              placeholder="Add custom rule\u2026"
              className="flex-1 text-[12px] border border-stone-200 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-sage-200 focus:border-sage-300 placeholder:text-stone-300"
            />
            <button onClick={addCustom} className="text-[12px] text-stone-500 border border-stone-200 rounded-md px-3 py-1.5 hover:bg-stone-50">
              Add
            </button>
          </div>
        </section>

        <button
          onClick={() => {
            const tmplObj = agentTemplates.find(t => t.id === config.template)
            onSave({
              templateId: config.template,
              label: tmplObj?.label || config.template,
              tone: config.tone,
              styles: config.styles,
              boundaries: config.boundaries,
            })
          }}
          disabled={!config.template}
          className="flex items-center gap-1.5 text-[13px] font-medium text-white bg-sage-500 hover:bg-sage-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg px-5 py-2.5 transition-colors"
        >
          <Save size={14} />
          Save configuration
        </button>
      </div>

      {/* Right: Preview */}
      <div className="w-96 bg-stone-50/50 overflow-y-auto px-6 py-6 shrink-0">
        <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-4">Live preview</div>

        <div className="mb-5">
          <div className="flex gap-2">
            <input
              value={testInput}
              onChange={e => setTestInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && runPreview()}
              placeholder="Test with a patient message\u2026"
              className="flex-1 text-[12px] border border-stone-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sage-200 focus:border-sage-300 placeholder:text-stone-300 bg-white"
            />
            <button onClick={runPreview} className="text-[12px] font-medium text-white bg-sage-500 hover:bg-sage-600 rounded-md px-3 py-2 transition-colors">
              Test
            </button>
          </div>
        </div>

        {testResult && (
          <div className="bg-white border border-stone-200/60 rounded-lg overflow-hidden mb-5">
            <div className="px-4 py-3 border-b border-stone-100">
              <span className="text-[10px] text-stone-400 font-medium">Patient</span>
              <p className="text-[12px] text-stone-600 mt-0.5">{testInput}</p>
            </div>
            <div className="px-4 py-3 bg-sage-50/30">
              <span className="text-[10px] text-sage-600 font-medium">
                {tmpl?.label || 'Agent'}
              </span>
              <p className="text-[12px] text-stone-600 mt-0.5">{testResult}</p>
            </div>
          </div>
        )}

        <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-3">Current config</div>
        <div className="bg-white border border-stone-200/60 rounded-lg p-4 space-y-3">
          <div>
            <div className="text-[10px] text-stone-400 mb-0.5">Template</div>
            <div className="text-[12px] text-stone-700 font-medium">{tmpl?.label || 'None selected'}</div>
          </div>
          <div>
            <div className="text-[10px] text-stone-400 mb-0.5">Tone</div>
            <div className="text-[12px] text-stone-600">
              W:{config.tone.warmth} D:{config.tone.directness} V:{config.tone.verbosity}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-stone-400 mb-0.5">Styles</div>
            <div className="text-[12px] text-stone-600">{config.styles.join(', ') || 'None'}</div>
          </div>
          <div>
            <div className="text-[10px] text-stone-400 mb-0.5">Boundaries</div>
            <div className="text-[12px] text-stone-600">{config.boundaries.length} rule{config.boundaries.length !== 1 ? 's' : ''}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
