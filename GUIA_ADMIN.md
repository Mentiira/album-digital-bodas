# 📖 Guía de Administración - Álbum Digital

Sigue estos pasos para gestionar tus eventos y clientes.

## 1. Crear una nueva Boda (Ruta)
1. Entra a tu [Firebase Console](https://console.firebase.google.com/).
2. Ve a **Firestore Database**.
3. En la colección **`events`**, haz clic en **"Añadir documento"**.
4. **ID del Documento (El Link)**: Escribe el nombre que irá en la URL. 
   - ❌ *Mal*: `boda pedro&ana`
   - ✅ *Bien*: `boda-pedro-y-ana`
5. **Agrega los campos**:
   - `title` (String): "Boda de Pedro & Ana" (Aquí sí puedes usar &).
   - `date` (String): "25 de Octubre 2025".
6. Haz clic en **Guardar**.

## 2. Convertir a un Cliente en ADMIN
1. Comparte el link con el cliente. Pídele que entre y escriba su nombre (ej: "Sonia - Novia").
2. Una vez que entre, ve a Firebase a: `events` -> `(tu-boda)` -> `guests`.
3. Busca el documento de la persona (mira el campo `alias`).
4. Haz clic en **"+ Agregar campo"**:
   - Nombre: `role`
   - Tipo: `string`
   - Valor: `admin`
5. Haz clic en **Guardar**.
6. **Resultado**: El cliente ahora verá el botón "Descargar todas" en su perfil y podrá borrar cualquier foto de la galería.

---
*Manual generado por Antigravity para Daniel.*
