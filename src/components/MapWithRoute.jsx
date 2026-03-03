import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MAPBOX_ACCESS_TOKEN } from '../config/mapbox'
import { createPinMarkerElement } from '../lib/pinMarker'
import './MapWithRoute.css'

export default function MapWithRoute({ origin, destination, routeCoordinates }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])

  useEffect(() => {
    if (!containerRef.current || !MAPBOX_ACCESS_TOKEN || origin?.length !== 2 || destination?.length !== 2) return

    mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: origin,
      zoom: 12,
    })

    map.addControl(new mapboxgl.NavigationControl(), 'top-right')

    const bounds = new mapboxgl.LngLatBounds()
    bounds.extend(origin)
    bounds.extend(destination)
    map.fitBounds(bounds, { padding: 60, maxZoom: 14 })

    const markerOrigen = new mapboxgl.Marker({ element: createPinMarkerElement('#3388ff'), anchor: 'bottom' })
      .setLngLat(origin)
      .addTo(map)
    const markerDestino = new mapboxgl.Marker({ element: createPinMarkerElement('#f97316'), anchor: 'bottom' })
      .setLngLat(destination)
      .addTo(map)
    markersRef.current = [markerOrigen, markerDestino]
    mapRef.current = map

    return () => {
      markersRef.current.forEach((m) => m.remove())
      map.remove()
      mapRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- init once with initial origin/dest

  useEffect(() => {
    const map = mapRef.current
    if (!map || !routeCoordinates?.length) return

    const sourceId = 'route'
    const layerId = 'route-line'
    const geojson = {
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: routeCoordinates },
    }

    const addRoute = () => {
      if (map.getSource(sourceId)) {
        map.getSource(sourceId).setData(geojson)
        return
      }
      map.addSource(sourceId, { type: 'geojson', data: geojson })
      map.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#3388ff', 'line-width': 5 },
      })
    }

    if (map.isStyleLoaded?.()) {
      addRoute()
    } else {
      map.once('load', addRoute)
    }
  }, [routeCoordinates])

  return (
    <div
      ref={containerRef}
      className="map-with-route"
      aria-label="Mapa con ruta de origen a destino"
    />
  )
}
