/**
 * Comprime una imagen (File/Blob) redimensionando y reduciendo calidad.
 * Devuelve un Blob JPEG más liviano. Sin dependencias (usa Canvas).
 * Para documentos (licencia, tarjeta) 1024px y 0.78 es suficiente y reduce mucho el peso.
 * @param {File | Blob} file - Imagen del input
 * @param {{ maxWidth?: number, maxHeight?: number, quality?: number }} opts
 * @returns {Promise<Blob>} - Imagen comprimida (JPEG)
 */
export function compressImage(file, opts = {}) {
  const { maxWidth = 1024, maxHeight = 1024, quality = 0.78 } = opts
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > maxWidth || height > maxHeight) {
        const r = Math.min(maxWidth / width, maxHeight / height)
        width = Math.round(width * r)
        height = Math.round(height * r)
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(file)
        return
      }
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else resolve(file)
        },
        'image/jpeg',
        quality
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('No se pudo cargar la imagen'))
    }
    img.src = url
  })
}
