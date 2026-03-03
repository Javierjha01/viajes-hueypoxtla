import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MAPBOX_ACCESS_TOKEN } from '../config/mapbox'
import { reverseGeocode } from '../lib/mapboxGeocode'
import { createPinMarkerElement } from '../lib/pinMarker'
import './MapPicker.css'

export default function MapPicker({ ubicacionActual, mode, onConfirm, onClose }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markerActualRef = useRef(null)
  const markerPuntoRef = useRef(null)
  const geolocateControlRef = useRef(null)
  const [puntoSeleccionado, setPuntoSeleccionado] = useState(null)
  const [placeName, setPlaceName] = useState('')
  const [loadingName, setLoadingName] = useState(false)
  const [deviceCoords, setDeviceCoords] = useState(null) // [lng, lat] para línea cuando modo origen

  const isOrigen = mode === 'origen'
  const titulo = isOrigen ? 'Elige el origen' : 'Elige el destino'
  const confirmLabel = isOrigen ? 'Confirmar el origen' : 'Confirmar el destino'
  const fromCoords = isOrigen ? (deviceCoords || ubicacionActual) : ubicacionActual

  useEffect(() => {
    if (!containerRef.current || !MAPBOX_ACCESS_TOKEN || !ubicacionActual || ubicacionActual.length !== 2) return
    const center = ubicacionActual
    mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center,
      zoom: 14,
    })
    map.addControl(new mapboxgl.NavigationControl(), 'top-right')

    if (isOrigen) {
      const geolocate = new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
        showUserLocation: true,
      })
      geolocate.on('geolocate', (e) => {
        setDeviceCoords([e.coords.longitude, e.coords.latitude])
      })
      map.addControl(geolocate, 'top-left')
      geolocateControlRef.current = geolocate
      map.once('load', () => {
        geolocate.trigger()
      })
    } else {
      const markerActual = new mapboxgl.Marker({ element: createPinMarkerElement('#3388ff'), anchor: 'bottom' })
        .setLngLat(ubicacionActual)
        .addTo(map)
      markerActualRef.current = markerActual
    }

    mapRef.current = map
    map.on('click', (e) => {
      setPuntoSeleccionado([e.lngLat.lng, e.lngLat.lat])
    })

    return () => {
      if (markerActualRef.current) markerActualRef.current.remove()
      if (markerPuntoRef.current) markerPuntoRef.current.remove()
      geolocateControlRef.current = null
      map.remove()
      mapRef.current = null
    }
  }, [ubicacionActual, isOrigen])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (markerPuntoRef.current) {
      markerPuntoRef.current.remove()
      markerPuntoRef.current = null
    }
    if (puntoSeleccionado) {
      const color = isOrigen ? '#3388ff' : '#f97316'
      const marker = new mapboxgl.Marker({ element: createPinMarkerElement(color), anchor: 'bottom' })
        .setLngLat(puntoSeleccionado)
        .addTo(map)
      markerPuntoRef.current = marker
      setLoadingName(true)
      reverseGeocode(puntoSeleccionado[0], puntoSeleccionado[1], MAPBOX_ACCESS_TOKEN)
        .then((name) => setPlaceName(name || 'Ubicación seleccionada'))
        .finally(() => setLoadingName(false))
    } else {
      setPlaceName('')
    }
  }, [puntoSeleccionado, isOrigen])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !fromCoords || fromCoords.length !== 2 || !puntoSeleccionado) return
    const coords = [fromCoords, puntoSeleccionado]
    const sourceId = 'picker-line'
    const layerId = 'picker-line-layer'
    const addLine = () => {
      if (map.getSource(sourceId)) {
        map.getSource(sourceId).setData({
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: coords },
        })
        return
      }
      map.addSource(sourceId, {
        type: 'geojson',
        data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } },
      })
      map.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': isOrigen ? '#3388ff' : '#f97316',
          'line-width': 4,
          'line-dasharray': [2, 2],
        },
      })
    }
    if (map.isStyleLoaded && map.isStyleLoaded()) addLine()
    else map.once('load', addLine)
  }, [fromCoords, puntoSeleccionado, isOrigen])

  function handleConfirmar() {
    if (!puntoSeleccionado) return
    const name = placeName || 'Ubicación seleccionada'
    if (onConfirm) onConfirm({ place_name: name, center: puntoSeleccionado })
    if (onClose) onClose()
  }

  return (
    <div className="map-picker">
      <button type="button" className="map-picker-close" onClick={onClose} aria-label="Cerrar">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
      <div ref={containerRef} className="map-picker-map" aria-label="Mapa para señalar ubicación" />
      <div className="map-picker-sheet">
        <h2 className="map-picker-title">{titulo}</h2>
        <div className="map-picker-selected">
          <span className={isOrigen ? 'map-picker-dot map-picker-dot-origen' : 'map-picker-dot map-picker-dot-destino'} aria-hidden />
          {loadingName ? 'Obteniendo dirección…' : (placeName || 'Toca el mapa para elegir un punto')}
        </div>
        <button
          type="button"
          className="map-picker-confirmar"
          onClick={handleConfirmar}
          disabled={!puntoSeleccionado}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  )
}
