const PIN_PATH = 'M642.464889 252.604158c0-72.054059-58.411341-130.4654-130.4654-130.4654-72.053036 0-130.464377 58.411341-130.464377 130.4654 0 65.089437 47.668673 119.04121 109.998253 128.862903l0 520.393157 40.932248 0L532.465612 381.467061C594.796216 371.645368 642.464889 317.694619 642.464889 252.604158zM436.790576 214.232223c0-21.192671 17.180288-38.372959 38.371936-38.372959 21.192671 0 38.371936 17.180288 38.371936 38.372959 0 21.191648-17.179264 38.371936-38.371936 38.371936C453.96984 252.604158 436.790576 235.424894 436.790576 214.232223z'

/**
 * Crea un elemento DOM con el icono pin para usar como marcador en Mapbox.
 * @param {string} color - Color de relleno (ej. '#22c55e', '#f97316')
 * @returns {HTMLDivElement}
 */
export function createPinMarkerElement(color) {
  const el = document.createElement('div')
  el.className = 'map-pin-marker'
  el.innerHTML = `<svg viewBox="0 0 1024 1024" fill="${color}" xmlns="http://www.w3.org/2000/svg"><path d="${PIN_PATH}"/></svg>`
  return el
}
