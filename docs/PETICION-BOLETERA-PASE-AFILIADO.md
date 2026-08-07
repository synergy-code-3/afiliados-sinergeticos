# Petición a la boletera — Pase de Afiliado

**Fecha:** 6-ago-2026 · **Estado:** pendiente de respuesta de Replit

## Contexto

El sistema de afiliados emite boletos de cortesía a los invitados de cada afiliado,
por `POST /api/internal/tickets` con `ticket_type`.

El 4 de agosto empezamos a emitir `ticket_type: "general"` porque en su panel ese
tipo aparece rotulado **"Pase de Afiliado"** (el naranja) — justo lo que queríamos.

El 6 de agosto lo revertimos a `"free"` de urgencia: **los invitados que recibieron
el pase naranja quedaron con acceso a Synergy Unlimited**, que es un evento de paga
distinto. El tipo `general` arrastra esa lógica aunque su etiqueta diga otra cosa.

Hoy los invitados reciben otra vez el azul "Pase General" (`free`), y los afiliados
ya notaron la diferencia entre los invitados de antes y los de ahora.

## Lo que necesitamos

### 1. Un identificador que emita el pase naranja SIN acceso a Synergy Unlimited

¿Cuál es el `ticket_type` correcto para el Pase de Afiliado, que imprima el diseño
naranja y **no** conceda entrada a Synergy Unlimited?

Si `general` es el único que existe, necesitamos que separen las dos cosas: el
diseño/etiqueta del pase por un lado, el acceso al evento de paga por otro.

### 2. NO borrar los 60 boletos `general` ya emitidos

⚠️ **Crítico.** Esos boletos son de personas reales que van a llegar a la puerta del
Seminario de San Antonio del 20 de agosto, entre otros.

- **Sí:** quitarles el acceso a Synergy Unlimited
- **No:** cancelar, borrar o invalidar el boleto

Si se borran, 56 invitados se quedan sin entrada al evento al que sí fueron invitados.

### 3. Confirmación antes de reactivarlo

No vamos a volver a emitir el naranja hasta que nos confirmen el punto 1. Cuando lo
hagan, lo probamos con **un** invitado real y revisamos qué recibió de verdad —
no basta con que la API responda 201.

## Dato de contacto para la prueba

Cualquier duda del lado nuestro: el emisor es `lib/boletera.ts` del repo
`afiliados-sinergeticos`, con la llave `SYNERGYTICKET_INTERNAL_API_KEY`.
