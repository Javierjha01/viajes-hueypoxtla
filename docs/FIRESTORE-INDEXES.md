# Índices de Firestore (viajes y conductor)

Las consultas de la app de conductores y viajes necesitan **índices compuestos** en Firestore.

## Opción 1: Crear el índice desde el error (rápido)

Cuando la app muestre un error como:

```
The query requires an index. You can create it here: https://console.firebase.google.com/...
```

1. **Abre ese enlace** en el navegador (está en el mensaje de error de la consola).
2. Inicia sesión en Firebase si hace falta.
3. Pulsa **Create index** y espera unos minutos a que el índice pase a “Enabled”.

Después recarga la app del conductor.

## Opción 2: Crear los índices en la consola a mano

1. [Firebase Console](https://console.firebase.google.com) → proyecto **poxtgo-8444b**.
2. **Build** → **Firestore Database** → pestaña **Indexes**.
3. **Create index** y crea estos dos:

| Colección | Campo 1      | Orden   | Campo 2     | Orden    |
|-----------|-------------|---------|-------------|----------|
| trips     | status      | Ascending | createdAt | Descending |
| trips     | driverId    | Ascending | updatedAt | Descending |

## Opción 3: Desplegar con Firebase CLI

Si tienes el proyecto enlazado con Firebase (`firebase init` ya hecho):

```bash
firebase deploy --only firestore:indexes
```

Eso usa el archivo `firestore.indexes.json` del proyecto y crea (o actualiza) los índices. Puede tardar varios minutos en completarse.
