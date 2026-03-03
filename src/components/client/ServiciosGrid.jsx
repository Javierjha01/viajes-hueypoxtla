import './ServiciosGrid.css'

const SERVICIOS = [
  { id: 'viaje', label: 'Viaje', icon: '🚗' },
  { id: 'comida', label: 'Comida', icon: '🍽️' },
  { id: 'mandado', label: 'Mandado', icon: '🛒' },
  { id: 'mudanza', label: 'Mudanza', icon: '📦' },
]

export default function ServiciosGrid({ onSelectService }) {
  return (
    <section className="servicios-grid-wrap" aria-label="Servicios disponibles">
      <p className="servicios-grid-desc">Ve a cualquier parte y pide lo que quieras</p>
      <div className="servicios-grid">
        {SERVICIOS.map((s) => (
          <button
            key={s.id}
            type="button"
            className="servicios-grid-item"
            onClick={() => onSelectService?.(s.id)}
          >
            <span className="servicios-grid-icon" aria-hidden>{s.icon}</span>
            <span className="servicios-grid-label">{s.label}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
