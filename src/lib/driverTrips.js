import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../config/firebase'

const TRIPS = 'trips'
const DRIVER_STATUS = 'driverStatus'

/** Estados del viaje para sincronización cliente-conductor */
export const TRIP_STATUS = {
  requested: 'requested',           // Cliente solicitó; esperando conductor
  accepted: 'accepted',             // Conductor aceptó
  driver_en_route: 'driver_en_route', // Conductor en camino a recoger
  picked_up: 'picked_up',           // Cliente subió
  in_progress: 'in_progress',       // Viaje en curso
  completed: 'completed',
  cancelled: 'cancelled',
}

/**
 * Pone al conductor disponible o no disponible para recibir viajes.
 */
export async function setDriverOnline(uid, online) {
  const ref = doc(db, DRIVER_STATUS, uid)
  await setDoc(ref, { online: !!online, updatedAt: serverTimestamp() }, { merge: true })
}

/**
 * Guarda el token FCM del conductor para enviarle notificaciones push.
 */
export async function saveDriverFcmToken(uid, fcmToken) {
  const ref = doc(db, DRIVER_STATUS, uid)
  await setDoc(ref, { fcmToken: fcmToken || null, updatedAt: serverTimestamp() }, { merge: true })
}

/**
 * Obtiene el estado de disponibilidad del conductor.
 */
export async function getDriverStatus(uid) {
  const snap = await getDoc(doc(db, DRIVER_STATUS, uid))
  return snap.exists() ? snap.data() : { online: false }
}

/**
 * Suscripción en tiempo real al estado del conductor.
 */
export function subscribeDriverStatus(uid, callback) {
  const ref = doc(db, DRIVER_STATUS, uid)
  return onSnapshot(ref, (snap) => {
    callback(snap.exists() ? snap.data() : { online: false })
  })
}

/**
 * Crea una solicitud de viaje (cliente). Origen/destino en formato Mapbox.
 */
export async function createTripRequest({ clientId, origin, originName, destination, destinationName, serviceType = 'viaje' }) {
  const col = collection(db, TRIPS)
  const ref = doc(col)
  const data = {
    clientId,
    origin: Array.isArray(origin) ? { lng: origin[0], lat: origin[1] } : origin,
    originName: originName || '',
    destination: Array.isArray(destination) ? { lng: destination[0], lat: destination[1] } : destination,
    destinationName: destinationName || '',
    serviceType,
    status: TRIP_STATUS.requested,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  await setDoc(ref, data)
  return ref.id
}

/**
 * Lista solicitudes de viaje pendientes (sin conductor asignado).
 */
export async function getPendingTripRequests() {
  const q = query(
    collection(db, TRIPS),
    where('status', '==', TRIP_STATUS.requested),
    orderBy('createdAt', 'desc'),
    limit(20)
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toMillis?.() }))
}

/**
 * Suscripción en tiempo real a solicitudes pendientes (para conductores disponibles).
 */
export function subscribePendingTrips(callback) {
  const q = query(
    collection(db, TRIPS),
    where('status', '==', TRIP_STATUS.requested),
    orderBy('createdAt', 'desc'),
    limit(15)
  )
  return onSnapshot(q, (snap) => {
    const trips = snap.docs.map((d) => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toMillis?.() }))
    callback(trips)
  })
}

/**
 * Cliente cancela su solicitud de viaje (solo si status es requested).
 */
export async function cancelTrip(tripId, clientId) {
  const ref = doc(db, TRIPS, tripId)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('Viaje no encontrado')
  const data = snap.data()
  if (data.clientId !== clientId) throw new Error('No puedes cancelar este viaje')
  if (data.status !== TRIP_STATUS.requested) throw new Error('El viaje ya fue tomado')
  await updateDoc(ref, { status: TRIP_STATUS.cancelled, updatedAt: serverTimestamp() })
}

/**
 * Suscripción en tiempo real a un viaje (para el cliente).
 */
export function subscribeClientTrip(tripId, callback) {
  if (!tripId) return () => {}
  const ref = doc(db, TRIPS, tripId)
  return onSnapshot(ref, (snap) => {
    if (!snap.exists()) {
      callback(null)
      return
    }
    const d = snap.data()
    const createdAt = d.createdAt && typeof d.createdAt.toMillis === 'function' ? d.createdAt.toMillis() : d.createdAt
    const updatedAt = d.updatedAt && typeof d.updatedAt.toMillis === 'function' ? d.updatedAt.toMillis() : d.updatedAt
    callback({ id: snap.id, ...d, createdAt, updatedAt })
  })
}

const CLIENT_ACTIVE_STATUSES = [
  TRIP_STATUS.requested,
  TRIP_STATUS.accepted,
  TRIP_STATUS.driver_en_route,
  TRIP_STATUS.picked_up,
  TRIP_STATUS.in_progress,
]

