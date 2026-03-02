/**
 * Token público de Mapbox para mapas y geocodificación en el cliente.
 * Se usa en componentes de mapa y validación de origen (ej. radio 300 m).
 */
export const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN

if (!MAPBOX_ACCESS_TOKEN && import.meta.env.DEV) {
  console.warn('VITE_MAPBOX_ACCESS_TOKEN no está definido. Los mapas no funcionarán.')
}
