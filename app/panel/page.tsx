import { redirect } from "next/navigation";
import { supabaseSession, supabaseService } from "@/lib/supabase-server";
import { esAdmin } from "@/lib/admin-auth";
import { synergyPlusListo } from "@/lib/schema";
import PanelClient from "./panel-client";

export const dynamic = "force-dynamic";

interface Inscripcion {
  id: string;
  event_name: string;
  nombre: string;
  email: string;
  telefono: string;
  status: string;
  ticket_id: string | null;
  created_at: string;
}

export interface Ingreso {
  moneda: string;
  total_cents: number;
  mes_cents: number | null;
}

export interface Metricas {
  referidos: number;
  con_boleto: number;
  cerrados: number;
  /** solo MXN o USD — la moneda la define el evento, no la compra */
  ingresos: Ingreso[];
}

interface Recurso {
  id: string;
  titulo: string;
  descripcion: string;
  url: string;
  tipo: string;
}

/** Miembro del equipo +1 del afiliado, con lo que lleva generado. */
export interface MiembroEquipo {
  nombre: string;
  apodo: string | null;
  fotoUrl: string | null;
  creadoEl: string;
  ventas: number;
  comisionCents: number;
  moneda: string;
}

export interface TotalMoneda {
  moneda: string;
  cents: number;
}

/** Comisiones propias del afiliado (de af_ventas), por estado y moneda. */
export interface MisComisiones {
  pendiente: TotalMoneda[];
  validada: TotalMoneda[];
  pagada: TotalMoneda[];
}

interface FilaVenta {
  afiliado_id?: string;
  comision_cents: number;
  override_cents?: number;
  moneda: string;
  estado: string;
}

const sumaPorMoneda = (filas: FilaVenta[], campo: "comision_cents" | "override_cents") => {
  const mapa = new Map<string, number>();
  for (const f of filas) {
    const cents = Number(f[campo] ?? 0);
    if (cents > 0) mapa.set(f.moneda, (mapa.get(f.moneda) ?? 0) + cents);
  }
  return [...mapa.entries()].map(([moneda, cents]) => ({ moneda, cents }));
};

export default async function Panel() {
  const supabase = await supabaseSession();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: perfil } = await supabase
    .from("af_afiliados")
    .select("nombre, ciudad, telefono, activo")
    .eq("id", user.id)
    .maybeSingle<{ nombre: string; ciudad: string | null; telefono: string | null; activo: boolean }>();

  // ── Synergy +1: solo si la migración 0082 ya está aplicada en la base ──
  const dbListo = await synergyPlusListo();
  let apodo: string | null = null;
  let fotoUrl: string | null = null;
  let codigoRef: string | null = null;
  let equipo: MiembroEquipo[] = [];
  let overridePorMoneda: TotalMoneda[] = [];
  let misComisiones: MisComisiones | null = null;

  if (dbListo && perfil) {
    const service = supabaseService();
    const { data: plus } = await service
      .from("af_afiliados")
      .select("apodo, foto_url, onboarding_at, codigo_ref")
      .eq("id", user.id)
      .maybeSingle<{
        apodo: string | null;
        foto_url: string | null;
        onboarding_at: string | null;
        codigo_ref: string | null;
      }>();

    // primera vez: el wizard de bienvenida (apodo + selfie) antes que el panel
    if (plus && !plus.onboarding_at) redirect("/bienvenida");

    apodo = plus?.apodo ?? null;
    fotoUrl = plus?.foto_url ?? null;
    codigoRef = plus?.codigo_ref ?? null;

    const { data: miembros } = await service
      .from("af_afiliados")
      .select("id, nombre, apodo, foto_url, created_at")
      .eq("referido_por", user.id)
      .order("created_at", { ascending: true })
      .returns<
        { id: string; nombre: string; apodo: string | null; foto_url: string | null; created_at: string }[]
      >();

    const ids = (miembros ?? []).map((m) => m.id);
    const { data: ventasEquipo } = ids.length
      ? await service
          .from("af_ventas")
          .select("afiliado_id, comision_cents, moneda, estado")
          .in("afiliado_id", ids)
          .neq("estado", "rechazada")
          .returns<FilaVenta[]>()
      : { data: [] as FilaVenta[] };

    equipo = (miembros ?? []).map((m) => {
      const suyas = (ventasEquipo ?? []).filter((v) => v.afiliado_id === m.id);
      const porMoneda = sumaPorMoneda(suyas, "comision_cents");
      const principal = porMoneda[0] ?? { moneda: "MXN", cents: 0 };
      return {
        nombre: m.nombre,
        apodo: m.apodo,
        fotoUrl: m.foto_url,
        creadoEl: m.created_at,
        ventas: suyas.length,
        comisionCents: principal.cents,
        moneda: principal.moneda,
      };
    });

    const { data: misOverrides } = await service
      .from("af_ventas")
      .select("override_cents, moneda, estado")
      .eq("override_para", user.id)
      .neq("estado", "rechazada")
      .returns<FilaVenta[]>();
    overridePorMoneda = sumaPorMoneda(misOverrides ?? [], "override_cents");

    const { data: misVentas } = await service
      .from("af_ventas")
      .select("comision_cents, moneda, estado")
      .eq("afiliado_id", user.id)
      .returns<FilaVenta[]>();
    const propias = misVentas ?? [];
    misComisiones = {
      pendiente: sumaPorMoneda(propias.filter((v) => v.estado === "pendiente"), "comision_cents"),
      validada: sumaPorMoneda(propias.filter((v) => v.estado === "validada"), "comision_cents"),
      pagada: sumaPorMoneda(propias.filter((v) => v.estado === "pagada"), "comision_cents"),
    };
  }

  const { data: inscripciones } = await supabase
    .from("af_inscripciones")
    .select("id, event_name, nombre, email, telefono, status, ticket_id, created_at")
    .eq("afiliado_id", user.id)
    .order("created_at", { ascending: false })
    .returns<Inscripcion[]>();

  // Métricas del afiliado. La RPC usa auth.uid() por dentro: nadie puede
  // consultar las de otro. Los ingresos vienen DESGLOSADOS POR MONEDA — en la
  // base conviven 15 monedas y sumarlas daría un número sin significado.
  // para mostrarle el acceso al panel de administración si le toca
  const admin = await esAdmin();

  const { data: metricasRaw } = await supabase.rpc("mis_metricas");
  const metricas = (metricasRaw ?? null) as Metricas | null;

  const { data: recursos } = await supabase
    .from("af_recursos")
    .select("id, titulo, descripcion, url, tipo")
    .order("orden", { ascending: true })
    .order("created_at", { ascending: false })
    .returns<Recurso[]>();

  return (
    <PanelClient
      nombre={perfil?.nombre ?? user.email ?? "Afiliado"}
      activo={perfil?.activo ?? true}
      sinPerfil={!perfil}
      inscripciones={inscripciones ?? []}
      recursos={recursos ?? []}
      metricas={metricas}
      esAdmin={admin}
      perfil={{
        nombre: perfil?.nombre ?? "",
        ciudad: perfil?.ciudad ?? "",
        telefono: perfil?.telefono ?? "",
      }}
      dbListo={dbListo}
      apodo={apodo}
      fotoUrl={fotoUrl}
      codigoRef={codigoRef}
      equipo={equipo}
      overridePorMoneda={overridePorMoneda}
      misComisiones={misComisiones}
    />
  );
}
