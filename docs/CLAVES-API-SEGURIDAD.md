# Claves de API y seguridad (Google Cloud / Firebase)

## Qué hicimos en el repo

- **La clave de API ya no se guarda en el código versionado.**  
  El archivo `public/firebase-messaging-sw.js` se **genera** desde tu `.env` al ejecutar `npm run dev` o `npm run build`. Ese archivo está en `.gitignore`, así que no se sube a GitHub.

- **Generación manual (opcional):**  
  `npm run generate-sw`  
  Crea o actualiza `public/firebase-messaging-sw.js` con los valores actuales de `.env`.

## Si Google te avisó que la clave está expuesta (p. ej. en GitHub)

Sigue estos pasos en orden:

### 1. Rotar la clave en Google Cloud

1. Entra a [Google Cloud Console](https://console.cloud.google.com) → proyecto **poxtgo-8444b**.
2. **APIs y servicios** → **Credenciales**.
3. Localiza la clave de API que te indicaron (la que empieza por `AIzaSy...`).
4. Ábrela y pulsa **Volver a generar clave**. Confirma.
5. **Copia la nueva clave** y no la compartas.

### 2. Actualizar tu entorno local

En tu `.env` (solo en tu máquina, no se sube al repo), sustituye la clave antigua por la nueva:

```bash
VITE_FIREBASE_API_KEY=tu_nueva_clave_aqui
```

Luego regenera el service worker:

```bash
npm run generate-sw
```

Vuelve a probar la app en local (`npm run dev`).

### 3. Dejar de trackear el SW en Git (si aún lo tenías subido)

Para que `public/firebase-messaging-sw.js` deje de estar en el repositorio en el próximo commit (el archivo sigue en tu máquina porque se genera desde `.env`):

```bash
git rm --cached public/firebase-messaging-sw.js
```

Luego haz commit de este cambio junto con el resto (`.gitignore`, script de generación, documentación). A partir de ahí ese archivo no se subirá más.

### 4. Quitar la clave antigua del historial de GitHub (recomendado)

Aunque dejes de commitear el archivo, la clave **vieja** sigue en el historial del repo. Opciones:

- **Opción A – Restringir la clave antigua y no usarla:**  
  En Credenciales, edita la clave **antigua** (si aún aparece) y **elimínala** o restringe su uso al máximo. Así aunque alguien la tenga del historial, no podrá usarla.

- **Opción B – Limpiar historial (avanzado):**  
  Usar herramientas como `git filter-repo` o BFG para reescribir el historial y eliminar el archivo (o el valor) de todos los commits. Si lo haces, todo el equipo debe clonar de nuevo. Documentación: [GitHub - Eliminar datos sensibles](https://docs.github.com/es/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository).

### 5. Restringir la clave nueva

En **Credenciales** → tu **nueva** clave de API:

- **Restricciones de aplicación:**  
  Elige **Referentes HTTP** y agrega solo tus orígenes, por ejemplo:  
  `https://tudominio.com/*` y `http://localhost:*` (solo para desarrollo).

- **Restricciones de API:**  
  Activa **Restringir clave** y marca solo las APIs que uses (Firebase, etc.).

Así, aunque alguien obtenga la clave, solo funcionará en las URLs que tú indiques.

## Despliegue (Vercel, Netlify, etc.)

En la configuración del proyecto en tu plataforma, define las variables de entorno (las mismas que en `.env`, p. ej. `VITE_FIREBASE_API_KEY`, etc.). En el paso de build debe ejecutarse `npm run build`, que ya incluye la generación de `firebase-messaging-sw.js` a partir de esas variables. No hace falta subir ningún archivo con claves al repositorio.
