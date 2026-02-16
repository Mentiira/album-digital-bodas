# 📊 Plan de Costos y Estrategia - Álbum Digital (2026)

Este documento resume los costos operativos de infraestructura (Cloudflare R2) comparados con los precios de venta propuestos.

## 🧮 Estimaciones de Almacenamiento
Para los cálculos se asumen los siguientes promedios:
- **Foto (WebP):** ~0.5 MB (con la compresión actual).
- **Video (HD/15s):** ~30 MB (sin compresión).
- **Tasa de cambio:** $1 USD = $18.50 MXN (estimado).

---

## 📦 Comparativa de Paquetes

| Concepto | Paquete Básico (Lanzamiento) | Paquete Premium |
| :--- | :--- | :--- |
| **Precio de Venta** | **$29.00 USD** (~$536 MXN) | **$49.00 USD** (~$906 MXN) |
| **Límite de Fotos** | 5,000 fotos | 10,000 fotos |
| **Límite de Videos** | 300 videos | 1,000 videos |
| **Almacenamiento Total** | ~11.5 GB | ~35.0 GB |
| **Coste R2 (Mes/Evento)** | **$0.02 USD** (~$0.41 MXN) | **$0.37 USD** (~$6.93 MXN) |
| **Margen Bruto (%)** | **99.9%** | **99.2%** |

---

## 💡 Análisis de Escalabilidad
- **Capacidad de Invitados:** Cloudflare R2 no cobra por transferencia de datos (Egress). Un evento de 5,000 fotos puede ser visto por 1,000 o 10,000 invitados y el costo seguirá siendo el mismo centavo de dólar. El límite real lo pone el espacio en disco, no el tráfico.
- **Trial Gratuito:** Recuerda que Cloudflare te da los **primeros 10 GB gratis** cada mes. 
  - Con el **Paquete Básico**, casi no pagarías nada de almacenamiento.
  - Con el **Paquete Premium**, el cobro empezaría a partir del video número 330 aproximadamente.

## 🚀 Recomendaciones Estratégicas
1. **Permanencia:** Define que el álbum estará disponible por un tiempo limitado (ej. 1 año). Esto te permite limpiar el almacenamiento periódicamente y mantener tus costos bajos a largo plazo.
2. **Upselling:** Si un cliente del paquete básico llega al límite de 5,000 fotos el día del evento, puedes ofrecerle el "Upgrade" al Premium por $20 USD adicionales en ese mismo instante.
3. **Optimización de Video:** Aunque 30 MB por video es seguro, si el negocio escala masivamente, podríamos habilitar compresión de video en la subida para reducir ese costo a la mitad.

---
*Documento generado para Daniel - Febrero 2026*
