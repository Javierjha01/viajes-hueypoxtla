import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '../config/firebase'
import { compressImage } from './compressImage'

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/**
 * Comprime la imagen antes de subir: máx 1024px y calidad 0.78.
 * Reduce bastante el peso; el admin ve la misma URL sin cambios.
 */
async function maybeCompress(file) {
  if (!IMAGE_TYPES.includes(file.type)) return file
  try {
    return await compressImage(file, { maxWidth: 1024, maxHeight: 1024, quality: 0.78 })
  } catch {
    return file
  }
}

/**
 * Sube un archivo a users/{uid}/documents/{nombre} y devuelve la URL pública.
 * Las imágenes se comprimen antes de subir para ocupar menos.
 */
export async function uploadDriverDocument(uid, file, name) {
  const toUpload = await maybeCompress(file)
  const ext = (toUpload.type || '').includes('png') ? 'png' : 'jpg'
  const path = `users/${uid}/documents/${name}_${Date.now()}.${ext}`
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, toUpload)
  return getDownloadURL(storageRef)
}
