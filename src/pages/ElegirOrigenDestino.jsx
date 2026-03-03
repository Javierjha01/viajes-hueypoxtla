import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { MAPBOX_ACCESS_TOKEN } from '../config/mapbox'
import { createTripRequest } from '../lib/driverTrips'
import { searchPlaces, reverseGeocode } from '../lib/mapboxGeocode'
import { getRouteInfo } from '../lib/mapboxDirections'
import MapWithRoute from '../components/MapWithRoute'
import RideOptionsBottomSheet from '../components/RideOptionsBottomSheet'
import MapPicker from '../components/MapPicker'
import './ElegirOrigenDestino.css'

const HUEYPOXTLA_PROXIMITY = [-99.08, 19.91]

export default function ElegirOrigenDestino() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const destinoInicial = location.state?.destinoActual ?? ''
  const [origen, setOrigen] = useState('')
  const [origenCoords, setOrigenCoords] = useState(null) // { lat, lng }
  const [destino, setDestino] = useState(destinoInicial)
  const [sugerencias, setSugerencias] = useState([])
  const [loadingSugerencias, setLoadingSugerencias] = useState(false)
  const [destinoSeleccionado, setDestinoSeleccionado] = useState(null) // { place_name, center }
  const [distanciaInfo, setDistanciaInfo] = useState(null)
  const [loadingDistancia, setLoadingDistancia] = useState(false)
  const [loadingUbicacion, setLoadingUbicacion] = useState(true)
  const [errorUbicacion, setErrorUbicacion] = useState(null)
  const [mapPickerMode, setMapPickerMode] = useState(null) // null | 'origen' | 'destino'
  const debounceRef = useRef(null)
  const destInputRef = useRef(null)

  const actualizarUbicacionOrigen = useCallback(async (latitude, longitude) => {
    setOrigenCoords({ lat: latitude, lng: longitude })
    if (MAPBOX_ACCESS_TOKEN) {
      const placeName = await reverseGeocode(longitude, latitude, MAPBOX_ACCESS_TOKEN)
      setOrigen(placeName || 'Ubicación actual')
    } else {
      setOrigen('Ubicación actual')
    }
    setLoadingUbicacion(false)
  }, [])

  useEffect(() => {
    if (!navigator.geolocation) {
      setLoadingUbicacion(false)
      setOrigen('Tu ubicación (no disponible)')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        actualizarUbicacionOrigen(latitude, longitude)
      },
      () => {
        setOrigen('')
        setErrorUbicacion('No se pudo obtener la ubicación')
        setLoadingUbicacion(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [actualizarUbicacionOrigen])

  const fetchSugerencias = useCallback(async (texto) => {
    if (!MAPBOX_ACCESS_TOKEN || !texto.trim()) {
      setSugerencias([])
      return
    }
    setLoadingSugerencias(true)
    try {
      const list = await searchPlaces(texto, MAPBOX_ACCESS_TOKEN, {
        limit: 5,
        country: 'MX',
        proximity: HUEYPOXTLA_PROXIMITY,
      })
      setSugerencias(list)
    } catch {
      setSugerencias([])
    } finally {
      setLoadingSugerencias(false)
    }
  }, [])

  useEffect(() => {
    if (destinoSeleccionado) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!destino.trim()) {
      setSugerencias([])
      return
    }
    debounceRef.current = setTimeout(() => {
      fetchSugerencias(destino)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [destino, destinoSeleccionado, fetchSugerencias])

  useEffect(() => {
    if (!origenCoords || !destinoSeleccionado?.center || !MAPBOX_ACCESS_TOKEN) {
      setDistanciaInfo(null)
      return
    }
    const originLngLat = [origenCoords.lng, origenCoords.lat]
    setLoadingDistancia(true)
    setDistanciaInfo(null)
    getRouteInfo(originLngLat, destinoSeleccionado.center, MAPBOX_ACCESS_TOKEN)
      .then((info) => setDistanciaInfo(info))
      .finally(() => setLoadingDistancia(false))
  }, [origenCoords, destinoSeleccionado])

  function handleSelectSugerencia(sug) {
    setDestinoSeleccionado({ place_name: sug.place_name, center: sug.center })
    setDestino(sug.place_name)
    setSugerencias([])
  }

  function handleDestinoChange(e) {
    setDestino(e.target.value)
    setDestinoSeleccionado(null)
    setDistanciaInfo(null)
  }

  function handleConfirmar() {
    const destinoTexto = destinoSeleccionado?.place_name ?? destino.trim()
    navigate('/', {
      state: { origen: origen.trim(), destino: destinoTexto },
      replace: true,
    })
  }

  async function handleConfirmarViaje(opcion) {
    const destinoTexto = destinoSeleccionado?.place_name ?? destino.trim()
    const originLngLat = origenCoords ? [origenCoords.lng, origenCoords.lat] : null
    let tripId = null
    if (user?.uid && originLngLat && destinoSeleccionado?.center) {
      try {
        tripId = await createTripRequest({
          clientId: user.uid,
          origin: originLngLat,
          originName: origen.trim() || 'Origen',
          destination: destinoSeleccionado.center,
          destinationName: destinoTexto || 'Destino',
          serviceType: opcion?.id || 'viaje',
        })
      } catch (e) {
        console.error('Error al crear solicitud de viaje:', e)
      }
    }
    navigate('/', {
      state: { origen: origen.trim(), destino: destinoTexto, tripId },
      replace: true,
    })
  }

  function handleConfirmarMapPicker(result) {
    if (mapPickerMode === 'origen') {
      setOrigenCoords({ lat: result.center[1], lng: result.center[0] })
      setOrigen(result.place_name)
    } else {
      setDestinoSeleccionado({ place_name: result.place_name, center: result.center })
      setDestino(result.place_name)
    }
    setMapPickerMode(null)
  }

  function handleCambiarOrigen() {
    if (!navigator.geolocation) return
    setLoadingUbicacion(true)
    setErrorUbicacion(null)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        actualizarUbicacionOrigen(latitude, longitude)
      },
      () => {
        setErrorUbicacion('No se pudo obtener la ubicación')
        setLoadingUbicacion(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const mostrarRuta = destinoSeleccionado && distanciaInfo?.coordinates?.length > 0
  const originLngLat = origenCoords ? [origenCoords.lng, origenCoords.lat] : null
  const destLngLat = destinoSeleccionado?.center ?? null

  return (
    <div className="elegir-origen-destino">
      <header className="elegir-header">
        <button
          type="button"
          className="elegir-back"
          onClick={() => (mostrarRuta ? setDestinoSeleccionado(null) : navigate('/', { replace: true }))}
          aria-label={mostrarRuta ? 'Cambiar destino' : 'Volver'}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        {mostrarRuta ? (
          <div className="elegir-header-ruta">
            <button type="button" className="elegir-header-line-wrap elegir-header-line-tap" onClick={() => setDestinoSeleccionado(null)}>
              <p className="elegir-header-line elegir-header-origen">
                <span className="elegir-header-dot elegir-header-dot-origen" aria-hidden />
                {loadingUbicacion ? 'Obteniendo ubicación…' : (origen.length > 38 ? `${origen.slice(0, 35)}…` : origen)}
              </p>
            </button>
            <button type="button" className="elegir-header-line-wrap elegir-header-line-tap" onClick={() => setDestinoSeleccionado(null)}>
              <p className="elegir-header-line elegir-header-destino">
                <span className="elegir-header-dot elegir-header-dot-destino" aria-hidden />
                {destinoSeleccionado.place_name.length > 38 ? `${destinoSeleccionado.place_name.slice(0, 35)}…` : destinoSeleccionado.place_name}
              </p>
            </button>
          </div>
        ) : (
          <h1 className="elegir-title">Origen y destino</h1>
        )}
      </header>

      {mostrarRuta ? (
        <div className="elegir-vista-ruta">
          <div className="elegir-mapa-wrap">
            <MapWithRoute
              origin={originLngLat}
              destination={destLngLat}
              routeCoordinates={distanciaInfo.coordinates}
            />
          </div>
          <div className="elegir-sheet-wrap">
            <RideOptionsBottomSheet
              distanceKm={distanciaInfo.distanceKm}
              durationMin={distanciaInfo.durationMin}
              onConfirm={handleConfirmarViaje}
            />
          </div>
        </div>
      ) : (
      <div className="elegir-content">
        <label className="elegir-field">
          <span className="elegir-field-label">Tu ubicación</span>
          <div className="elegir-input-wrap elegir-input-origen">
            <span className="elegir-dot elegir-dot-origen" aria-hidden />
            <input
              type="text"
              value={loadingUbicacion ? '' : origen}
              onChange={(e) => setOrigen(e.target.value)}
              placeholder={loadingUbicacion ? 'Obteniendo ubicación…' : 'Edita tu ubicación'}
              disabled={loadingUbicacion}
              aria-label="Origen o ubicación actual"
            />
          </div>
          {origenCoords && (
            <button
              type="button"
              className="elegir-señalar-mapa"
              onClick={() => setMapPickerMode('origen')}
            >
              <svg className="elegir-señalar-mapa-icon" viewBox="0 0 1024 1024" fill="currentColor" aria-hidden><path d="M642.464889 252.604158c0-72.054059-58.411341-130.4654-130.4654-130.4654-72.053036 0-130.464377 58.411341-130.464377 130.4654 0 65.089437 47.668673 119.04121 109.998253 128.862903l0 520.393157 40.932248 0L532.465612 381.467061C594.796216 371.645368 642.464889 317.694619 642.464889 252.604158zM436.790576 214.232223c0-21.192671 17.180288-38.372959 38.371936-38.372959 21.192671 0 38.371936 17.180288 38.371936 38.372959 0 21.191648-17.179264 38.371936-38.371936 38.371936C453.96984 252.604158 436.790576 235.424894 436.790576 214.232223z"/></svg>
              <span>Señalar la ubicación en el mapa</span>
            </button>
          )}
          {errorUbicacion && (
            <span className="elegir-error">{errorUbicacion}</span>
          )}
        </label>

        <label className="elegir-field elegir-field-destino">
          <span className="elegir-field-label">¿A dónde vamos?</span>
          <div className="elegir-input-wrap elegir-input-destino">
            <span className="elegir-dot elegir-dot-destino" aria-hidden />
            <input
              ref={destInputRef}
              type="text"
              value={destino}
              onChange={handleDestinoChange}
              placeholder="Escribe para buscar un lugar"
              aria-label="Destino"
              aria-autocomplete="list"
              aria-expanded={sugerencias.length > 0}
            />
          </div>
          {loadingSugerencias && (
            <p className="elegir-sugerencias-loading">Buscando…</p>
          )}
          {origenCoords && (
            <button
              type="button"
              className="elegir-señalar-mapa"
              onClick={() => setMapPickerMode('destino')}
            >
              <svg className="elegir-señalar-mapa-icon" viewBox="0 0 1024 1024" fill="currentColor" aria-hidden><path d="M642.464889 252.604158c0-72.054059-58.411341-130.4654-130.4654-130.4654-72.053036 0-130.464377 58.411341-130.464377 130.4654 0 65.089437 47.668673 119.04121 109.998253 128.862903l0 520.393157 40.932248 0L532.465612 381.467061C594.796216 371.645368 642.464889 317.694619 642.464889 252.604158zM436.790576 214.232223c0-21.192671 17.180288-38.372959 38.371936-38.372959 21.192671 0 38.371936 17.180288 38.371936 38.372959 0 21.191648-17.179264 38.371936-38.371936 38.371936C453.96984 252.604158 436.790576 235.424894 436.790576 214.232223z"/></svg>
              <span>Señalar la ubicación en el mapa</span>
            </button>
          )}
          {sugerencias.length > 0 && !destinoSeleccionado && (
            <ul className="elegir-sugerencias" role="listbox">
              {sugerencias.map((sug) => (
                <li key={sug.id} role="option">
                  <button
                    type="button"
                    className="elegir-sugerencia-item"
                    onClick={() => handleSelectSugerencia(sug)}
                  >
                    {sug.place_name}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {destinoSeleccionado && (loadingDistancia || distanciaInfo) && (
            <div className="elegir-distancia">
              {loadingDistancia && <span>Calculando ruta…</span>}
              {!loadingDistancia && distanciaInfo && (
                <span>
                  Distancia: <strong>{distanciaInfo.distanceKm.toFixed(1)} km</strong>
                  {' · '}
                  Aprox. <strong>{distanciaInfo.durationMin} min</strong>
                </span>
              )}
            </div>
          )}
        </label>

        <button
          type="button"
          className="elegir-confirmar"
          onClick={handleConfirmar}
        >
          Listo
        </button>
      </div>
      )}

      {mapPickerMode && origenCoords && (
        <MapPicker
          ubicacionActual={[origenCoords.lng, origenCoords.lat]}
          mode={mapPickerMode}
          onConfirm={handleConfirmarMapPicker}
          onClose={() => setMapPickerMode(null)}
        />
      )}
    </div>
  )
}
