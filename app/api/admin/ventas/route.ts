import { NextResponse, type NextRequest } from "next/server";
import { supabaseService } from "@/lib/supabase-server";
import { esAdmin, esAdminPorCuenta } from "@/lib/admin-auth";
import { synergyPlusListo } from "@/lib/schema";
import {
  COMISIONES_PAQUETE,
  comisionPaqueteCents,
  monedaDe,
  overrideCents,
  type Geografia,
  type Paquete,
} from "@/lib/comisiones";

/**
 * Ventas Synergy +1 capturadas por el equipo (solo admins).
 *
 *   GET  ?estado=            lista (todas o filtradas por estado)
 *   GET  ?proyeccion={id}    utilidad proyectada de un afiliado
 *   POST                     captura una venta — el dinero se calcula SIEMPRE
 *                            aquí desde lib/comisiones.ts, jamás se acepta
 *                            un monto que venga del navegador.
 */

type Servicio = ReturnType<typeof supabaseService>;

const ESTADOS = ["pendiente", "validada", "pagada", "rechazada"];
const GEOGRAFIAS: readonly string[] = ["MX", "US"];
const PAQUETES: readonly string[] = ["3m", "6m", "12m"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Sin historial de ventas aún, se proyecta con 30% de cierre (Plan de Acción). */
const TASA_CIERRE_DEFECTO = 0.3;

const COLUMNAS_VENTA =
  "id, afiliado_id, inscripcion_id, comprador_nombre, comprador_email, comprador_telefono, " +
  "event_tk_id, event_name, paquete, moneda, comision_cents, override_cents, override_para, " +
  "estado, capturada_por, notas, created_at, validada_at, pagada_at";

interface VentaRow {
  id: string;
  afiliado_id: string;
  inscripcion_id: string | null;
  comprador_nombre: string | null;
  comprador_email: string | null;
  comprador_telefono: string | null;
  event_tk_id: string | null;
  event_name: string | null;
  paquete: Paquete;
  moneda: "MXN" | "USD";
  comision_cents: number;
  override_cents: number;
  override_para: string | null;
  estado: string;
  capturada_por: string;
  notas: string | null;
  created_at: string;
  validada_at: string | null;
  pagada_at: string | null;
}

interface BodyCaptura {
  inscripcion_id?: string;
  afiliado_id?: string;
  comprador_nombre?: string;
  comprador_email?: string;
  comprador_telefono?: string;
  event_tk_id?: string;
  event_name?: string;
  geografia?: string;
  paquete?: string;
  notas?: string;
}

async function nombresDe(service: Servicio, ids: string[]): Promise<Map<string, string>> {
  const mapa = new Map<string, string>();
  if (ids.length === 0) return mapa;
  const { data } = await service
    .from("af_afiliados")
    .select("id, nombre")
    .in("id", ids)
    .returns<{ id: string; nombre: string }[]>();
  for (const a of data ?? []) mapa.set(a.id, a.nombre);
  return mapa;
}

/* ── GET · lista ───────────────────────────────────────────────────────────── */

async function listaVentas(estado: string | null) {
  const service = supabaseService();
  const base = service.from("af_ventas").select(COLUMNAS_VENTA);
  const filtrada = estado && ESTADOS.includes(estado) ? base.eq("estado", estado) : base;
  const { data, error } = await filtrada
    .order("created_at", { ascending: false })
    .limit(500)
    .returns<VentaRow[]>();
  if (error) {
    return NextResponse.json({ error: "No se pudo cargar la lista de ventas." }, { status: 500 });
  }

  const filas = data ?? [];
  const ids = [
    ...new Set(filas.flatMap((v) => [v.afiliado_id, ...(v.override_para ? [v.override_para] : [])])),
  ];
  const nombres = await nombresDe(service, ids);
  const ventas = filas.map((v) => ({
    ...v,
    afiliado_nombre: nombres.get(v.afiliado_id) ?? "—",
    override_para_nombre: v.override_para ? (nombres.get(v.override_para) ?? "—") : null,
  }));
  return NextResponse.json({ ok: true, ventas });
}

/* ── GET · proyección ──────────────────────────────────────────────────────── */

/** Utilidad proyectada: inscritos con boleto del afiliado × tasa de cierre
 * histórica global (30% si aún no hay ventas) × comisión promedio de su
 * geografía. Es una PROYECCIÓN, no una promesa. */
async function proyeccionAfiliado(afiliadoId: string) {
  const service = supabaseService();
  const { data: afiliado } = await service
    .from("af_afiliados")
    .select("id, nombre")
    .eq("id", afiliadoId)
    .maybeSingle<{ id: string; nombre: string }>();
  if (!afiliado) {
    return NextResponse.json({ error: "No encontramos a ese afiliado." }, { status: 404 });
  }

  const [inscritos, boletosGlobal, ventasGlobal] = await Promise.all([
    service
      .from("af_inscripciones")
      .select("pais, status")
      .eq("afiliado_id", afiliadoId)
      .returns<{ pais: string; status: string }[]>(),
    service
      .from("af_inscripciones")
      .select("id", { count: "exact", head: true })
      .eq("status", "emitido"),
    service
      .from("af_ventas")
      .select("moneda, comision_cents")
      .neq("estado", "rechazada")
      .limit(5000)
      .returns<{ moneda: string; comision_cents: number }[]>(),
  ]);

  const conBoleto = (inscritos.data ?? []).filter((i) => i.status === "emitido");
  const enUS = conBoleto.filter((i) => i.pais === "US").length;
  const geografia: Geografia = enUS > conBoleto.length - enUS ? "US" : "MX";
  const moneda = monedaDe(geografia);

  const ventas = ventasGlobal.data ?? [];
  const totalBoletos = boletosGlobal.count ?? 0;
  const tasaHistorica =
    totalBoletos > 0 && ventas.length > 0 ? Math.min(ventas.length / totalBoletos, 1) : null;
  const tasa = tasaHistorica ?? TASA_CIERRE_DEFECTO;

  const deGeografia = ventas.filter((v) => v.moneda === moneda);
  const paquetes = Object.values(COMISIONES_PAQUETE[geografia]);
  const promedio =
    deGeografia.length > 0
      ? Math.round(deGeografia.reduce((suma, v) => suma + v.comision_cents, 0) / deGeografia.length)
      : Math.round(paquetes.reduce((suma, c) => suma + c, 0) / paquetes.length);

  return NextResponse.json({
    ok: true,
    proyeccion: {
      afiliado_id: afiliado.id,
      afiliado_nombre: afiliado.nombre,
      geografia,
      moneda,
      inscritos_con_boleto: conBoleto.length,
      tasa_cierre: tasa,
      tasa_por_defecto: tasaHistorica === null,
      comision_promedio_cents: promedio,
      proyeccion_cents: Math.round(conBoleto.length * tasa * promedio),
    },
  });
}

export async function GET(req: NextRequest) {
  if (!(await esAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!(await synergyPlusListo())) return NextResponse.json({ ok: false, pendiente: true });

  const params = req.nextUrl.searchParams;
  const proyeccion = (params.get("proyeccion") ?? "").trim();
  if (proyeccion) return proyeccionAfiliado(proyeccion);
  return listaVentas(params.get("estado"));
}

/* ── POST · captura ────────────────────────────────────────────────────────── */

interface DatosComprador {
  afiliadoId: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  eventTkId: string | null;
  eventName: string | null;
  /** geografía del EVENTO según la inscripción — cuando existe, manda sobre
   * lo que diga el navegador (la geografía define la moneda del dinero) */
  pais: "MX" | "US" | null;
}

/** Con inscripción, la base manda: comprador, evento y afiliado salen de ella
 * (jamás del body — el navegador no decide a quién se le paga). */
async function datosDeInscripcion(
  service: Servicio,
  inscripcionId: string,
): Promise<{ datos: DatosComprador } | { error: NextResponse }> {
  const { data: insc } = await service
    .from("af_inscripciones")
    .select("id, afiliado_id, nombre, email, telefono, event_tk_id, event_name, pais")
    .eq("id", inscripcionId)
    .maybeSingle<{
      id: string;
      afiliado_id: string;
      nombre: string;
      email: string | null;
      telefono: string | null;
      event_tk_id: string | null;
      event_name: string | null;
      pais: string | null;
    }>();
  if (!insc) {
    return { error: NextResponse.json({ error: "No encontramos esa inscripción." }, { status: 404 }) };
  }

  const { count } = await service
    .from("af_ventas")
    .select("id", { count: "exact", head: true })
    .eq("inscripcion_id", inscripcionId);
  if ((count ?? 0) > 0) {
    return {
      error: NextResponse.json(
        { error: "Esa venta ya está capturada — búscala en la lista de ventas." },
        { status: 409 },
      ),
    };
  }

  return {
    datos: {
      afiliadoId: insc.afiliado_id,
      nombre: insc.nombre,
      email: insc.email,
      telefono: insc.telefono,
      eventTkId: insc.event_tk_id,
      eventName: insc.event_name,
      pais: insc.pais === "US" ? "US" : insc.pais === "MX" ? "MX" : null,
    },
  };
}

/** Valida el body y resuelve los datos del comprador (de la inscripción o a mano). */
async function resolverCaptura(
  service: Servicio,
  body: BodyCaptura,
): Promise<{ datos: DatosComprador } | { error: NextResponse }> {
  const inscripcionId = body.inscripcion_id?.trim();
  if (inscripcionId) return datosDeInscripcion(service, inscripcionId);

  const datos: DatosComprador = {
    afiliadoId: body.afiliado_id?.trim() ?? "",
    nombre: body.comprador_nombre?.trim() ?? "",
    email: body.comprador_email?.trim().toLowerCase() || null,
    telefono: body.comprador_telefono?.trim() || null,
    eventTkId: body.event_tk_id?.trim() || null,
    eventName: body.event_name?.trim() || null,
    pais: null, // captura libre: sin inscripción, la geografía la elige el admin
  };
  if (!datos.afiliadoId) {
    return { error: NextResponse.json({ error: "Falta el afiliado que hizo la venta." }, { status: 400 }) };
  }
  if (!datos.nombre) {
    return { error: NextResponse.json({ error: "Escribe el nombre del comprador." }, { status: 400 }) };
  }
  if (datos.email && !EMAIL_RE.test(datos.email)) {
    return { error: NextResponse.json({ error: "El correo no se ve válido." }, { status: 400 }) };
  }
  return { datos };
}

export async function POST(req: NextRequest) {
  if (!(await esAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!(await synergyPlusListo())) return NextResponse.json({ ok: false, pendiente: true });

  const body = (await req.json()) as BodyCaptura;
  if (!GEOGRAFIAS.includes(body.geografia ?? "")) {
    return NextResponse.json(
      { error: "Elige la geografía del evento (México o Estados Unidos)." },
      { status: 400 },
    );
  }
  if (!PAQUETES.includes(body.paquete ?? "")) {
    return NextResponse.json(
      { error: "Elige el paquete del Club (3, 6 o 12 meses)." },
      { status: 400 },
    );
  }
  const paquete = body.paquete as Paquete;

  const service = supabaseService();
  const resuelto = await resolverCaptura(service, body);
  if ("error" in resuelto) return resuelto.error;
  const { datos } = resuelto;

  // Con inscripción, la geografía la define el EVENTO (af_inscripciones.pais)
  // — regla de David. El valor del navegador solo aplica en captura libre.
  const geografia: Geografia = datos.pais ?? (body.geografia as Geografia);

  const { data: afiliado } = await service
    .from("af_afiliados")
    .select("id, nombre, referido_por")
    .eq("id", datos.afiliadoId)
    .maybeSingle<{ id: string; nombre: string; referido_por: string | null }>();
  if (!afiliado) {
    return NextResponse.json({ error: "No encontramos a ese afiliado." }, { status: 404 });
  }

  // el dinero se calcula aquí, con la fuente única de comisiones
  const moneda = monedaDe(geografia);
  const comision = comisionPaqueteCents(geografia, paquete);
  const override = afiliado.referido_por ? overrideCents(comision) : 0;

  const { email: quien } = await esAdminPorCuenta();
  const { data: venta, error } = await service
    .from("af_ventas")
    .insert({
      afiliado_id: afiliado.id,
      inscripcion_id: body.inscripcion_id?.trim() || null,
      comprador_nombre: datos.nombre,
      comprador_email: datos.email,
      comprador_telefono: datos.telefono,
      event_tk_id: datos.eventTkId,
      event_name: datos.eventName,
      paquete,
      moneda,
      comision_cents: comision,
      override_cents: override,
      override_para: afiliado.referido_por,
      estado: "pendiente",
      capturada_por: quien ?? "equipo",
      notas: body.notas?.trim() || null,
    })
    .select("id, comision_cents, override_cents, override_para, moneda, estado")
    .maybeSingle<Pick<VentaRow, "id" | "comision_cents" | "override_cents" | "override_para" | "moneda" | "estado">>();
  if (error || !venta) {
    return NextResponse.json({ error: "No se pudo guardar la venta. Intenta de nuevo." }, { status: 500 });
  }

  const nombres = afiliado.referido_por ? await nombresDe(service, [afiliado.referido_por]) : null;
  return NextResponse.json({
    ok: true,
    venta,
    afiliado_nombre: afiliado.nombre,
    override_para_nombre: afiliado.referido_por
      ? (nombres?.get(afiliado.referido_por) ?? null)
      : null,
  });
}
