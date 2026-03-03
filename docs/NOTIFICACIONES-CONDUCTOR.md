# Notificaciones push para el conductor

Para que al conductor le llegue una notificación cuando un cliente solicita un viaje, hay que configurar Firebase Cloud Messaging (FCM) y desplegar la Cloud Function.

## 1. Clave VAPID (push web)

1. [Firebase Console](https://console.firebase.google.com) → proyecto **poxtgo-8444b**.
2. **Configuración del proyecto** (engranaje) → pestaña **Cloud Messaging**.
3. En **Certificados de push web**, genera un par de claves si no tienes.
4. Copia la **Clave pública** (VAPID key) y añádela a tu `.env`:
   ```bash
   VITE_FIREBASE_VAPID_KEY=tu_clave_larga_aqui
   ```

## 2. Service worker (config de Firebase)

El archivo `public/firebase-messaging-sw.js` **se genera automáticamente** desde tu `.env` al ejecutar `npm run dev` o `npm run build`. No lo edites a mano ni lo subas al repositorio (está en `.gitignore`).

Asegúrate de tener en `.env` todas las variables `VITE_FIREBASE_*` (apiKey, authDomain, projectId, etc.). Con eso las notificaciones en segundo plano (pestaña en background o app cerrada) funcionarán. Si cambias algo en `.env`, ejecuta `npm run generate-sw` o vuelve a levantar `npm run dev`.

## 3. Permisos en el navegador

- La primera vez que el conductor ponga **“Disponible para viajes”**, el navegador pedirá permiso para notificaciones.
- Tiene que aceptar para que se guarde el token FCM y lleguen las notificaciones.

## 4. Cloud Function (enviar la notificación)

La función envía la notificación a todos los conductores con `online: true` y `fcmToken` guardado.

1. Instalar dependencias de functions:
   ```bash
   cd functions && npm install && cd ..
   ```
2. Desplegar:
   ```bash
   firebase deploy --only functions
   ```

Si es la primera vez que usas Functions en el proyecto, en la consola de Firebase activa **Cloud Functions** y **Blaze** (plan de pago) cuando te lo pida.

## Resumen del flujo

1. Cliente confirma un viaje → se crea un documento en `trips` con `status: 'requested'`.
2. La Cloud Function `notifyDriversOnNewTrip` se ejecuta al crear ese documento.
3. La función busca en `driverStatus` documentos con `online === true` y `fcmToken` definido.
4. Envía un mensaje FCM a esos tokens: título “Nueva solicitud de viaje” y cuerpo con origen y destino.
5. El conductor recibe la notificación (en primer plano o en segundo plano según el service worker).
