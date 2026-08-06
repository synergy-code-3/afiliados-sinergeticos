import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseService } from "@/lib/supabase-server";
import { validarTelefono } from "@/lib/phone";
import { emitirBoleto } from "@/lib/boletera";

interface Inscripcion {
  id: string;
  afiliado_id: string;
  event_tk_id: string;
  nombre: string;
  email: string;
  telefono: string;
  status: string;
  ticket_id: string | null;
}

/** Sesión del afiliado + la inscripción, SOLO si es suya. */
async function cargar(req: NextRequest, id: string) {
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
  if (!user) return { error: NextResponse.json({ error: "Inicia sesión." }, { status: 401 }) };

  const service = supabaseService();
  const { data: insc } = await service
    .from("af_inscripciones")
    .select("id, afiliado_id, event_tk_id, nombre, email, telefono, status, ticket_id")
    .eq("id", id)
    .maybeSingle<Inscripcion>();

  // mismo 404 si no existe o si es de otro afiliado: no confirmamos su existencia
  if (!insc || insc.afiliado_id !== user.id) {
    return { error: NextResponse.json({ error: "No encontramos ese invitado." }, { status: 404 }) };
  }
  return { service, insc };
}

/** Corrige los datos de contacto del invitado.
 *
 * Ojo: si el boleto YA se emitió, la boletera conserva los datos con los que se
 * emitió — esto corrige NUESTRO registro (lista, CSV, contacto). El boleto sigue
 * siendo válido: se le pasa al invitado con "Copiar liga". */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const cargado = await cargar(req, id);
  if (cargado.error) return cargado.error;
  const { service, insc } = cargado;

  const body = (await req.json()) as { nombre?: string; email?: string; telefono?: string };
  const nombre = body.nombre?.trim() ?? "";
  const email = body.email?.trim().toLowerCase() ?? "";
  const telefono = body.telefono?.trim() ?? "";

  if (!nombre) return NextResponse.json({ error: "El nombre no puede quedar vacío." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "El correo no se ve válido." }, { status: 400 });
  }
  const telErr = validarTelefono(telefono);
  if (telErr) return NextResponse.json({ error: telErr }, { status: 400 });

  const { error } = await service
    .from("af_inscripciones")
    .update({ nombre, email, telefono })
    .eq("id", insc.id);
  if (error) return NextResponse.json({ error: "No se pudo guardar el cambio." }, { status: 500 });

  return NextResponse.json({
    ok: true,
    // el front avisa al afiliado de que el boleto ya emitido no cambia
    boletoYaEmitido: insc.status === "emitido",
  });
}

/** Reintenta emitir el boleto de una inscripción que quedó a medias.
 * Si ya está emitido no hace nada — jamás emite dos boletos para el mismo
 * invitado… SALVO reenvío explícito: con { reenviar: true } en el body se
 * emite un pase NUEVO con los datos ACTUALES de la inscripción (pedido de
 * Manuel: si el afiliado se equivocó en un campo, lo corrige con Editar y el
 * WhatsApp con el pase sale de nuevo hacia el dato corregido). El pase viejo
 * queda huérfano en la boletera; el vigente es el de ticket_id. */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const cargado = await cargar(req, id);
  if (cargado.error) return cargado.error;
  const { service, insc } = cargado;

  const body = (await req.json().catch(() => ({}))) as { reenviar?: boolean };

  if (insc.status === "emitido" && insc.ticket_id && body.reenviar !== true) {
    return NextResponse.json({ error: "Ese invitado ya tiene su boleto." }, { status: 409 });
  }

  await service.from("af_inscripciones").update({ status: "enviando" }).eq("id", insc.id);

  const res = await emitirBoleto({
    eventId: insc.event_tk_id,
    nombre: insc.nombre,
    email: insc.email,
    telefono: insc.telefono,
    leadId: insc.id,
  });
  if (!res.ok) {
    await service
      .from("af_inscripciones")
      .update({ status: `error: ${res.detalle}` })
      .eq("id", insc.id);
    return NextResponse.json(
      { error: "La boletera sigue sin responder. Intenta de nuevo en unos minutos." },
      { status: res.status },
    );
  }

  await service
    .from("af_inscripciones")
    .update({ status: "emitido", ticket_id: res.ticketId })
    .eq("id", insc.id);
  return NextResponse.json({ ok: true, ticket_id: res.ticketId });
}
