import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseService } from "@/lib/supabase-server";
import { validarTelefono } from "@/lib/phone";
import { emitirBoleto } from "@/lib/boletera";
import { paisDeEvento, type Pais } from "@/lib/pais";

/** WhatsApps de prueba (David): pasan el candado aunque ya estén en la base. */
const TELEFONOS_PRUEBA = ["+525513893229"];

interface Body {
  event_tk_id?: string;
  event_name?: string;
  nombre?: string;
  email?: string;
  telefono?: string; // E.164 armado por el form
  pais?: string; // "MX" | "US" — lo manda el form desde /api/eventos
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
  if (!eventId || !nombre || !telefono) {
    return NextResponse.json({ error: "Faltan datos del invitado." }, { status: 400 });
  }
  // el correo es OPCIONAL — el formato solo se revisa si lo escribieron.
  // El regex además veta comas/paréntesis: un correo jamás viaja interpolado
  // a sintaxis de PostgREST, pero tampoco debe PODER ensuciarla.
  if (email && !/^[^\s@,()]+@[^\s@,()]+\.[^\s@,()]+$/.test(email)) {
    return NextResponse.json({ error: "El correo no se ve válido." }, { status: 400 });
  }
  const telErr = validarTelefono(telefono);
  if (telErr) return NextResponse.json({ error: telErr }, { status: 400 });

  // La boletera exige un correo. Si el invitado no dio uno, se usa un buzón
  // técnico derivado de su WhatsApp: estable (el reintento re-emite idéntico),
  // único por persona y reconocible a simple vista en la base y el CSV.
  const emailFinal = email || `invitado+${telefono.replace(/\D/g, "")}@sinergeticos.com`;

  // números de prueba de David: se saltan el candado anti-duplicados
  const esPrueba = TELEFONOS_PRUEBA.includes(telefono);

  if (!esPrueba) {
    // Candado (regla nueva, 3-ago-2026): estar en la base ya NO basta para
    // vetar a alguien. Solo detienen la inscripción dos cosas:
    //   1. que ya esté registrado A ESTE evento, o
    //   2. que nos haya comprado antes.
    const { data: bloqueada, error: rpcErr } = await service.rpc("persona_bloqueada", {
      p_email: emailFinal,
      p_telefono: telefono,
      p_event_tk_id: eventId,
    });
    if (rpcErr) {
      return NextResponse.json({ error: "No se pudo verificar el contacto. Intenta de nuevo." }, { status: 500 });
    }
    if (bloqueada) {
      return NextResponse.json(
        {
          error:
            "Oops — esta persona ya está registrada en nuestra base, a este evento u otro 🙈. Puedes invitar a alguien más.",
        },
        { status: 409 },
      );
    }

    // belt extra: ya inscrita por algún afiliado A ESTE MISMO evento.
    // Va acotado al evento a propósito — con la regla nueva, la misma persona
    // sí puede ir a otro evento distinto. Son DOS conteos con .eq() a
    // propósito: nada del invitado se interpola jamás dentro de un .or() de
    // PostgREST (ahí una coma inyecta operadores), y un error de consulta
    // detiene la inscripción en vez de dejar pasar el duplicado.
    const [porTelefono, porCorreo] = await Promise.all([
      service
        .from("af_inscripciones")
        .select("id", { count: "exact", head: true })
        .eq("status", "emitido")
        .eq("event_tk_id", eventId)
        .eq("telefono", telefono),
      service
        .from("af_inscripciones")
        .select("id", { count: "exact", head: true })
        .eq("status", "emitido")
        .eq("event_tk_id", eventId)
        .eq("email", emailFinal),
    ]);
    if (porTelefono.error || porCorreo.error) {
      return NextResponse.json(
        { error: "No se pudo verificar el contacto. Intenta de nuevo." },
        { status: 500 },
      );
    }
    if ((porTelefono.count ?? 0) + (porCorreo.count ?? 0) > 0) {
      return NextResponse.json(
        { error: "Oops — esta persona ya fue inscrita a este evento 🙈. Puedes invitar a alguien más." },
        { status: 409 },
      );
    }
  }

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

  // La GEOGRAFÍA define la moneda de la comisión, así que la decide el
  // SERVIDOR con el dato de la boletera (timezone + nombre del evento) — el
  // valor del body queda solo como respaldo si la boletera no responde.
  let pais: Pais = body.pais === "US" ? "US" : "MX";
  let eventName = body.event_name?.trim() ?? "";
  try {
    const r = await fetch("https://synergyticket.net/api/events", {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(6000),
    });
    if (r.ok) {
      const eventos = (await r.json()) as { id?: string; name?: string; timezone?: string }[];
      const ev = (Array.isArray(eventos) ? eventos : []).find((e) => e.id === eventId);
      if (ev) {
        pais = paisDeEvento(ev.timezone, ev.name);
        eventName = ev.name?.trim() || eventName;
      }
    }
  } catch {
    // la boletera no contestó a tiempo: se usa el respaldo del form
  }

  // atribución primero (queda aunque la ticketera tarde)
  const { data: insc, error: insErr } = await service
    .from("af_inscripciones")
    .insert({
      afiliado_id: user.id,
      event_tk_id: eventId,
      event_name: eventName,
      nombre,
      email: emailFinal,
      telefono,
      pais,
      status: "enviando",
    })
    .select("id")
    .maybeSingle<{ id: string }>();
  if (insErr || !insc) {
    return NextResponse.json({ error: "No se pudo guardar la inscripción." }, { status: 500 });
  }

  // boleto GRATIS vía la API interna de la boletera
  const res = await emitirBoleto({ eventId, nombre, email: emailFinal, telefono, leadId: insc.id });
  if (!res.ok) {
    await service
      .from("af_inscripciones")
      .update({ status: `error: ${res.detalle}` })
      .eq("id", insc.id);
    return NextResponse.json(
      {
        error:
          res.status === 504
            ? "La boletera tardó demasiado. Puedes reintentarlo desde tu lista de inscritos."
            : "La boletera no pudo emitir el boleto. Puedes reintentarlo desde tu lista de inscritos.",
      },
      { status: res.status },
    );
  }
  await service
    .from("af_inscripciones")
    .update({ status: "emitido", ticket_id: res.ticketId })
    .eq("id", insc.id);
  return NextResponse.json({ ok: true, inscripcion_id: insc.id });
}
