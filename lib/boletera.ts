/** Emisión de boletos en la boletera (synergyticket.net).
 *
 * Es la MISMA ruta interna que usan las landings, así que al emitir se disparan
 * solos el WhatsApp, la secuencia, el Sheet y Axis. Vive aquí para que
 * /api/inscribir (alta) y /api/inscripciones/[id] (reintento) compartan
 * exactamente el mismo comportamiento. */

const URL_INTERNA = "https://synergyticket.net/api/internal/tickets";

/**
 * Tipo de boleto que se emite a los invitados de un afiliado.
 *
 * ⚠️ El tipo dedicado es `affiliate` (el naranja). En la boletera el tipo se
 * llama `general` por dentro, pero su pantalla lo rotula "Boleto de Afiliados" —
 * reutilizaron ese tipo y le cambiaron nombre y diseño el 4-ago-2026. Buscar
 * "afiliado" o "affiliate" en su base no devuelve nada; el mapeo está en su
 * bundle: `{ paid:"Boleto de Pago", general:"Boleto de Afiliados", free:"Boleto Gratuito" }`.
 *
 * Antes se emitía `free`, el mismo boleto que dan las landings — no había forma
 * de distinguir en la puerta a quién trajo un afiliado.
 *
 * `general_price` viene vacío en los eventos, así que sigue siendo cortesía.
 */
const TIPO_BOLETO_AFILIADO = "affiliate";

// Historia de este valor, para que nadie lo vuelva a mover a ciegas:
//
// `free`      — el mismo boleto azul que dan las landings. No distinguía en la
//               puerta a quién trajo un afiliado.
// `general`   — se probó el 4-ago-2026 porque su panel lo rotula "Pase de
//               Afiliado", y hubo que revertirlo de urgencia el 6-ago: les
//               daba además acceso a SYNERGY UNLIMITED, un evento de paga.
// `affiliate` — tipo dedicado que la boletera creó el 6-ago-2026 a petición
//               nuestra. Es el que va.
//
// Verificado antes de activarlo (6-ago-2026), no solo que la API respondiera:
//   · el boleto abre y muestra el pase naranja "PASE DE AFILIADO"
//   · `GET /api/internal/tickets?event_id=<Synergy Unlimited>&email=<invitado>`
//     devuelve vacío — no concede acceso al evento de paga
//   · los 56 invitados del episodio de `general` conservan su boleto vivo
//
// Si algún día hay que tocarlo, esa tercera comprobación es la que importa:
// que la API responda 201 no dice nada de lo que la persona recibe.

export interface DatosBoleto {
  eventId: string;
  nombre: string;
  email: string;
  telefono: string;
  /** id de nuestra inscripción — viaja como lead_id para la atribución */
  leadId: string;
}

export type ResultadoBoleto =
  | { ok: true; ticketId: string | null }
  | { ok: false; status: number; detalle: string };

export async function emitirBoleto(d: DatosBoleto): Promise<ResultadoBoleto> {
  const key = process.env.SYNERGYTICKET_INTERNAL_API_KEY ?? "";
  try {
    const r = await fetch(URL_INTERNA, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        event_id: d.eventId,
        name: d.nombre,
        email: d.email,
        phone: d.telefono,
        lead_id: d.leadId,
        ticket_type: TIPO_BOLETO_AFILIADO,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) {
      const detalle = await r.text().catch(() => "");
      return { ok: false, status: 502, detalle: String(detalle).slice(0, 120) };
    }
    const data = (await r.json().catch(() => ({}))) as {
      id?: string;
      ticket?: { id?: string };
    };
    return { ok: true, ticketId: data.ticket?.id ?? data.id ?? null };
  } catch {
    return { ok: false, status: 504, detalle: "timeout" };
  }
}
