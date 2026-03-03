import { useState } from 'react'
import './RideOptionsBottomSheet.css'

const OPCIONES = [
  { id: 'express', label: 'Express', icon: '🚗', pasajeros: 4, base: 25, porKm: 12 },
  { id: 'moto', label: 'Moto', icon: '🏍️', pasajeros: 1, base: 20, porKm: 10 },
  { id: 'rapido', label: 'Más Rápido', icon: '⚡', pasajeros: 4, base: 35, porKm: 15 },
]

function formatPrecio(num) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(num)
}

export default function RideOptionsBottomSheet({ distanceKm, durationMin, onConfirm }) {
  const [seleccionado, setSeleccionado] = useState('express')

  const opcionesConPrecio = OPCIONES.map((op) => ({
    ...op,
    precio: Math.round(op.base + op.porKm * distanceKm),
  }))

  const opcionActual = opcionesConPrecio.find((o) => o.id === seleccionado)

  function handleConfirmar() {
    if (onConfirm && opcionActual) onConfirm(opcionActual)
  }

  return (
    <div className="ride-options-sheet">
      <div className="ride-options-sheet-handle" aria-hidden />
      <div className="ride-options-sheet-content">
        <ul className="ride-options-list" role="list">
          {opcionesConPrecio.map((op) => (
            <li key={op.id}>
              <button
                type="button"
                className={seleccionado === op.id ? 'ride-option ride-option--active' : 'ride-option'}
                onClick={() => setSeleccionado(op.id)}
              >
                <span className="ride-option-icon" aria-hidden>{op.icon}</span>
                <div className="ride-option-info">
                  <span className="ride-option-label">
                    {op.label}
                    {op.pasajeros > 1 ? ` ${op.pasajeros}` : ''}
                  </span>
                  <span className="ride-option-time">
                    En {Math.min(durationMin, 5)} min · Llegada aprox.
                  </span>
                </div>
                <span className="ride-option-price">{formatPrecio(op.precio)}</span>
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="ride-options-confirmar"
          onClick={handleConfirmar}
        >
          Confirmar {opcionActual ? opcionActual.label : 'viaje'}
        </button>
      </div>
    </div>
  )
}
