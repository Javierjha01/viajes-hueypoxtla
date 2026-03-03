import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'
import { onDocumentCreated } from 'firebase-functions/v2/firestore'

initializeApp()

const db = getFirestore()
const messaging = getMessaging()

/**
 * Cuando se crea una solicitud de viaje (status requested),
 * envía una notificación push a todos los conductores disponibles (online con fcmToken).
 */
export const notifyDriversOnNewTrip = onDocumentCreated(
  {
    document: 'trips/{tripId}',
    region: 'us-central1',
  },
  async (event) => {
    const snap = event.data
    if (!snap) return
    const data = snap.data()
    if (data.status !== 'requested') return

    const originName = data.originName || 'Origen'
    const destinationName = data.destinationName || 'Destino'

    const driverStatusSnap = await db.collection('driverStatus')
      .where('online', '==', true)
      .get()

    const tokens = []
    driverStatusSnap.docs.forEach((doc) => {
      const token = doc.data().fcmToken
      if (token && typeof token === 'string') tokens.push(token)
    })

    if (tokens.length === 0) return

    const message = {
      notification: {
        title: 'Nueva solicitud de viaje',
        body: `${originName} → ${destinationName}`,
      },
      data: {
        type: 'new_trip',
        tripId: snap.id,
        originName: String(originName),
        destinationName: String(destinationName),
      },
      tokens,
      webpush: {
        fcmOptions: {
          link: '/',
        },
      },
    }

    try {
      const response = await messaging.sendEachForMulticast(message)
      console.log(`Notificación enviada: ${response.successCount} éxito, ${response.failureCount} fallos`)
    } catch (err) {
      console.error('Error enviando notificación a conductores:', err)
    }
  }
)
