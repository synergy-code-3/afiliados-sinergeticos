import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase-server";
import { emitirBoleto } from "@/lib/boletera";

export const dynamic = "force-dynamic";

/** Reconciliación de boletos atorados — patrón adoptado del embudo BGI
 * (`/api/reconciliar` + cron en vercel.json): lo que se quedó a medias se
 * cura solo, sin esperar a que el afiliado encuentre el botón de reintentar.
 *
 * Reintenta inscripciones sin boleto en `enviando`/`error:` de los últimos
 * 7 días, con al menos 5 minutos de edad (para no pisarse con el alta en
 * vuelo). Máximo 10 por corrida. Nunca emite doble: si ya hay ticket_id,
 * se salta. Si `CRON_SECRET` existe en el entorno, exige el Bearer que
 * Vercel manda en los crons; sin la env, la operación sigue siendo segura
 * (idempotente y sin exponer datos). */
export async function GET(req: Request) {
  const secreto = process.env.CRON_SECRET;
  if (secreto && req.headers.get("authorization") !== `Bearer ${secreto}`) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const service = supabaseService();
  const hace5min = new Date(Date.now() - 5 * 60_000).toISOString();
  const hace7dias = new Date(Date.now() - 7 * 24 * 3600_000).toISOString();

  const { data: atoradas, error } = await service
    .from("af_inscripciones")
    .select("id, event_tk_id, nombre, email, telefono, status, ticket_id")
    .is("ticket_id", null)
    .lt("created_at", hace5min)
    .gte("created_at", hace7dias)
    .or("status.eq.enviando,status.like.error:*")
    .order("created_at", { ascending: true })
    .limit(10)
    .returns<
      {
        id: string;
        event_tk_id: string;
        nombre: string;
        email: string;
        telefono: string;
        status: string;
        ticket_id: string | null;
      }[]
    >();
  if (error) {
    return NextResponse.json({ error: "No se pudo leer la lista." }, { status: 500 });
  }

  let emitidos = 0;
  let fallas = 0;
  for (const i of atoradas ?? []) {
    if (i.ticket_id) continue; // jamás doble boleto
    const res = await emitirBoleto({
      eventId: i.event_tk_id,
      nombre: i.nombre,
      email: i.email,
      telefono: i.telefono,
      leadId: i.id,
    });
    if (res.ok) {
      await service
        .from("af_inscripciones")
        .update({ status: "emitido", ticket_id: res.ticketId })
        .eq("id", i.id);
      emitidos += 1;
    } else {
      await service
        .from("af_inscripciones")
        .update({ status: `error: ${res.detalle}` })
        .eq("id", i.id);
      fallas += 1;
    }
  }

  return NextResponse.json({ ok: true, revisadas: (atoradas ?? []).length, emitidos, fallas });
}
