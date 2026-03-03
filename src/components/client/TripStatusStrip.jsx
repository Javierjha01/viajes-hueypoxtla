import { useState, useEffect, useRef } from 'react'
import lottie from 'lottie-web'
import { subscribeClientTrip, cancelTrip, updateTripRating, TRIP_STATUS } from '../../lib/driverTrips'
import { MAPBOX_ACCESS_TOKEN } from '../../config/mapbox'
import { getRouteInfo } from '../../lib/mapboxDirections'
import RatingModal from '../RatingModal'
import MapWithRoute from '../MapWithRoute'
import './TripStatusStrip.css'

const STEPS = [
  { key: TRIP_STATUS.requested, label: 'Buscando conductor' },
  { key: TRIP_STATUS.accepted, label: 'Conductor asignado' },
  { key: TRIP_STATUS.driver_en_route, label: 'En camino a recoger' },
  { key: TRIP_STATUS.picked_up, label: 'Recogido' },
  { key: TRIP_STATUS.in_progress, label: 'En camino' },
  { key: TRIP_STATUS.completed, label: 'Completado' },
]

const STEP_INDEX = Object.fromEntries(STEPS.map((s, i) => [s.key, i]))
const AUTO_CANCEL_MS = 5 * 60 * 1000

export default function TripStatusStrip({ tripId, clientId, onDismiss }) {
  const [trip, setTrip] = useState(null)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState('')
  const [now, setNow] = useState(() => Date.now())
  const [ratingDone, setRatingDone] = useState(false)
  const [clientMapRoute, setClientMapRoute] = useState(null)
  const progressRef = useRef(null)
  const animRef = useRef(null)

  const pickup = trip?.origin ? [trip.origin.lng, trip.origin.lat] : null
  const dest = trip?.destination ? [trip.destination.lng, trip.destination.lat] : null
  const driverLoc = trip?.driverLocation ? [trip.driverLocation.lng, trip.driverLocation.lat] : null
  const showClientMap = pickup?.length === 2 && dest?.length === 2 && trip && (trip.status === TRIP_STATUS.accepted || trip.status === TRIP_STATUS.driver_en_route || trip.status === TRIP_STATUS.picked_up || trip.status === TRIP_STATUS.in_progress)

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!tripId) return
    return subscribeClientTrip(tripId, setTrip)
  }, [tripId])

  useEffect(() => {
    if (!trip || trip.status !== TRIP_STATUS.requested || !trip.createdAt) return
    const elapsed = Date.now() - trip.createdAt
    if (elapsed >= AUTO_CANCEL_MS) {
      cancelTrip(tripId, clientId).catch(() => {})
      return
    }
    const remaining = AUTO_CANCEL_MS - elapsed
    const t = setTimeout(() => {
      cancelTrip(tripId, clientId).catch(() => {})
    }, remaining)
    return () => clearTimeout(t)
  }, [trip?.status, trip?.createdAt, tripId, clientId])

  useEffect(() => {
    if (!progressRef.current || !trip) return
    if (animRef.current) animRef.current.destroy()
    animRef.current = lottie.loadAnimation({
      container: progressRef.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: '/progressBar.json',
    })
    return () => {
      if (animRef.current) animRef.current.destroy()
    }
  }, [trip?.id, trip?.status])

  useEffect(() => {
    if (!showClientMap || !MAPBOX_ACCESS_TOKEN || !trip) return
    const isToPickup = trip.status === TRIP_STATUS.driver_en_route || trip.status === TRIP_STATUS.accepted
    if (isToPickup && driverLoc?.length === 2) {
      getRouteInfo(driverLoc, pickup, MAPBOX_ACCESS_TOKEN).then((info) =>
        setClientMapRoute(info?.coordinates ?? null)
      )
    } else if (trip.status === TRIP_STATUS.picked_up || trip.status === TRIP_STATUS.in_progress) {
      getRouteInfo(pickup, dest, MAPBOX_ACCESS_TOKEN).then((info) =>
        setClientMapRoute(info?.coordinates ?? null)
      )
    } else {
      setClientMapRoute(null)
    }
  }, [showClientMap, trip?.status, driverLoc?.[0], driverLoc?.[1], pickup?.[0], pickup?.[1], dest?.[0], dest?.[1]])

  const handleCancel = async () => {
    setError('')
    setCancelling(true)
    try {
      await cancelTrip(tripId, clientId)
      onDismiss?.()
    } catch (e) {
      setError(e.message || 'No se pudo cancelar')
    } finally {
      setCancelling(false)
    }
  }

  if (!trip) {
    return (
      <div className="trip-status-strip trip-status-strip--loading">
        <p className="trip-status-strip-loading">Cargando estado del viaje…</p>
      </div>
    )
  }
  if (trip.status === TRIP_STATUS.cancelled) {
    return (
      <div className="trip-status-strip trip-status-strip--cancelled">
        <p className="trip-status-strip-result">Viaje cancelado</p>
        <button type="button" className="trip-status-strip-dismiss" onClick={onDismiss}>
          Cerrar
        </button>
      </div>
    )
  }

  const stepIndex = STEP_INDEX[trip.status] ?? 0
  const currentLabel = STEPS[stepIndex]?.label ?? trip.status
  const canCancel = trip.status === TRIP_STATUS.requested
  const createdAt = trip.createdAt || 0
  const elapsed = now - createdAt
  const cancelInSec = Math.max(0, Math.ceil((AUTO_CANCEL_MS - elapsed) / 1000))

  const isClientMapToPickup = trip.status === TRIP_STATUS.driver_en_route || trip.status === TRIP_STATUS.accepted
  const clientMapOrigin = isClientMapToPickup && driverLoc?.length === 2 ? driverLoc : pickup
  const clientMapDest = isClientMapToPickup ? pickup : dest

  return (
    <div className="trip-status-strip">
      <p className="trip-status-strip-title" aria-live="polite">
        {currentLabel}
      </p>
      {showClientMap && clientMapOrigin && clientMapDest && (
        <div className="trip-status-strip-map-wrap">
          <MapWithRoute
            origin={clientMapOrigin}
            destination={clientMapDest}
            routeCoordinates={clientMapRoute}
            driverLocation={!isClientMapToPickup ? driverLoc : null}
          />
        </div>
      )}
      <div className="trip-status-segments" role="progressbar" aria-valuenow={stepIndex + 1} aria-valuemin={1} aria-valuemax={STEPS.length} aria-label="Progreso del viaje">
        {STEPS.map((step, i) => (
          <div
            key={step.key}
            className={`trip-status-segment ${i < stepIndex ? 'trip-status-segment--done' : ''} ${i === stepIndex ? 'trip-status-segment--current' : ''}`}
          >
            {i < stepIndex && <span className="trip-status-segment-check" aria-hidden>✓</span>}
            {i === stepIndex && (
              <div ref={progressRef} className="trip-status-segment-spinner" aria-hidden />
            )}
          </div>
        ))}
      </div>
      {canCancel && (
        <div className="trip-status-strip-actions">
          <p className="trip-status-strip-timer">
            {cancelInSec > 0 ? `Se cancelará en ${Math.floor(cancelInSec / 60)}:${String(cancelInSec % 60).padStart(2, '0')}` : 'Cancelando…'}
          </p>
          <button
            type="button"
            className="trip-status-strip-cancel"
            onClick={handleCancel}
            disabled={cancelling}
          >
            {cancelling ? 'Cancelando…' : 'Cancelar viaje'}
          </button>
        </div>
      )}
      {trip.status === TRIP_STATUS.completed && (
        <>
          <button type="button" className="trip-status-strip-dismiss" onClick={onDismiss}>
            Cerrar
          </button>
          {!trip.driverRatingByClient && !ratingDone && (
            <RatingModal
              title="Califica a tu conductor"
              onSubmit={async (score) => {
                await updateTripRating(tripId, 'client', score)
                setRatingDone(true)
              }}
              onSkip={() => setRatingDone(true)}
            />
          )}
        </>
      )}
      {error && <p className="trip-status-strip-error" role="alert">{error}</p>}
    </div>
  )
}
