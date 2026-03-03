import { useState, useEffect } from 'react'
import {
  setDriverOnline,
  subscribeDriverStatus,
  subscribePendingTrips,
  subscribeDriverActiveTrip,
  updateTripStatus,
  updateTripRating,
  TRIP_STATUS,
} from '../../lib/driverTrips'
import { requestAndSaveDriverFcmToken } from '../../lib/driverNotifications'
import DriverTripDetailSheet from './DriverTripDetailSheet'
import RatingModal from '../RatingModal'
import './DriverInicioView.css'

const STATUS_LABELS = {
  [TRIP_STATUS.accepted]: 'Ir a recoger',
  [TRIP_STATUS.driver_en_route]: 'En camino a recoger',
  [TRIP_STATUS.picked_up]: 'Iniciar viaje',
  [TRIP_STATUS.in_progress]: 'Finalizar viaje',
}

const NEXT_STATUS = {
  [TRIP_STATUS.accepted]: TRIP_STATUS.driver_en_route,
  [TRIP_STATUS.driver_en_route]: TRIP_STATUS.picked_up,
  [TRIP_STATUS.picked_up]: TRIP_STATUS.in_progress,
  [TRIP_STATUS.in_progress]: TRIP_STATUS.completed,
}

export default function DriverInicioView({ driverId }) {
  const [online, setOnlineState] = useState(false)
  const [pendingTrips, setPendingTrips] = useState([])
  const [activeTrip, setActiveTrip] = useState(null)
  const [detailTrip, setDetailTrip] = useState(null)
  const [tripToRate, setTripToRate] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!driverId) return
    const unsubStatus = subscribeDriverStatus(driverId, (data) => setOnlineState(!!data?.online))
    return () => unsubStatus()
  }, [driverId])

  useEffect(() => {
    if (!driverId || !online) {
      setPendingTrips([])
      return
    }
    const unsub = subscribePendingTrips((trips) => setPendingTrips(trips || []))
    return () => unsub()
  }, [driverId, online])

  useEffect(() => {
    if (!driverId) return
    const unsub = subscribeDriverActiveTrip(driverId, setActiveTrip)
    return () => unsub()
  }, [driverId])

  async function handleToggleOnline() {
    setError('')
    setLoading(true)
    try {
      const newOnline = !online
      await setDriverOnline(driverId, newOnline)
      setOnlineState(newOnline)
      if (newOnline) {
        await requestAndSaveDriverFcmToken(driverId)
      }
    } catch (e) {
      setError(e.message || 'No se pudo actualizar la disponibilidad')
    } finally {
      setLoading(false)
    }
  }

  function openTripDetail(t) {
    setDetailTrip(t)
    setError('')
  }

  async function handleNextStep() {
    if (!activeTrip) return
    setError('')
    setLoading(true)
    const next = NEXT_STATUS[activeTrip.status]
    try {
      await updateTripStatus(activeTrip.id, next, driverId)
      if (next === TRIP_STATUS.completed) {
        setTripToRate(activeTrip)
        setActiveTrip(null)
      }
    } catch (e) {
      setError(e.message || 'No se pudo actualizar el viaje')
    } finally {
      setLoading(false)
    }
  }

  if (activeTrip) {
    const origin = activeTrip.origin
    const dest = activeTrip.destination
    const originName = activeTrip.originName || (origin ? `${origin.lat?.toFixed(4)}, ${origin.lng?.toFixed(4)}` : 'Origen')
    const destName = activeTrip.destinationName || (dest ? `${dest.lat?.toFixed(4)}, ${dest.lng?.toFixed(4)}` : 'Destino')
    const isCompleted = activeTrip.status === TRIP_STATUS.completed
    const nextLabel = activeTrip.status === TRIP_STATUS.accepted
      ? 'En camino a recoger'
      : activeTrip.status === TRIP_STATUS.driver_en_route
        ? 'Llegué a recoger'
        : activeTrip.status === TRIP_STATUS.picked_up
          ? 'Iniciar viaje'
          : 'Finalizar viaje'

    return (
      <section className="driver-inicio" aria-label="Inicio conductor">
        <div className="driver-inicio-active-card">
          <h2 className="driver-inicio-active-title">Viaje en curso</h2>
          <div className="driver-inicio-route">
            <p className="driver-inicio-route-origin">{originName}</p>
            <p className="driver-inicio-route-dest">{destName}</p>
          </div>
          <p className="driver-inicio-status-label">{STATUS_LABELS[activeTrip.status]}</p>
          {!isCompleted && (
            <button
              type="button"
              className="driver-inicio-btn driver-inicio-btn-primary"
              onClick={handleNextStep}
              disabled={loading}
            >
              {loading ? 'Actualizando…' : nextLabel}
            </button>
          )}
          {error && <p className="driver-inicio-error" role="alert">{error}</p>}
        </div>
      </section>
    )
  }

  return (
    <section className="driver-inicio" aria-label="Inicio conductor">
      <div className="driver-inicio-toggle-wrap">
        <span className="driver-inicio-toggle-label">
          {online ? 'Disponible para viajes' : 'No disponible'}
        </span>
        <button
          type="button"
          className={`driver-inicio-toggle ${online ? 'driver-inicio-toggle-on' : ''}`}
          onClick={handleToggleOnline}
          disabled={loading}
          aria-pressed={online}
        >
          <span className="driver-inicio-toggle-thumb" />
        </button>
      </div>

      {error && <p className="driver-inicio-error" role="alert">{error}</p>}

      {online && (
        <div className="driver-inicio-requests">
          <h2 className="driver-inicio-requests-title">Solicitudes de viaje</h2>
          {pendingTrips.length === 0 ? (
            <p className="driver-inicio-empty">No hay solicitudes nuevas. Estarás disponible para recibir viajes.</p>
          ) : (
            <>
              <ul className="driver-inicio-list">
                {pendingTrips.map((t) => (
                  <li key={t.id} className="driver-inicio-request-card">
                    <div className="driver-inicio-request-route">
                      <p className="driver-inicio-request-origin">{t.originName || 'Origen'}</p>
                      <p className="driver-inicio-request-dest">{t.destinationName || 'Destino'}</p>
                    </div>
                    <button
                      type="button"
                      className="driver-inicio-btn driver-inicio-btn-outline"
                      onClick={() => openTripDetail(t)}
                    >
                      Ver viaje
                    </button>
                  </li>
                ))}
              </ul>
              {detailTrip && (
                <DriverTripDetailSheet
                  trip={detailTrip}
                  driverId={driverId}
                  onAccept={() => setDetailTrip(null)}
                  onReject={() => setDetailTrip(null)}
                />
              )}
            </>
          )}
        </div>
      )}

      {tripToRate && (
        <RatingModal
          title="Califica al pasajero"
          onSubmit={async (score) => {
            await updateTripRating(tripToRate.id, 'driver', score)
            setTripToRate(null)
          }}
          onSkip={() => setTripToRate(null)}
        />
      )}
    </section>
  )
}
