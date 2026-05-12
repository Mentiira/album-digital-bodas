# 🌐 Infraestructura y Límites - Facturación Cloudflare

Este documento resume los límites y costos de la plataforma para asegurar la continuidad de los eventos.

## 🚀 Cloudflare Pages (App Web)
*   **Ancho de Banda:** **ILIMITADO y GRATIS**. No hay cargos por el número de visitas.
*   **Solicitudes Estáticas:** **ILIMITADAS**. La carga de la página (HTML/CSS/JS) no genera costos.
*   **Dominios Personalizados:** Hasta 100 dominios en el plan gratuito.

## 🧠 Cloudflare Workers (Funciones Inteligentes)
*Se activa al subir fotos, mensajes de chat y generar URLs de descarga.*
*   **Plan Gratuito:** **100,000 solicitudes GRATIS al día**.
    *   **Si se excede:** Se detiene el servicio temporalmente (Error 1015) hasta el día siguiente. **No hay cargos sorpresa.**
*   **Plan de Pago (Opcional):** **$5.00 USD/mes** por 1 Millón de solicitudes.
    *   **Exceso:** $0.30 USD por cada millón adicional. **El servicio nunca se detiene.**

## 📦 Cloudflare R2 (Almacenamiento de Fotos/Videos)
*   **Almacenamiento:** **Primeros 10 GB GRATIS**. Después $0.015 USD por GB/mes.
*   **Transferencia (Egress):** **TOTALMENTE GRATIS**. No pagas por el tráfico de descarga (ver fotos).
*   **Operaciones Clase A (Subida):** 1 Millón gratis/mes ($4.50 por millón adicional).
*   **Operaciones Clase B (Lectura):** 10 Millones gratis/mes ($0.36 por millón adicional).

## 💬 Firebase (Base de Datos del Chat)
*   **Lectura de Datos:** **50,000 lecturas GRATIS al día**.
*   **Escritura de Datos:** **20,000 escrituras GRATIS al día**.
*   **Almacenamiento:** 1 GB gratis.

---

### 💡 Conclusión para Daniel
Tu plataforma es extremadamente rentable. En el 99% de los eventos (bodas de hasta 500-800 personas), los costos operativos serán de **casi $0 USD** gracias a los generosos planes gratuitos de Cloudflare y Firebase. Solo pagarás los centavos de almacenamiento en R2 si los álbumes se mantienen guardados por mucho tiempo.

*Documento actualizado: Febrero 2026*
