import { NextResponse, type NextRequest } from "next/server";
import { supabaseService } from "@/lib/supabase-server";
import { esAdmin, esAdminPorCuenta } from "@/lib/admin-auth";

/**
 * Alta y baja de administradores del portal.
 *
 * Se autoriza por CORREO, no por id, para poder pre-autorizar a alguien que aún
 * no tiene cuenta: queda admin en cuanto se registre con ese correo.
 *
 * Solo un admin puede dar de alta a otro (pedido de David).
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  if (!(await esAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { email } = (await req.json()) as { email?: string };
  const correo = email?.trim().toLowerCase() ?? "";
  if (!EMAIL_RE.test(correo)) {
    return NextResponse.json({ error: "El correo no se ve válido." }, { status: 400 });
  }

  // queda registrado quién lo dio de alta
  const { email: quien } = await esAdminPorCuenta();
  const { error } = await supabaseService()
    .from("af_admins")
    .upsert({ email: correo, agregado_por: quien ?? "llave" }, { onConflict: "email" });
  if (error) return NextResponse.json({ error: "No se pudo agregar." }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!(await esAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { email } = (await req.json()) as { email?: string };
  const correo = email?.trim().toLowerCase() ?? "";
  if (!correo) return NextResponse.json({ error: "Falta el correo" }, { status: 400 });

  // nadie se quita a sí mismo: evita quedarse sin acceso por accidente
  const { email: quien } = await esAdminPorCuenta();
  if (quien && quien === correo) {
    return NextResponse.json(
      { error: "No puedes quitarte a ti mismo el acceso." },
      { status: 400 },
    );
  }

  // y jamás dejar la lista vacía
  const service = supabaseService();
  const { count } = await service.from("af_admins").select("email", { count: "exact", head: true });
  if ((count ?? 0) <= 1) {
    return NextResponse.json(
      { error: "Debe quedar al menos un administrador." },
      { status: 400 },
    );
  }

  const { error } = await service.from("af_admins").delete().eq("email", correo);
  if (error) return NextResponse.json({ error: "No se pudo quitar." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
