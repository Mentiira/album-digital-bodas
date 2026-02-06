# 🚀 Guía de Configuración Inicial

Sigue estos pasos para poner en marcha tu Álbum Digital.

## 1. Firebase (Metadata y Chat)
1. Ve a [Firebase Console](https://console.firebase.google.com/).
2. Crea un nuevo proyecto llamado `Album Digital`.
3. Registra una **Web App** (icono `</>`).
4. **Copia las credenciales** que te den (`apiKey`, `authDomain`, etc.) y pégalas en tu archivo `.env.local` (usa la plantilla `.env.local.template`).
5. En el menú lateral:
   - **Authentication**: Activa el método "Anonymous" (Anónimo).
   - **Firestore Database**: Crea la base de datos en modo producción y elige una ubicación cercana.
   - Ve a la pestaña **Rules** en Firestore y pega el contenido del archivo `firestore.rules` que he creado.

## 2. Cloudflare R2 (Fotos y Videos)
1. Ve a tu panel de Cloudflare -> **R2**.
2. Crea un **Bucket** llamado `album-digital`.
3. Entra al Bucket -> **Settings** -> **Public Access**:
   - Conecta un dominio o activa el subdominio de `r2.dev` para poder ver las fotos.
   - Copia esa URL en `NEXT_PUBLIC_R2_PUBLIC_URL`.
4. En la página principal de R2, haz clic en **Manage R2 API Tokens** (derecha):
   - Crea un token con permisos de **Edit**.
   - Copia el `Access Key ID`, `Secret Access Key` y el `Endpoint`.
   - Pégalos en tu archivo `.env.local`.

## 3. Ejecutar la App
1. Abre una terminal en la carpeta del proyecto.
2. Ejecuta `npm run dev`.
3. Entra a `http://localhost:3000`.

---
¡Listo! La app detectará automáticamente el idioma y te pedirá tu nombre para empezar.
