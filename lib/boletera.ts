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
 * ⚠️ `general` ES el "Pase de Afiliado" (el naranja). En la boletera el tipo se
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
const TIPO_BOLETO_AFILIADO = "free";

// 🔴 REVERTIDO el 6-ago-2026 — NO volver a poner "general" sin resolver esto.
//
// Emitir `general` estaba generando PASES DE SYNERGY UNLIMITED a los invitados.
// En la boletera la pestaña dice "Boleto de Afiliados", pero el tipo `general`
// arrastra la lógica del pase general del evento grande. Lo que se ve en su
// panel de plantillas NO es lo único que ese tipo dispara.
//
// Antes de reintentarlo: confirmar con la boletera qué identificador emite el
// pase naranja SIN darle acceso a Synergy Unlimited, y probar con UN invitado
// real revisando qué recibió — no basta con que la API responda 201.

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
