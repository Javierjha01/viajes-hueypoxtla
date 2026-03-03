import { useState } from 'react'
import './RequestPanel.css'

const SERVICIOS = [
  { id: 'viaje', label: 'Viaje', icon: '🚗' },
  { id: 'comida', label: 'Comida', icon: '🍽️' },
  { id: 'mandado', label: 'Mandado', icon: '🛒' },
  { id: 'mudanza', label: 'Mudanza', icon: '📦' },
]

export default function RequestPanel({ profile }) {
  const [servicio, setServicio] = useState('viaje')

  return (
    <div className="request-panel">
      <div className="request-panel-form">
        <fieldset className="request-panel-service">
          <legend className="request-panel-service-legend">Servicio</legend>
          <div className="request-panel-service-grid">
            {SERVICIOS.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`request-panel-service-card ${servicio === s.id ? 'active' : ''}`}
                onClick={() => setServicio(s.id)}
              >
                <span className="request-panel-service-icon" aria-hidden>{s.icon}</span>
                <span className="request-panel-service-label">{s.label}</span>
              </button>
            ))}
          </div>
        </fieldset>
      </div>
    </div>
  )
}
