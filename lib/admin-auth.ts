import { supabaseSession, supabaseService } from "@/lib/supabase-server";

/**
 * Acceso al panel de administración — SOLO por cuenta.
 *
 * Historia, para que no se repita:
 *   1. La llave viajaba en la URL (`/admin?k=...`): quedaba en el historial, en
 *      los logs y en cualquier captura de pantalla.
 *   2. Después se canjeaba por una cookie firmada — mejor, pero seguía siendo
 *      una llave COMPARTIDA: quien la tuviera entraba, no se sabía quién hizo
 *      qué y no se le podía quitar el acceso a una sola persona.
 *   3. Ahora se es admin por cuenta, y la lista vive en `afiliados.af_admins`.
 *
 * Se autoriza por CORREO, no por id, para poder pre-autorizar a alguien que
 * todavía no tiene cuenta: queda admin en cuanto se registre con ese correo.
 */

export interface EstadoAdmin {
  /** hay sesión iniciada */
  autenticado: boolean;
  /** esa cuenta está en la lista de administradores */
  ok: boolean;
  email: string | null;
}

export async function estadoAdmin(): Promise<EstadoAdmin> {
  const supabase = await supabaseSession();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { autenticado: false, ok: false, email: null };

  const email = user.email.toLowerCase();
  const { data } = await supabaseService()
    .from("af_admins")
    .select("email")
    .eq("email", email)
    .maybeSingle<{ email: string }>();
  return { autenticado: true, ok: Boolean(data), email };
}

/** ¿La petición actual viene de un administrador? */
export async function esAdmin(): Promise<boolean> {
  return (await estadoAdmin()).ok;
}

/** El correo del admin de la sesión (para registrar quién hizo qué). */
export async function esAdminPorCuenta(): Promise<{ ok: boolean; email: string | null }> {
  const { ok, email } = await estadoAdmin();
  return { ok, email };
}
