/**
 * Genera public/firebase-messaging-sw.js desde las variables en .env
 * para no commitear claves en el repositorio.
 * Uso: node scripts/generate-firebase-sw.js
 */
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const envPath = join(root, '.env')
const outPath = join(root, 'public', 'firebase-messaging-sw.js')

function loadEnv() {
  const env = {}
  if (!existsSync(envPath)) return env
  const content = readFileSync(envPath, 'utf8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))
      value = value.slice(1, -1)
    env[key] = value
  }
  return env
}

const env = loadEnv()
const apiKey = env.VITE_FIREBASE_API_KEY || ''
const authDomain = env.VITE_FIREBASE_AUTH_DOMAIN || ''
const projectId = env.VITE_FIREBASE_PROJECT_ID || ''
const storageBucket = env.VITE_FIREBASE_STORAGE_BUCKET || ''
const messagingSenderId = env.VITE_FIREBASE_MESSAGING_SENDER_ID || ''
const appId = env.VITE_FIREBASE_APP_ID || ''
const measurementId = env.VITE_FIREBASE_MEASUREMENT_ID || ''

const content = `// Service worker para notificaciones push (FCM).
// Generado por scripts/generate-firebase-sw.js desde .env — no editar a mano.
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js')

const firebaseConfig = {
  apiKey: '${apiKey}',
  authDomain: '${authDomain}',
  projectId: '${projectId}',
  storageBucket: '${storageBucket}',
  messagingSenderId: '${messagingSenderId}',
  appId: '${appId}',
  measurementId: '${measurementId}',
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
`

writeFileSync(outPath, content, 'utf8')
console.log('Generado:', outPath)
