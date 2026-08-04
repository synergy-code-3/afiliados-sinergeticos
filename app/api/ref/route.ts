import { NextResponse, type NextRequest } from "next/server";
import { supabaseService } from "@/lib/supabase-server";

/** Busca al dueño de un código de invitación (`af_afiliados.codigo_ref`).
 *
 * Público a propósito: /crear-cuenta lo consulta ANTES de que exista sesión.
 * Solo suelta el nombre de pila y el id que el alta necesita para ligar al
 * referido — nada más. Si la migración 0082 aún no está aplicada, la consulta
 * falla y se responde { ok: false } sin tronar. */
export async function GET(req: NextRequest) {
  const codigo = (req.nextUrl.searchParams.get("codigo") ?? "").trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(codigo)) return NextResponse.json({ ok: false });

  const { data, error } = await supabaseService()
    .from("af_afiliados")
    .select("id, nombre")
    .eq("codigo_ref", codigo)
    .eq("activo", true)
    .maybeSingle<{ id: string; nombre: string }>();
  if (error || !data) return NextResponse.json({ ok: false });

  return NextResponse.json({
    ok: true,
    id: data.id,
    nombre: (data.nombre ?? "").trim().split(/\s+/)[0] ?? "",
  });
}
