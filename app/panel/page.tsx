import { redirect } from "next/navigation";
import { supabaseSession } from "@/lib/supabase-server";
import PanelClient from "./panel-client";

export const dynamic = "force-dynamic";

interface Inscripcion {
  id: string;
  event_name: string;
  nombre: string;
  email: string;
  telefono: string;
  status: string;
  created_at: string;
}

export default async function Panel() {
  const supabase = await supabaseSession();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: perfil } = await supabase
    .from("af_afiliados")
    .select("nombre, activo")
    .eq("id", user.id)
    .maybeSingle<{ nombre: string; activo: boolean }>();

  const { data: inscripciones } = await supabase
    .from("af_inscripciones")
    .select("id, event_name, nombre, email, telefono, status, created_at")
    .eq("afiliado_id", user.id)
    .order("created_at", { ascending: false })
    .returns<Inscripcion[]>();

  return (
    <PanelClient
      nombre={perfil?.nombre ?? user.email ?? "Afiliado"}
      activo={perfil?.activo ?? true}
      sinPerfil={!perfil}
      inscripciones={inscripciones ?? []}
    />
  );
}
