# Petición al equipo de la boletera — exponer la asistencia

**Para:** quien mantiene `synergyticket.net`
**Contexto:** portal de afiliados (`afiliados.sinergeticos.com`), que emite boletos gratis
por la API interna y necesita cerrar el ciclo: saber quién **asistió**, no solo quién
recibió boleto.

## Qué necesitamos

Que el ticket exponga si fue escaneado en puerta. La boletera ya lo guarda —
en su propio bundle aparecen los campos `scanned` y `scannedAt`, y existen
`/scanner` y `POST /api/tickets/scan`. Solo falta que salga hacia afuera.

**Opción A (la más simple):** agregar dos campos al `GET /api/tickets/:id` que ya existe
y ya es público:

```jsonc
{
  "id": "fcb4e1d8-...",
  "qrCode": "AXIS-...",
  "status": "paid",
  "scanned": true,           // <-- falta
  "scannedAt": "2026-08-08T17:12:03.000Z"  // <-- falta (null si no ha entrado)
  // ...el resto igual
}
```

**Opción B (mejor para volumen):** un endpoint por lote, autenticado con la misma
`SYNERGYTICKET_INTERNAL_API_KEY` que ya usamos para emitir:

```
POST /api/internal/tickets/scanned
body: { "ticket_ids": ["...", "..."] }
→ { "scanned": { "<ticket_id>": "2026-08-08T17:12:03.000Z" | null } }
```

Con B evitamos cientos de requests sueltos cuando un evento tenga muchos inscritos.

## Por qué importa

Hoy el portal mide **boletos emitidos**, que es esfuerzo, no resultado. Un afiliado que
inscribe 40 y llevan 3 se ve mejor que uno que inscribe 10 y llevan 8. Con la asistencia
se puede premiar bien, rankear de verdad y detectar listas infladas.

## Estado actual verificado (3-ago-2026)

- `GET /api/tickets/<id>` responde 200 y público, pero **no** trae `scanned`/`scannedAt`.
- `GET /api/tickets/stats` y `/api/tickets/recent-scans` responden **401**, y la
  `SYNERGYTICKET_INTERNAL_API_KEY` que tenemos **no** los abre (solo sirve para emitir).

## Qué haremos de nuestro lado en cuanto exista

Un cron corto que, para los eventos de los próximos días, actualice `af_inscripciones`
con `asistio` + `asistio_at`, y el panel pasa de "Boleto enviado" a "Asistió".
Es media hora de trabajo; todo lo demás ya está.
