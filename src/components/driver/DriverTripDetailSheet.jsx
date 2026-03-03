import { useState, useEffect } from 'react'
import { MAPBOX_ACCESS_TOKEN } from '../../config/mapbox'
import { getRouteInfo } from '../../lib/mapboxDirections'
import MapWithRoute from '../MapWithRoute'
import { acceptTrip } from '../../lib/driverTrips'
import './DriverTripDetailSheet.css'

export default function DriverTripDetailSheet({ trip, driverId, onAccept, onReject }) {
  const [routeCoordinates, setRouteCoordinates] = useState(null)
  const [driverPosition, setDriverPosition] = useState(null)
  const [routeToPickup, setRouteToPickup] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const pickup = trip?.origin ? [trip.origin.lng, trip.origin.lat] : null
  const destination = trip?.destination ? [trip.destination.lng, trip.destination.lat] : null

  useEffect(() => {
    if (!trip?.id || !pickup?.length || !MAPBOX_ACCESS_TOKEN) return
    let cancelled = false
    if (!navigator.geolocation) {
      getRouteInfo(pickup, destination, MAPBOX_ACCESS_TOKEN).then((info) => {
        if (!cancelled) setRouteCoordinates(info?.coordinates ?? null)
      })
      return () => { cancelled = true }
    }
    getRouteInfo(pickup, destination, MAPBOX_ACCESS_TOKEN).then((info) => {
      if (!cancelled) setRouteCoordinates(info?.coordinates ?? null)
    })
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lng = pos.coords.longitude
        const lat = pos.coords.latitude
        const driverPos = [lng, lat]
        if (!cancelled) setDriverPosition(driverPos)
        getRouteInfo(driverPos, pickup, MAPBOX_ACCESS_TOKEN).then((info) => {
          if (!cancelled) setRouteToPickup(info?.coordinates ?? null)
        })
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    )
    return () => { cancelled = true }
  }, [trip?.id, pickup?.[0], pickup?.[1], destination?.[0], destination?.[1]])

  const origin = driverPosition || pickup
  const showRouteToPickup = Boolean(driverPosition && routeToPickup?.length)

  async function handleAccept() {
    setError('')
    setLoading(true)
    try {
      if (!driverId) {
        throw new Error('No se cargó tu sesión. Cierra esta ventana y vuelve a entrar.')
      }
      await acceptTrip(trip.id, driverId)
      onAccept?.()
    } catch (e) {
      const msg = e?.message || (e?.code ? `Error (${e.code}): revisa las reglas de Firestore` : String(e) || 'No se pudo aceptar el viaje')
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (!trip) return null

  return (
    <div className="driver-trip-detail-sheet" role="dialog" aria-modal="true" aria-label="Detalle del viaje">
      <div className="driver-trip-detail-backdrop" onClick={onReject} aria-hidden />
      <div className="driver-trip-detail-content">
        <header className="driver-trip-detail-header">
          <h2 className="driver-trip-detail-title">Detalle del viaje</h2>
          <button type="button" className="driver-trip-detail-close" onClick={onReject} aria-label="Cerrar">
            ×
          </button>
        </header>
        <div className="driver-trip-detail-actions">
          <button type="button" className="driver-trip-detail-btn driver-trip-detail-btn-reject" onClick={onReject} disabled={loading}>
            Rechazar
          </button>
          <button type="button" className="driver-trip-detail-btn driver-trip-detail-btn-accept" onClick={handleAccept} disabled={loading || !driverId}>
            {loading ? 'Aceptando…' : 'Aceptar viaje'}
          </button>
        </div>
        <div className="driver-trip-detail-scroll">
          <div className="driver-trip-detail-route">
            <p className="driver-trip-detail-origin">{trip.originName || 'Origen'}</p>
            <p className="driver-trip-detail-dest">{trip.destinationName || 'Destino'}</p>
          </div>
          <div className="driver-trip-detail-map-wrap">
            {pickup && destination && (
              <MapWithRoute
                origin={origin}
                destination={showRouteToPickup ? pickup : destination}
                routeCoordinates={showRouteToPickup ? routeToPickup : routeCoordinates}
                showUserLocation={!!driverPosition}
                skipOriginMarker={!!driverPosition}
              />
            )}
          </div>
          {error && (
            <div className="driver-trip-detail-error-wrap" role="alert">
              <p className="driver-trip-detail-error">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
