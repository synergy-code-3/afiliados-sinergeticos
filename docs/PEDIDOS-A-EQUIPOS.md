# Lo que hay que pedirle a otros equipos

Todo lo que el portal de afiliados necesita y que **no depende de programación**.
Agrupado por a quién se le pide. Cada punto trae la especificación técnica para que
llegue listo para subir y no haya que rehacerlo.

**Límites del portal (aplican a todo lo descargable):** máximo **50 MB por archivo**.
Formatos aceptados: imagen (`jpg`, `png`, `webp`, `gif`), video (`mp4`, `mov`, `webm`),
cualquier otro archivo (`pdf`…) o un link externo.

---

## 1 · Equipo de la boletera (synergyticket)

### 1.1 Exponer la asistencia — LO MÁS IMPORTANTE
**Qué:** que el ticket diga si la persona fue escaneada en la puerta.
**Por qué:** hoy el portal mide boletos emitidos, que es esfuerzo, no resultado. Un
afiliado que inscribe 40 y llevan 3 se ve mejor que uno que inscribe 10 y llegan 8. Sin
esto no se puede premiar bien ni detectar listas infladas.
**Cómo:** agregar `scanned` y `scannedAt` al `GET /api/tickets/:id` que ya existe, o un
endpoint por lote autenticado con la key interna que ya usamos.
**Detalle completo, con las dos opciones técnicas:** `docs/PETICION-BOLETERA-ASISTENCIA.md`.

### 1.2 🔴 Habilitar el "Pase de Afiliado" en la API interna — BLOQUEANTE

**El boleto YA EXISTE** (lo crearon el 4-ago): en su panel se llama **"Boleto de
Afiliados"**, es el naranja, y por dentro su identificador es **`general`**
(su bundle mapea `general → "Boleto de Afiliados"`; buscar "afiliado" o "affiliate" en su
base no devuelve nada). La plantilla se actualizó el 4-ago 17:19 y
`general_ticket_enabled` está activo en todos los eventos próximos, con `general_price`
vacío — o sea, sigue siendo cortesía.

**El problema:** `POST /api/internal/tickets` —la ruta que usa el portal— valida el tipo
contra un enum que **solo acepta `free`, `club-general` y `club-vip`**. Mandar `general`
devuelve:

```
400 · Invalid enum value. Expected 'free' | 'club-general' | 'club-vip', received 'general'
```

**Qué pedir:** que agreguen `general` (o el identificador definitivo del Pase de Afiliado)
a ese enum de `/api/internal/tickets`.

**Mientras tanto** el portal sigue emitiendo `free` — el mismo boleto que dan las
landings, sin forma de distinguir en la puerta quién llegó por un afiliado. En cuanto lo
habiliten, el cambio de nuestro lado es UNA línea en `lib/boletera.ts`.

---

## 2 · Manuel — videos

Los dos van dentro del panel del afiliado, en la sección de recursos.

**Especificación para ambos:** `mp4`, vertical (9:16) o horizontal (16:9) — se ven en
móvil, así que **vertical funciona mejor**. Máximo 50 MB (si pesa más, se sube a
YouTube/Drive y me pasas el link). Con audio claro; se van a ver desde el celular en la
calle.

### 2.1 "Cómo invitar a alguien"
**Qué:** tutorial de uso, paso a paso: entrar al portal, elegir evento, capturar al
invitado y qué le llega por WhatsApp.
**Duración sugerida:** 2–3 min.
**Para quién:** un afiliado nuevo que acaba de crear su cuenta.

### 2.2 "Mejores prácticas para maximizar tus comisiones"
**Qué:** cómo invitar bien, no solo cómo usar el sistema. En la junta se dijo que
explicarle el Club a la persona antes del evento sube mucho la probabilidad de cierre.
**Duración sugerida:** 3–5 min.

---

## 3 · Clau / Dani / Diana — materiales de venta

