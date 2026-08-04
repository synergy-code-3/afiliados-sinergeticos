import { NextResponse, type NextRequest } from "next/server";
import { supabaseService } from "@/lib/supabase-server";
import { esAdmin } from "@/lib/admin-auth";
import { synergyPlusListo } from "@/lib/schema";

/**
 * Búsqueda para capturar ventas Synergy +1 (solo admins).
 *
 * Dos modos, según el query param:
 *   ?q=        correo o teléfono del comprador → inscripciones que coinciden,
 *              cada una con su afiliado y si la venta ya fue capturada.
 *   ?afiliado= nombre → afiliados que coinciden, para la captura libre
 *              (ventas que no nacieron de una inscripción del portal).
 */

type Servicio = ReturnType<typeof supabaseService>;

interface InscripcionRow {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  event_name: string;
  event_tk_id: string;
  pais: string;
  afiliado_id: string;
  created_at: string;
}

interface AfiliadoRow {
  id: string;
  nombre: string;
  referido_por: string | null;
}

/** Variantes E.164 a probar: quita espacios/guiones/paréntesis y, si quedan
 * 10 dígitos nacionales, prueba con lada de México (+52) y de EE. UU. (+1). */
function candidatosTelefono(q: string): string[] {
  const limpio = q.replace(/[\s\-().]/g, "");
  if (!/^\+?\d{7,15}$/.test(limpio)) return [];
  const digitos = limpio.replace(/^\+/, "");
  const variantes = new Set<string>();
  if (limpio.startsWith("+")) variantes.add(limpio);
  if (digitos.length === 10) {
    variantes.add(`+52${digitos}`);
    variantes.add(`+1${digitos}`);
  }
  if (digitos.length === 12 && digitos.startsWith("52")) variantes.add(`+${digitos}`);
  if (digitos.length === 11 && digitos.startsWith("1")) variantes.add(`+${digitos}`);
  return [...variantes];
}

/** Nombres de afiliados por id — para decir quién trajo al comprador y quién
 * es el +1 líder, sin depender de joins embebidos. */
async function nombresDeAfiliados(service: Servicio, ids: string[]): Promise<Map<string, AfiliadoRow>> {
  const mapa = new Map<string, AfiliadoRow>();
  if (ids.length === 0) return mapa;
  const { data } = await service
    .from("af_afiliados")
    .select("id, nombre, referido_por")
    .in("id", ids)
    .returns<AfiliadoRow[]>();
  for (const a of data ?? []) mapa.set(a.id, a);
  return mapa;
}

/** Afiliados por nombre — para la captura libre. */
async function buscarAfiliados(nombre: string) {
  const service = supabaseService();
  const { data, error } = await service
    .from("af_afiliados")
    .select("id, nombre, referido_por")
    .ilike("nombre", `%${nombre}%`)
    .order("nombre", { ascending: true })
    .limit(10)
    .returns<AfiliadoRow[]>();
  if (error) {
    return NextResponse.json({ error: "No se pudo buscar. Intenta de nuevo." }, { status: 500 });
  }

  const filas = data ?? [];
  const idsReferidores = [...new Set(filas.flatMap((a) => (a.referido_por ? [a.referido_por] : [])))];
  const referidores = await nombresDeAfiliados(service, idsReferidores);
  const afiliados = filas.map((a) => ({
    id: a.id,
    nombre: a.nombre,
    referido_por: a.referido_por,
    referidor_nombre: a.referido_por ? (referidores.get(a.referido_por)?.nombre ?? null) : null,
  }));
  return NextResponse.json({ ok: true, afiliados });
}

/** Inscripciones por correo o teléfono del comprador. */
async function buscarInscripciones(q: string) {
  const service = supabaseService();

  const telefonos = candidatosTelefono(q);
  const digitos = q.replace(/[\s\-().+]/g, "");
  const condiciones =
    telefonos.length > 0 || /^\d{7,15}$/.test(digitos)
      ? [...telefonos.map((t) => `telefono.eq.${t}`), `telefono.ilike.%${digitos}%`]
      : [`email.ilike.%${q}%`];

  const { data, error } = await service
    .from("af_inscripciones")
    .select("id, nombre, email, telefono, event_name, event_tk_id, pais, afiliado_id, created_at")
    .or(condiciones.join(","))
    .order("created_at", { ascending: false })
    .limit(10)
    .returns<InscripcionRow[]>();
  if (error) {
    return NextResponse.json({ error: "No se pudo buscar. Intenta de nuevo." }, { status: 500 });
  }

  const filas = data ?? [];
  const idsAfiliados = [...new Set(filas.map((f) => f.afiliado_id))];
  const [afiliados, capturadas] = await Promise.all([
    nombresDeAfiliados(service, idsAfiliados),
    ventasCapturadas(service, filas.map((f) => f.id)),
  ]);
  const idsReferidores = [
    ...new Set(
      [...afiliados.values()].flatMap((a) => (a.referido_por ? [a.referido_por] : [])),
    ),
  ];
  const referidores = await nombresDeAfiliados(service, idsReferidores);

  const resultados = filas.map((f) => {
    const af = afiliados.get(f.afiliado_id);
    return {
      inscripcion_id: f.id,
      nombre: f.nombre,
      email: f.email,
      telefono: f.telefono,
      event_name: f.event_name,
      event_tk_id: f.event_tk_id,
      pais: f.pais,
      created_at: f.created_at,
      ya_capturada: capturadas.has(f.id),
      afiliado: {
        id: f.afiliado_id,
        nombre: af?.nombre ?? "—",
        referido_por: af?.referido_por ?? null,
        referidor_nombre: af?.referido_por
          ? (referidores.get(af.referido_por)?.nombre ?? null)
          : null,
      },
    };
  });
  return NextResponse.json({ ok: true, resultados });
}

/** Ids de inscripciones que ya tienen una venta capturada. */
async function ventasCapturadas(service: Servicio, inscripcionIds: string[]): Promise<Set<string>> {
  if (inscripcionIds.length === 0) return new Set();
  const { data } = await service
    .from("af_ventas")
    .select("inscripcion_id")
    .in("inscripcion_id", inscripcionIds)
    .returns<{ inscripcion_id: string }[]>();
  return new Set((data ?? []).map((v) => v.inscripcion_id));
}

export async function GET(req: NextRequest) {
  if (!(await esAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!(await synergyPlusListo())) return NextResponse.json({ ok: false, pendiente: true });

  // comas y paréntesis rompen la sintaxis de or() de PostgREST — fuera
  const params = req.nextUrl.searchParams;
  const porAfiliado = (params.get("afiliado") ?? "").trim().replace(/[,()]/g, "");
  if (porAfiliado) return buscarAfiliados(porAfiliado);

  const q = (params.get("q") ?? "").trim().toLowerCase().replace(/[,()]/g, "");
  if (!q) return NextResponse.json({ ok: true, resultados: [] });
  return buscarInscripciones(q);
}
