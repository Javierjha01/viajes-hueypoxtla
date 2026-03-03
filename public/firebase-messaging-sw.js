// Service worker para notificaciones push (FCM).
// Generado por scripts/generate-firebase-sw.js desde .env — no editar a mano.
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js')

const firebaseConfig = {
  apiKey: 'AIzaSyDCC0TyOVwjLHqpNOVsckYIdqLW57JTpAI',
  authDomain: 'poxtgo-8444b.firebaseapp.com',
  projectId: 'poxtgo-8444b',
  storageBucket: 'poxtgo-8444b.firebasestorage.app',
  messagingSenderId: '238005174046',
  appId: '1:238005174046:web:cf0228656f775c72de130f',
  measurementId: 'G-SKV8NY4JVM',
}

firebase.initializeApp(firebaseConfig)
const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || payload.data?.title || 'Nueva solicitud de viaje'
  const options = {
    body: payload.notification?.body || payload.data?.body || 'Un cliente ha solicitado un viaje.',
    icon: '/vite.svg',
    data: payload.data || {},
  }
  self.registration.showNotification(title, options)
})