Van en la sección de recursos, para que el afiliado los descargue y los mande por
WhatsApp. **Formato: PDF** (y si hay versión imagen para WhatsApp, mejor: `jpg` vertical).

### 3.1 Brochure de Legendaria
Material de venta existente. **Solo hace falta que me lo pasen.**

### 3.2 Brochure de Club Sinergético
Material de venta existente. **Solo hace falta que me lo pasen.**

### 3.3 Brochure del Seminario — NO EXISTE, HAY QUE CREARLO
**Qué:** "por qué tienes que ir al evento presencial", con gráficos.
**Por qué:** es el material que el afiliado usa para convencer a su invitado de asistir,
que es justo donde se gana o se pierde el programa. En la junta se detectó que no existe.
**Debe responder:** qué es el seminario, qué se lleva quien va, por qué vale la pena
mover la agenda, y prueba social.

### 3.4 Imagen personalizada "te invita al Seminario"
**Qué:** una plantilla donde salga la **foto del afiliado** y su nombre —
"Luis te invita al Seminario" — al estilo de la que se hizo en Método CEO.
**Qué necesito para poder generarla:** el archivo editable con la zona de la foto
(preferible circular) y la zona del nombre claramente separadas del fondo.
**Falta decidir:** si la foto la sube el afiliado en su perfil o se toma de otro lado.

### 3.5b Plantilla Canva "Sesión Informativa - Comunidad Sinergética"
Pedida en el Plan de Acción. Campos editables: **ciudad, fecha, hora y enlace de Zoom**,
con fotos de Manuel de León y Jorge Serratos.

### 3.5 Carpeta de branding
Branding del **Seminario** y del **Club Sinergético** para que Clau arme la presentación.
Pedido en la junta.

### 3.6 Presentación del plan de compensación
Dani y Diana arman la estructura, Clau la diseña. Va incrustada en el portal.
**Depende de que estén definidos los porcentajes (punto 4).**

---

## 4 · Decisiones de negocio (David / Jorge / Dani)

Nada de esto se puede programar hasta que estén definidos. **En cuanto se publiquen son
una promesa a los afiliados.**

### 4.1 ✅ YA LLEGÓ — Comisiones México vs USA
`Plan_Accion_Estrategia_Referidos_Eventos_Presenciales.pdf`: **20% de cada venta**, igual
en ambos países. México $12,500/$13,000/$15,000 MXN → $2,500/$2,600/$3,000. USA
$1,500/$2,250/$3,000 USD → $300/$450/$600. Meta: 20-30 referidos por afiliado.

### 4.2 Porcentajes por tipo de invitación
Tres caminos que se quieren abrir: **evento presencial**, **webinar** y **venta directa**.
En la junta se dijo que la de webinar debe ser más alta y la de venta directa superior a
las dos, pero **no se definieron los montos** ("vamos viendo").

### 4.3 El nivel de 200 referidos
La escalera quedó confirmada en 10 / 20 / 50 / 100. El de 200 quedó en "déjalo así".
**Decidir si existe o si la escalera cierra en 100.**

### 4.4 La leyenda de probabilidades — CUIDADO
Se quiere mostrar "30% de que compren, 50% si les explicas el Club antes". En la misma
junta se dijo textualmente *"ahorita no tenemos métricas"*: esos números son estimaciones.
**Dos caminos:** o se calculan de la base real (ya hay datos de compras y asistencia), o
se redactan como expectativa y no como estadística. Publicar porcentajes inventados hace
que los afiliados proyecten ingresos con ellos y reclamen después.

### 4.5 Invitación entre afiliados
En la junta se acordó que un afiliado pueda invitar a otros **"por buena fe", sin ganar
comisión por lo que produzcan** — en cuanto gane por los referidos de sus referidos es
multinivel y eso exige un plan de compensación revisado antes de prometer nada.
**Confirmar que sigue siendo así antes de construirlo.**
