import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { supabaseSession, supabaseService } from "@/lib/supabase-server";

/** Acceso al panel de administración.
 *
 * Antes la llave viajaba en la URL (`/admin?k=...`) y en el body de cada
 * request: quedaba en el historial, en los logs y en cualquier captura de
 * pantalla. Ahora se canjea UNA vez por una cookie httpOnly firmada, y todo lo
 * demás se verifica server-side contra esa cookie. */

export const COOKIE_ADMIN = "af_admin";
const DURACION_HORAS = 12;

const secreto = () => process.env.AFILIADOS_ADMIN_KEY ?? "";

function firmar(exp: string): string {
  return createHmac("sha256", secreto()).update(exp).digest("hex");
}

/** Token `<expiración>.<firma>` — sin datos dentro, solo vigencia. */
export function crearTokenAdmin(): string {
  const exp = String(Date.now() + DURACION_HORAS * 3600_000);
  return `${exp}.${firmar(exp)}`;
}

export function tokenValido(token: string | undefined): boolean {
  if (!token || !secreto()) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig) return false;
  if (!/^\d+$/.test(exp) || Number(exp) < Date.now()) return false;
  const esperada = Buffer.from(firmar(exp), "utf8");
  const recibida = Buffer.from(sig, "utf8");
  // longitudes distintas revientan timingSafeEqual
  if (esperada.length !== recibida.length) return false;
  return timingSafeEqual(esperada, recibida);
}

/** La llave tecleada, comparada sin filtrar información por tiempo. */
export function llaveCorrecta(intento: string): boolean {
  const real = secreto();
  if (!real || !intento) return false;
  const a = Buffer.from(intento, "utf8");
  const b = Buffer.from(real, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** ¿Hay cookie de la llave compartida? (camino viejo, se conserva de respaldo) */
export async function tieneLlave(): Promise<boolean> {
  const store = await cookies();
  return tokenValido(store.get(COOKIE_ADMIN)?.value);
}

/**
 * ¿El usuario de la sesión está en la lista de administradores?
 *
 * Se autoriza por CORREO, no por id, para poder pre-autorizar a alguien que
 * todavía no tiene cuenta — queda admin en cuanto se registre con ese correo.
 */
export async function esAdminPorCuenta(): Promise<{ ok: boolean; email: string | null }> {
  const supabase = await supabaseSession();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, email: null };

  const { data } = await supabaseService()
    .from("af_admins")
    .select("email")
    .eq("email", user.email.toLowerCase())
    .maybeSingle<{ email: string }>();
  return { ok: Boolean(data), email: user.email.toLowerCase() };
}

/** Cualquiera de los dos caminos abre el panel. */
export async function esAdmin(): Promise<boolean> {
  if ((await esAdminPorCuenta()).ok) return true;
  return tieneLlave();
}
