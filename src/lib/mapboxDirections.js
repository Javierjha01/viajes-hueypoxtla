/**
 * Obtiene distancia, duración y geometría de la ruta entre origen y destino (Mapbox Directions API).
 * @param {[number, number]} origin - [lng, lat]
 * @param {[number, number]} destination - [lng, lat]
 * @param {string} accessToken - Token de Mapbox
 * @returns {{ distanceKm: number, durationMin: number, coordinates: number[][] } | null}
 */
export async function getRouteInfo(origin, destination, accessToken) {
  if (origin?.length !== 2 || destination?.length !== 2 || !accessToken) return null
  const coords = `${origin[0]},${origin[1]};${destination[0]},${destination[1]}`
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?access_token=${accessToken}&geometries=geojson&overview=full`
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    const route = data.routes?.[0]
    if (!route) return null
    const coordinates = route.geometry?.coordinates ?? []
    return {
      distanceKm: route.distance / 1000,
      durationMin: Math.round(route.duration / 60),
      coordinates,
    }
  } catch {
    return null
  }
}
