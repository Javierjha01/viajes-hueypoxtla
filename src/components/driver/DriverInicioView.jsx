import { useState, useEffect } from 'react'
import {
  setDriverOnline,
  subscribeDriverStatus,
  subscribePendingTrips,
  subscribeDriverActiveTrip,
  updateTripStatus,
  updateTripRating,
  updateDriverLocation,
  TRIP_STATUS,
} from '../../lib/driverTrips'
import { requestAndSaveDriverFcmToken } from '../../lib/driverNotifications'
import { MAPBOX_ACCESS_TOKEN } from '../../config/mapbox'
import { getRouteInfo } from '../../lib/mapboxDirections'
import DriverTripDetailSheet from './DriverTripDetailSheet'
import MapWithRoute from '../MapWithRoute'
import RatingModal from '../RatingModal'
import './DriverInicioView.css'

const DRIVER_LOCATION_INTERVAL_MS = 5000

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
  const [driverPosition, setDriverPosition] = useState(null)
  const [routeToPickup, setRouteToPickup] = useState(null)
  const [tripRouteCoords, setTripRouteCoords] = useState(null)

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

  useEffect(() => {
    if (!activeTrip || !driverId) return
    const pickup = activeTrip.origin ? [activeTrip.origin.lng, activeTrip.origin.lat] : null
    const dest = activeTrip.destination ? [activeTrip.destination.lng, activeTrip.destination.lat] : null
    if (activeTrip.status === TRIP_STATUS.picked_up || activeTrip.status === TRIP_STATUS.in_progress) {
      if (pickup?.length === 2 && dest?.length === 2 && MAPBOX_ACCESS_TOKEN) {
        getRouteInfo(pickup, dest, MAPBOX_ACCESS_TOKEN).then((info) =>
          setTripRouteCoords(info?.coordinates ?? null)
        )
      }
      return
    }
    setTripRouteCoords(null)
  }, [activeTrip?.id, activeTrip?.status, activeTrip?.origin, activeTrip?.destination, driverId])

  useEffect(() => {
    if (!activeTrip || !driverId) return
    const status = activeTrip.status
    if (status !== TRIP_STATUS.accepted && status !== TRIP_STATUS.driver_en_route && status !== TRIP_STATUS.picked_up && status !== TRIP_STATUS.in_progress) return
    if (!navigator.geolocation) return

    let watchId = null
    let intervalId = null
    const pickup = activeTrip.origin ? [activeTrip.origin.lng, activeTrip.origin.lat] : null

    const updateLocation = (lat, lng) => {
      setDriverPosition([lng, lat])
      updateDriverLocation(activeTrip.id, driverId, lat, lng).catch(() => {})
      if ((status === TRIP_STATUS.accepted || status === TRIP_STATUS.driver_en_route) && pickup?.length === 2 && MAPBOX_ACCESS_TOKEN) {
        getRouteInfo([lng, lat], pickup, MAPBOX_ACCESS_TOKEN).then((info) =>
          setRouteToPickup(info?.coordinates ?? null)
        )
      }
    }

    watchId = navigator.geolocation.watchPosition(
      (pos) => updateLocation(pos.coords.latitude, pos.coords.longitude),
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000 }
    )
    intervalId = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => updateLocation(pos.coords.latitude, pos.coords.longitude),
        () => {},
        { enableHighAccuracy: true }
      )
    }, DRIVER_LOCATION_INTERVAL_MS)

    return () => {
      if (watchId != null) navigator.geolocation.clearWatch(watchId)
      if (intervalId != null) clearInterval(intervalId)
      setDriverPosition(null)
      setRouteToPickup(null)
    }
  }, [activeTrip?.id, activeTrip?.status, driverId])

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
    const pickup = origin ? [origin.lng, origin.lat] : null
    const destCoords = dest ? [dest.lng, dest.lat] : null
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

    const isToPickup = activeTrip.status === TRIP_STATUS.accepted || activeTrip.status === TRIP_STATUS.driver_en_route
    const mapOrigin = isToPickup && driverPosition?.length === 2 ? driverPosition : pickup
    const mapDest = isToPickup ? pickup : destCoords
    const mapRoute = isToPickup ? routeToPickup : tripRouteCoords

    return (
      <section className="driver-inicio" aria-label="Inicio conductor">
        <div className="driver-inicio-active-card">
          <h2 className="driver-inicio-active-title">Viaje en curso</h2>
          <div className="driver-inicio-route">
            <p className="driver-inicio-route-origin">{originName}</p>
            <p className="driver-inicio-route-dest">{destName}</p>
          </div>
          {pickup && mapDest && (
            <div className="driver-inicio-map-wrap">
              <MapWithRoute
                origin={mapOrigin}
                destination={mapDest}
                routeCoordinates={mapRoute}
                showUserLocation
                skipOriginMarker={isToPickup && driverPosition?.length === 2}
              />
            </div>
          )}
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
