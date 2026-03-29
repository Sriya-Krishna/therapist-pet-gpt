import { Users, Bot, Activity, UserCircle, ArrowLeft, Palette } from 'lucide-react'

const navItems = [
  { id: 'patients', label: 'Patients', icon: Users },
  { id: 'agents', label: 'Agents', icon: Bot },
  { id: 'signals', label: 'Signals', icon: Activity },
]

export default function TopBar({ view, onNavigate, onGoHome, isPatientMode, onToggleMode, signalCount, patientTheme, onChangeTheme }) {
  return (
    <header className="h-14 bg-white border-b border-stone-200/70 flex items-center px-5 shrink-0">
      <button onClick={onGoHome} className="flex items-center gap-2.5 mr-8 hover:opacity-80 transition-opacity">
        <div className="w-7 h-7 rounded-md bg-sage-500 flex items-center justify-center shadow-sm">
          <span className="text-white text-xs font-bold tracking-tight">M</span>
        </div>
        <span className="text-sm font-semibold text-stone-800 tracking-tight">MindBridge</span>
      </button>

      {!isPatientMode && (
        <nav className="flex gap-0.5">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] transition-colors ${
                view === item.id
                  ? 'bg-sage-50 text-sage-700 font-medium'
                  : 'text-stone-500 hover:text-stone-700 hover:bg-stone-100'
              }`}
            >
              <item.icon size={15} strokeWidth={view === item.id ? 2 : 1.5} />
              {item.label}
              {item.id === 'signals' && signalCount > 0 && (
                <span className="ml-0.5 text-[10px] leading-none bg-red-500 text-white min-w-[16px] h-4 flex items-center justify-center rounded-full font-medium">
                  {signalCount}
                </span>
              )}
            </button>
          ))}
        </nav>
      )}

      <div className="flex-1" />

      {isPatientMode && (
        <div className="flex items-center gap-1.5 mr-3">
          <Palette size={14} className="text-stone-400" />
          <select
            value={patientTheme}
            onChange={e => onChangeTheme(e.target.value)}
            className="text-[12px] rounded-md border border-stone-200 px-2 py-1 text-stone-600 bg-white focus:outline-none cursor-pointer"
          >
            <option value="floral">Floral</option>
            <option value="starryNight">Starry Night</option>
            <option value="enthusiastic">Enthusiastic</option>
          </select>
        </div>
      )}

      <button
        onClick={onToggleMode}
        className={`flex items-center gap-1.5 text-[13px] rounded-md px-3 py-1.5 transition-colors ${
          isPatientMode
            ? 'text-stone-600 hover:bg-stone-100'
            : 'text-sage-700 bg-sage-50 hover:bg-sage-100'
        }`}
      >
        {isPatientMode ? (
          <>
            <ArrowLeft size={14} />
            Therapist view
          </>
        ) : (
          <>
            <UserCircle size={15} />
            Patient view
          </>
        )}
      </button>
    </header>
  )
}
