/** Emisión de boletos en la boletera (synergyticket.net).
 *
 * Es la MISMA ruta interna que usan las landings, así que al emitir se disparan
 * solos el WhatsApp, la secuencia, el Sheet y Axis. Vive aquí para que
 * /api/inscribir (alta) y /api/inscripciones/[id] (reintento) compartan
 * exactamente el mismo comportamiento. */

const URL_INTERNA = "https://synergyticket.net/api/internal/tickets";

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
        ticket_type: "free",
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
