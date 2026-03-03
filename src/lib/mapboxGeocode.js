/**
 * Geocodificación inversa: obtiene el nombre del lugar a partir de coordenadas.
 * @param {number} lng - Longitud
 * @param {number} lat - Latitud
 * @param {string} accessToken - Token de Mapbox
 * @returns {Promise<string|null>} - place_name o null
 */
export async function reverseGeocode(lng, lat, accessToken) {
  if (!accessToken) return null
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${accessToken}&limit=1`
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    const feature = data.features?.[0]
    return feature ? feature.place_name : null
  } catch {
    return null
  }
}

/**
 * Búsqueda de lugares con Mapbox Geocoding API (autocompletado).
 * @param {string} query - Texto a buscar
 * @param {string} accessToken - Token de Mapbox
 * @param {object} options - { limit, proximity: [lng, lat], country }
 */
export async function searchPlaces(query, accessToken, options = {}) {
  if (!query?.trim() || !accessToken) return []
  const params = new URLSearchParams({
    access_token: accessToken,
    limit: String(options.limit ?? 5),
    country: options.country ?? 'MX',
  })
  if (options.proximity?.length === 2) {
    params.set('proximity', options.proximity.join(','))
  }
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query.trim())}.json?${params}`
  const res = await fetch(url)
  if (!res.ok) return []
  const data = await res.json()
  return (data.features || []).map((f) => ({
    id: f.id,
    place_name: f.place_name,
    center: f.center, // [lng, lat]
    text: f.text || f.place_name,
  }))
}
