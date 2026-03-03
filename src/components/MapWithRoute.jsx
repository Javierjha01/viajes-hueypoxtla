import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MAPBOX_ACCESS_TOKEN } from '../config/mapbox'
import { createPinMarkerElement } from '../lib/pinMarker'
import './MapWithRoute.css'

/**
 * Mapa con ruta opcional, ubicación del usuario (punto azul + rumbo) y/o marcador del conductor.
 * - origin, destination: [lng, lat] para centrado y marcadores
 * - routeCoordinates: geometría de la ruta (línea azul)
 * - showUserLocation: true = GeolocateControl (punto azul nativo + giroscopio/rumbo)
 * - skipOriginMarker: si true y showUserLocation, no dibuja el pin de origen (el azul es la ubicación del usuario)
 * - driverLocation: [lng, lat] opcional = marcador del conductor (verde) para vista del cliente
 */
export default function MapWithRoute({
  origin,
  destination,
  routeCoordinates,
  showUserLocation = false,
  skipOriginMarker = false,
  driverLocation = null,
}) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const driverMarkerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current || !MAPBOX_ACCESS_TOKEN) return
    const hasEndpoints = origin?.length === 2 && destination?.length === 2
    if (!hasEndpoints) return

    mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: origin,
      zoom: 12,
    })

    map.addControl(new mapboxgl.NavigationControl(), 'top-right')

    if (showUserLocation) {
      const geolocate = new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
        showUserLocation: true,
      })
      map.addControl(geolocate, 'top-right')
      map.on('load', () => geolocate.trigger())
    }

    const bounds = new mapboxgl.LngLatBounds()
    bounds.extend(origin)
    bounds.extend(destination)
    if (driverLocation?.length === 2) bounds.extend(driverLocation)
    map.fitBounds(bounds, { padding: 60, maxZoom: 14 })

    const markers = []
    if (!skipOriginMarker) {
      const mOrigin = new mapboxgl.Marker({ element: createPinMarkerElement('#3388ff'), anchor: 'bottom' })
        .setLngLat(origin)
        .addTo(map)
      markers.push(mOrigin)
    }
    const mDest = new mapboxgl.Marker({ element: createPinMarkerElement('#f97316'), anchor: 'bottom' })
      .setLngLat(destination)
      .addTo(map)
    markers.push(mDest)
    markersRef.current = markers
    mapRef.current = map

    return () => {
      markersRef.current.forEach((m) => m.remove())
      if (driverMarkerRef.current) {
        driverMarkerRef.current.remove()
        driverMarkerRef.current = null
      }
      map.remove()
      mapRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- init once

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (driverMarkerRef.current) {
      driverMarkerRef.current.remove()
      driverMarkerRef.current = null
    }
    if (driverLocation?.length === 2) {
      const el = createPinMarkerElement('#22c55e')
      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat(driverLocation)
        .addTo(map)
      driverMarkerRef.current = marker
    }
  }, [driverLocation])

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

  if (!origin?.length || !destination?.length || origin.length !== 2 || destination.length !== 2) return null

  return (
    <div
      ref={containerRef}
      className="map-with-route"
      aria-label="Mapa con ruta"
    />
  )
}
