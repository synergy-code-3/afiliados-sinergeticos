import { supabaseService } from "./supabase-server";

/** ¿Ya está aplicada la migración 0082 (Synergy +1) en la base?
 *
 * La migración vive en supabase/migrations/0082_afiliados_synergy_plus.sql y
 * la aplica el equipo que administra el proyecto de Axis. Mientras no esté,
 * las features que dependen de ella se ocultan con gracia (afiliado) o se
 * anuncian como pendientes (admin). Sondea columnas y tabla nuevas — dos
 * consultas head-only, baratas. */
export async function synergyPlusListo(): Promise<boolean> {
  const service = supabaseService();
  const { error: colFalta } = await service
    .from("af_afiliados")
    .select("codigo_ref")
    .limit(0);
  if (colFalta) return false;
  const { error: tablaFalta } = await service.from("af_ventas").select("id").limit(0);
  return !tablaFalta;
}
