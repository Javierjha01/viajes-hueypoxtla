import { getToken, onMessage } from 'firebase/messaging'
import { getMessagingIfSupported } from '../config/firebase'
import { saveDriverFcmToken } from './driverTrips'

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY
const SW_PATH = '/firebase-messaging-sw.js'

/**
 * Pide permiso de notificaciones, obtiene el token FCM y lo guarda en Firestore
 * para que el conductor reciba push cuando haya un nuevo viaje.
 * @param {string} driverId - UID del conductor
 * @returns {Promise<string|null>} Token o null si no se pudo obtener
 */
export async function requestAndSaveDriverFcmToken(driverId) {
  if (!driverId || !VAPID_KEY) return null
  const messaging = await getMessagingIfSupported()
  if (!messaging) return null

  try {
    let registration = await navigator.serviceWorker.getRegistration(SW_PATH)
    if (!registration) {
      registration = await navigator.serviceWorker.register(SW_PATH)
      await registration.update()
    }
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    })
    if (token) {
      await saveDriverFcmToken(driverId, token)
      return token
    }
  } catch (e) {
    console.warn('FCM token error:', e)
  }
  return null
}

/**
 * Suscripción a mensajes en primer plano (app abierta).
 * @param {function} callback - (payload) => void
 * @returns {function} Función para cancelar
 */
export async function onForegroundNotification(callback) {
  const messaging = await getMessagingIfSupported()
  if (!messaging) return () => {}
  return onMessage(messaging, callback)
}
