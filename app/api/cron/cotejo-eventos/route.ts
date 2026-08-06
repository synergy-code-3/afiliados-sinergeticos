import { NextResponse } from "next/server";
import { cotejarEventos } from "@/lib/cotejo";

export const dynamic = "force-dynamic";

/** Cron diario (vercel.json): mantiene tibio el caché del cotejo
 * boletera ↔ web del seminario. Devuelve SOLO conteos — sin detalles, así
 * que no expone nada aunque la ruta sea pública; el detalle vive tras
 * esAdmin() en /api/admin/cotejo-eventos. */
export async function GET(req: Request) {
  const secreto = process.env.CRON_SECRET;
  if (secreto && req.headers.get("authorization") !== `Bearer ${secreto}`) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  const r = await cotejarEventos();
  return NextResponse.json({
    ok: r.ok,
    coincidencias: r.coincidencias,
    pendientes: r.soloWeb.length + r.soloBoletera.length + r.discrepancias.length + r.sinLiga.length,
  });
}
