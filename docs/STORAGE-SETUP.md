# Configuración de Firebase Storage (conductores)

Para que la subida de licencia y documentación funcione, haz lo siguiente.

## 1. Activar Storage

1. [Firebase Console](https://console.firebase.google.com) → proyecto **poxtgo-8444b**
2. **Build** → **Storage**
3. Si aparece "Get started", haz clic y crea el bucket (modo producción o prueba, según prefieras).

## 2. Reglas de Storage

En **Storage** → pestaña **Rules**, pega y publica:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/documents/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

(O despliega con CLI: `firebase deploy --only storage` si tienes `storage.rules` en el proyecto.)

## 3. CORS (importante para subir desde el navegador)

El bucket debe aceptar peticiones desde tu origen (localhost o tu dominio). Usa **Google Cloud SDK** (`gcloud` / `gsutil`).

### Instalar Google Cloud SDK (si no lo tienes)

- https://cloud.google.com/sdk/docs/install

### Aplicar CORS

En la raíz del proyecto (donde está `storage.cors.json`):

```bash
# Sustituye por tu bucket. Suele ser: poxtgo-8444b.appspot.com
gsutil cors set storage.cors.json gs://poxtgo-8444b.firebasestorage.app
```

Si tu bucket tiene otro nombre, en Firebase Console → Storage → al inicio verás algo como `gs://poxtgo-8444b....`; usa ese nombre.

**Producción:** cuando tengas dominio (ej. Netlify), añade en `storage.cors.json` tu URL (ej. `https://tu-app.netlify.app`) en `origin` y vuelve a ejecutar el comando anterior.

## 4. Probar de nuevo

Después de activar Storage, publicar reglas y configurar CORS, intenta de nuevo el registro como conductor (subir licencia).
