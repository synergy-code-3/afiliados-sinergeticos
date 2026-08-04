/** Comisiones del programa de referidos.
 *
 * **20% del valor de cada venta** — Plan de Acción, Estrategia de Referidos para
 * Eventos Presenciales. El porcentaje es el mismo en México y en Estados Unidos;
 * lo que cambia es el precio del evento:
 *
 *   MX  $12,500 → $2,500 · $13,000 → $2,600 · $15,000 → $3,000
 *   USA $1,500  → $300   · $2,250  → $450   · $3,000  → $600
 *
 * Vive aquí y no regado por el código para que el día que cambie (o que se
 * definan las de webinar y venta directa) haya un solo lugar que tocar.
 */
export const COMISION_PCT = 0.2;

/** Comisión en centavos a partir de la venta en centavos. */
export const comisionCents = (ventaCents: number): number =>
  Math.round(ventaCents * COMISION_PCT);

/* ── Synergy +1 (4-ago-2026, dictado por Manuel) ─────────────────────────────
 * Comisión FIJA por geografía y paquete del Club. La geografía la define el
 * EVENTO (regla de David, sesión 10), no el país del comprador. */

export type Paquete = "3m" | "6m" | "12m";
export type Geografia = "MX" | "US";

/** Centavos por venta según geografía del evento y paquete comprado. */
export const COMISIONES_PAQUETE: Record<Geografia, Record<Paquete, number>> = {
  MX: { "3m": 250_000, "6m": 270_000, "12m": 300_000 }, // $2,500 · $2,700 · $3,000 MXN
  US: { "3m": 29_900, "6m": 35_900, "12m": 39_900 }, // $299 · $359 · $399 USD
};

export const PAQUETE_LABEL: Record<Paquete, string> = {
  "3m": "Club 3 meses",
  "6m": "Club 6 meses",
  "12m": "Club 12 meses",
};

/** 20% extra para quien registró al afiliado que generó la venta (+1 del +1). */
export const OVERRIDE_PCT = 0.2;

/** Después del evento hay 72 horas para validar las comisiones. */
export const VALIDACION_HORAS = 72;

/** Tras el corte del evento, el depósito llega en 10 días hábiles. */
export const PAGO_DIAS_HABILES = 10;

export const monedaDe = (g: Geografia): "MXN" | "USD" => (g === "MX" ? "MXN" : "USD");

export const comisionPaqueteCents = (g: Geografia, p: Paquete): number =>
  COMISIONES_PAQUETE[g][p];

export const overrideCents = (comision: number): number =>
  Math.round(comision * OVERRIDE_PCT);

/** Formatea centavos como dinero. Solo MXN o USD: la moneda la define el evento. */
export const dinero = (cents: number, moneda: "MXN" | "USD"): string =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: moneda,
    maximumFractionDigits: 0,
  }).format(cents / 100);