/**
 * Suscripción al viaje activo o pendiente del cliente (para mostrar estado en Home).
 */
export function subscribeClientActiveTrip(clientId, callback) {
  if (!clientId) return () => {}
  const q = query(
    collection(db, TRIPS),
    where('clientId', '==', clientId),
    orderBy('updatedAt', 'desc'),
    limit(10)
  )
  return onSnapshot(q, (snap) => {
    const tripDoc = snap.docs.find((d) => CLIENT_ACTIVE_STATUSES.includes(d.data().status))
    if (!tripDoc) {
      callback(null)
      return
    }
    const d = tripDoc.data()
    const createdAt = d.createdAt && typeof d.createdAt.toMillis === 'function' ? d.createdAt.toMillis() : d.createdAt
    const updatedAt = d.updatedAt && typeof d.updatedAt.toMillis === 'function' ? d.updatedAt.toMillis() : d.updatedAt
    callback({ id: tripDoc.id, ...d, createdAt, updatedAt })
  })
}

/**
 * Conductor acepta un viaje. Sincroniza estado.
 */
export async function acceptTrip(tripId, driverId) {
  if (!tripId || !driverId) throw new Error('Datos incompletos')
  const ref = doc(db, TRIPS, tripId)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('Viaje no encontrado')
  const data = snap.data()
  if (data.status !== TRIP_STATUS.requested) throw new Error('El viaje ya no está disponible')
  await updateDoc(ref, {
    driverId,
    status: TRIP_STATUS.accepted,
    updatedAt: serverTimestamp(),
  })
}

/**
 * Conductor actualiza estado del viaje (en camino, recogí, en curso, finalizado).
 */
export async function updateTripStatus(tripId, status, driverId) {
  const ref = doc(db, TRIPS, tripId)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('Viaje no encontrado')
  const data = snap.data()
  if (data.driverId !== driverId) throw new Error('No eres el conductor de este viaje')
  const allowed = [
    TRIP_STATUS.accepted,
    TRIP_STATUS.driver_en_route,
    TRIP_STATUS.picked_up,
    TRIP_STATUS.in_progress,
    TRIP_STATUS.completed,
    TRIP_STATUS.cancelled,
  ]
  if (!allowed.includes(status)) throw new Error('Estado no válido')
  await updateDoc(ref, { status, updatedAt: serverTimestamp() })
}

/**
 * Cliente o conductor califica al otro al terminar el viaje.
 * @param {string} tripId
 * @param {'client'|'driver'} role - Quién califica: 'client' califica al conductor, 'driver' califica al pasajero
 * @param {number} score - 1 a 5
 */
export async function updateTripRating(tripId, role, score) {
  const ref = doc(db, TRIPS, tripId)
  const s = Math.min(5, Math.max(1, Number(score)))
  if (role === 'client') {
    await updateDoc(ref, { driverRatingByClient: s, updatedAt: serverTimestamp() })
  } else {
    await updateDoc(ref, { clientRatingByDriver: s, updatedAt: serverTimestamp() })
  }
}

/**
 * Viajes asignados a un conductor (para historial).
 */
export async function getDriverTrips(driverId, limitCount = 30) {
  const q = query(
    collection(db, TRIPS),
    where('driverId', '==', driverId),
    orderBy('updatedAt', 'desc'),
    limit(limitCount)
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data(), updatedAt: d.data().updatedAt?.toMillis?.() }))
}

const ACTIVE_STATUSES = [
  TRIP_STATUS.accepted,
  TRIP_STATUS.driver_en_route,
  TRIP_STATUS.picked_up,
  TRIP_STATUS.in_progress,
]

/**
 * Suscripción en tiempo real al viaje activo del conductor (un solo viaje no completado).
 * Filtra en memoria para evitar índice compuesto status+updatedAt.
 */
export function subscribeDriverActiveTrip(driverId, callback) {
  const q = query(
    collection(db, TRIPS),
    where('driverId', '==', driverId),
    orderBy('updatedAt', 'desc'),
    limit(15)
  )
  return onSnapshot(q, (snap) => {
    const active = snap.docs.find((d) => ACTIVE_STATUSES.includes(d.data().status))
    callback(active ? { id: active.id, ...active.data() } : null)
  })
}

/**
 * Suscripción a viajes del conductor para historial (Actividad).
 */
export function subscribeDriverTrips(driverId, callback) {
  const q = query(
    collection(db, TRIPS),
    where('driverId', '==', driverId),
    orderBy('updatedAt', 'desc'),
    limit(50)
  )
  return onSnapshot(q, (snap) => {
    const trips = snap.docs.map((d) => ({ id: d.id, ...d.data(), updatedAt: d.data().updatedAt?.toMillis?.() }))
    callback(trips)
  })
}
