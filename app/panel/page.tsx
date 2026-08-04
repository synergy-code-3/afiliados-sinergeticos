import { redirect } from "next/navigation";
import { supabaseSession } from "@/lib/supabase-server";
import { esAdmin } from "@/lib/admin-auth";
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
    />
  );
}
