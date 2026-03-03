import './DriverBottomNav.css'

const navItems = [
  { id: 'inicio', label: 'Inicio', icon: IconHome },
  { id: 'actividad', label: 'Actividad', icon: IconActivity },
  { id: 'cuenta', label: 'Cuenta', icon: IconUser },
]

function IconHome({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {active ? (
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="currentColor" stroke="none" />
      ) : (
        <>
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </>
      )}
    </svg>
  )
}

function IconActivity({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" fill={active ? 'currentColor' : 'none'} />
    </svg>
  )
}

function IconUser({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" fill={active ? 'currentColor' : 'none'} />
      <circle cx="12" cy="7" r="4" fill={active ? 'currentColor' : 'none'} />
    </svg>
  )
}

export default function DriverBottomNav({ activeTab, onSelect }) {
  return (
    <nav className="driver-bottom-nav" aria-label="Navegación conductor">
      {navItems.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          className={`driver-bottom-nav-item ${activeTab === id ? 'active' : ''}`}
          onClick={() => onSelect(id)}
          aria-current={activeTab === id ? 'page' : undefined}
        >
          <Icon active={activeTab === id} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}
