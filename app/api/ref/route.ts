import { NextResponse, type NextRequest } from "next/server";
import { supabaseService } from "@/lib/supabase-server";

/** Busca al dueño de un código de invitación (`af_afiliados.codigo_ref`).
 *
 * Público a propósito: /crear-cuenta lo consulta ANTES de que exista sesión.
 * Suelta SOLO el nombre de pila — la vinculación real la hace la RPC
 * `af_vincular_referido(codigo)` con la sesión ya creada, así el navegador
 * jamás conoce (ni decide) el id de quien cobra el override. Si la migración
 * 0082 aún no está aplicada, la consulta falla y se responde { ok: false }. */

/** Freno de enumeración, mejor-esfuerzo por instancia: 30 intentos/min por IP.
 * (16^6 códigos ≈ 887M combinaciones — con este freno, adivinar uno es
 * impráctico; el dato expuesto además es solo un nombre de pila.) */
const ventana = new Map<string, { hasta: number; usos: number }>();
const LIMITE = 30;

function excedido(ip: string): boolean {
  const ahora = Date.now();
  const v = ventana.get(ip);
  if (!v || v.hasta < ahora) {
    ventana.set(ip, { hasta: ahora + 60_000, usos: 1 });
    if (ventana.size > 5_000) ventana.clear(); // que jamás crezca sin tope
    return false;
  }
  v.usos += 1;
  return v.usos > LIMITE;
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (excedido(ip)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  const codigo = (req.nextUrl.searchParams.get("codigo") ?? "").trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(codigo)) return NextResponse.json({ ok: false });

  const { data, error } = await supabaseService()
    .from("af_afiliados")
    .select("nombre")
    .eq("codigo_ref", codigo)
    .eq("activo", true)
    .maybeSingle<{ nombre: string }>();
  if (error || !data) return NextResponse.json({ ok: false });

  return NextResponse.json({
    ok: true,
    nombre: (data.nombre ?? "").trim().split(/\s+/)[0] ?? "",
  });
}
