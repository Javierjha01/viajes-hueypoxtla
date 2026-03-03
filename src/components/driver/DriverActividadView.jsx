import { useState, useEffect } from 'react'
import { subscribeDriverTrips, TRIP_STATUS } from '../../lib/driverTrips'
import './DriverActividadView.css'

const STATUS_LABELS = {
  [TRIP_STATUS.requested]: 'Solicitado',
  [TRIP_STATUS.accepted]: 'Aceptado',
  [TRIP_STATUS.driver_en_route]: 'En camino a recoger',
  [TRIP_STATUS.picked_up]: 'Recogido',
  [TRIP_STATUS.in_progress]: 'En curso',
  [TRIP_STATUS.completed]: 'Completado',
  [TRIP_STATUS.cancelled]: 'Cancelado',
}

export default function DriverActividadView({ driverId }) {
  const [trips, setTrips] = useState([])

  useEffect(() => {
    if (!driverId) return
    const unsub = subscribeDriverTrips(driverId, (list) => setTrips(list || []))
    return () => unsub()
  }, [driverId])

  return (
    <section className="driver-actividad" aria-label="Actividad conductor">
      <h2 className="driver-actividad-title">Mis viajes</h2>
      <p className="driver-actividad-desc">Historial de viajes que has realizado.</p>
      {trips.length === 0 ? (
        <div className="driver-actividad-empty">
          <span className="driver-actividad-empty-icon" aria-hidden>🚗</span>
          <p>No hay viajes aún</p>
        </div>
      ) : (
        <ul className="driver-actividad-list">
          {trips.map((t) => (
            <li key={t.id} className="driver-actividad-card">
              <div className="driver-actividad-card-route">
                <p className="driver-actividad-card-origin">{t.originName || 'Origen'}</p>
                <p className="driver-actividad-card-dest">{t.destinationName || 'Destino'}</p>
              </div>
              <span className="driver-actividad-card-status">
                {STATUS_LABELS[t.status] || t.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
