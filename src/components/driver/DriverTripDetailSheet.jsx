import { useState, useEffect } from 'react'
import { MAPBOX_ACCESS_TOKEN } from '../../config/mapbox'
import { getRouteInfo } from '../../lib/mapboxDirections'
import MapWithRoute from '../MapWithRoute'
import { acceptTrip } from '../../lib/driverTrips'
import './DriverTripDetailSheet.css'

export default function DriverTripDetailSheet({ trip, driverId, onAccept, onReject }) {
  const [routeCoordinates, setRouteCoordinates] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const origin = trip?.origin ? [trip.origin.lng, trip.origin.lat] : null
  const destination = trip?.destination ? [trip.destination.lng, trip.destination.lat] : null

  useEffect(() => {
    if (!origin || !destination || !MAPBOX_ACCESS_TOKEN) return
    getRouteInfo(origin, destination, MAPBOX_ACCESS_TOKEN)
      .then((info) => setRouteCoordinates(info?.coordinates ?? null))
      .catch(() => setRouteCoordinates(null))
  }, [trip?.id, origin?.[0], origin?.[1], destination?.[0], destination?.[1]])

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
            {origin && destination && (
              <MapWithRoute origin={origin} destination={destination} routeCoordinates={routeCoordinates} />
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
