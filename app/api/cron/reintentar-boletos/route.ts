import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase-server";
import { emitirBoleto } from "@/lib/boletera";

export const dynamic = "force-dynamic";

/** Reconciliación de boletos atorados — patrón adoptado del embudo BGI
 * (`/api/reconciliar` + cron en vercel.json): lo que se quedó a medias se
 * cura solo, sin esperar a que el afiliado encuentre el botón de reintentar.
 *
 * Endurecido tras la revisión adversarial:
 * - Si `CRON_SECRET` existe en el entorno, se exige el Bearer que Vercel
 *   manda en los crons. Sin la env la ruta sigue operando, pero acotada:
 * - Tope de 5 reintentos automáticos por inscripción — el conteo viaja en el
 *   status (`error(n): detalle`), así que ni un tercero golpeando la ruta en
 *   bucle puede martillar la boletera sin límite.
 * - Claim atómico por fila (compare-and-swap sobre el status) antes de
 *   emitir: dos corridas concurrentes no duplican boletos.
 * - `enviando` atorado solo se reintenta tras 15 min (el alta en vuelo tarda
 *   segundos); tras el primer fallo entra al conteo normal de error(n). */

const MAX_REINTENTOS = 5;

const intentosDe = (status: string): number => {
  if (status === "enviando") return 0;
  const m = /^error\((\d+)\)/.exec(status);
  if (m) return Number(m[1]);
  return status.startsWith("error") ? 1 : 0;
};

export async function GET(req: Request) {
  const secreto = process.env.CRON_SECRET;
  if (secreto && req.headers.get("authorization") !== `Bearer ${secreto}`) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const service = supabaseService();
  const hace15min = new Date(Date.now() - 15 * 60_000).toISOString();
  const hace7dias = new Date(Date.now() - 7 * 24 * 3600_000).toISOString();

  const { data: atoradas, error } = await service
    .from("af_inscripciones")
    .select("id, event_tk_id, nombre, email, telefono, status, ticket_id")
    .is("ticket_id", null)
    .lt("created_at", hace15min)
    .gte("created_at", hace7dias)
    // valores propios del sistema, jamás input del usuario dentro del or()
    .or("status.eq.enviando,status.like.error*")
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
  let saltadas = 0;
  for (const i of atoradas ?? []) {
    const intentos = intentosDe(i.status);
    if (i.ticket_id || intentos >= MAX_REINTENTOS) {
      saltadas += 1;
      continue;
    }

    // claim atómico: solo quien gana el compare-and-swap emite
    const { data: reclamada } = await service
      .from("af_inscripciones")
      .update({ status: "enviando" })
      .eq("id", i.id)
      .eq("status", i.status)
      .is("ticket_id", null)
      .select("id")
      .returns<{ id: string }[]>();
    if (!reclamada || reclamada.length === 0) {
      saltadas += 1;
      continue;
    }

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
        .update({ status: `error(${intentos + 1}): ${res.detalle}` })
        .eq("id", i.id);
      fallas += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    revisadas: (atoradas ?? []).length,
    emitidos,
    fallas,
    saltadas,
  });
}
