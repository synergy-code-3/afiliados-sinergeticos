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

/** Formatea centavos como dinero. Solo MXN o USD: la moneda la define el evento. */
export const dinero = (cents: number, moneda: "MXN" | "USD"): string =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: moneda,
    maximumFractionDigits: 0,
  }).format(cents / 100);
