import { doc, setDoc } from 'firebase/firestore'
import { db } from '../config/firebase'

/**
 * Crea el perfil de un cliente en Firestore (users/{uid}).
 */
export async function createUserProfile(uid, { email, role, nombre, apellidos, telefono }) {
  const data = {
    email,
    role,
    createdAt: new Date().toISOString(),
  }
  if (nombre != null) data.nombre = nombre.trim()
  if (apellidos != null) data.apellidos = apellidos.trim()
  if (telefono != null && telefono !== '') data.telefono = telefono
  await setDoc(doc(db, 'users', uid), data)
}

/**
 * Crea el perfil de un conductor con datos del auto, licencia y URLs de documentación.
 * status: 'pending_approval' hasta que un admin apruebe.
 */
export async function createDriverProfile(uid, payload) {
  const {
    email,
    nombre,
    apellidos,
    telefono,
    car = {},
    license = {},
    licenseFileUrl,
    carDocUrl,
  } = payload
  const docData = {
    email: email || '',
    role: 'driver',
    nombre: (nombre || '').trim(),
    apellidos: (apellidos || '').trim(),
    car: {
      marca: (car.marca || '').trim(),
      modelo: (car.modelo || '').trim(),
      placa: (car.placa || '').trim().toUpperCase(),
      color: (car.color || '').trim(),
    },
    license: {
      number: (license.number || '').trim(),
      imageUrl: licenseFileUrl || null,
    },
    documentacionAutoUrl: carDocUrl || null,
    status: 'pending_approval',
    createdAt: new Date().toISOString(),
  }
  if (telefono != null && telefono !== '') docData.telefono = telefono
  await setDoc(doc(db, 'users', uid), docData)
}
