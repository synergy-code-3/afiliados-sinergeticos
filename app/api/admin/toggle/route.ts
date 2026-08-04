import { NextResponse, type NextRequest } from "next/server";
import { supabaseService } from "@/lib/supabase-server";
import { esAdmin } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  if (!(await esAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id, activo } = (await req.json()) as { id?: string; activo?: boolean };
  if (!id || typeof activo !== "boolean") {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }
  const { error } = await supabaseService().from("af_afiliados").update({ activo }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
