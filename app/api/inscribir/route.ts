import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseService } from "@/lib/supabase-server";
import { validarTelefono } from "@/lib/phone";

interface Body {
  event_tk_id?: string;
  event_name?: string;
  nombre?: string;
  email?: string;
  telefono?: string; // E.164 armado por el form
}

/** Inscribe a un invitado: crea su boleto GRATIS en la boletera vía la API
 * interna (misma ruta que las landings → WhatsApp + secuencia + Sheet + Axis
 * jalan solos) y guarda la atribución al afiliado. */
export async function POST(req: NextRequest) {
  // sesión del afiliado (cookies)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll() {},
      },
    },
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });

  const service = supabaseService();
  const { data: afiliado } = await service
    .from("af_afiliados")
    .select("id, nombre, activo")
    .eq("id", user.id)
    .maybeSingle<{ id: string; nombre: string; activo: boolean }>();
  if (!afiliado) return NextResponse.json({ error: "Completa tu perfil de afiliado." }, { status: 403 });
  if (!afiliado.activo) {
    return NextResponse.json({ error: "Tu cuenta está desactivada. Contacta al equipo." }, { status: 403 });
  }

  const body = (await req.json()) as Body;
  const nombre = body.nombre?.trim() ?? "";
  const email = body.email?.trim().toLowerCase() ?? "";
  const telefono = body.telefono?.trim() ?? "";
  const eventId = body.event_tk_id?.trim() ?? "";
  if (!eventId || !nombre || !email || !telefono) {
    return NextResponse.json({ error: "Faltan datos del invitado." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "El correo no se ve válido." }, { status: 400 });
  }
  const telErr = validarTelefono(telefono);
  if (telErr) return NextResponse.json({ error: telErr }, { status: 400 });

  // tope suave anti-abuso: máx 50 inscripciones por afiliado por día
  const { count } = await service
    .from("af_inscripciones")
    .select("id", { count: "exact", head: true })
    .eq("afiliado_id", user.id)
    .gte("created_at", new Date(Date.now() - 24 * 3600_000).toISOString());
  if ((count ?? 0) >= 50) {
    return NextResponse.json(
      { error: "Llegaste al límite de 50 invitados por día. Mañana puedes seguir." },
      { status: 429 },
    );
  }

  // atribución primero (queda aunque la ticketera tarde)
  const { data: insc, error: insErr } = await service
    .from("af_inscripciones")
    .insert({
      afiliado_id: user.id,
      event_tk_id: eventId,
      event_name: body.event_name?.trim() ?? "",
      nombre,
      email,
      telefono,
      status: "enviando",
    })
    .select("id")
    .maybeSingle<{ id: string }>();
  if (insErr || !insc) {
    return NextResponse.json({ error: "No se pudo guardar la inscripción." }, { status: 500 });
  }

  // boleto GRATIS vía la API interna de la boletera
  const ticketKey = process.env.SYNERGYTICKET_INTERNAL_API_KEY ?? "";
  try {
    const r = await fetch("https://synergyticket.net/api/internal/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${ticketKey}` },
      body: JSON.stringify({
        event_id: eventId,
        name: nombre,
        email,
        phone: telefono,
        lead_id: insc.id,
        ticket_type: "free",
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) {
      const detalle = await r.text();
      await service
        .from("af_inscripciones")
        .update({ status: `error: ${String(detalle).slice(0, 120)}` })
        .eq("id", insc.id);
      return NextResponse.json(
        { error: "La boletera no pudo emitir el boleto. Intenta de nuevo en un momento." },
        { status: 502 },
      );
    }
    const data = (await r.json().catch(() => ({}))) as { id?: string; ticket?: { id?: string } };
    const ticketId = data.ticket?.id ?? data.id ?? null;
    await service
      .from("af_inscripciones")
      .update({ status: "emitido", ticket_id: ticketId })
      .eq("id", insc.id);
    return NextResponse.json({ ok: true, inscripcion_id: insc.id });
  } catch {
    await service.from("af_inscripciones").update({ status: "error: timeout" }).eq("id", insc.id);
    return NextResponse.json(
      { error: "La boletera tardó demasiado. Intenta de nuevo." },
      { status: 504 },
    );
  }
}
