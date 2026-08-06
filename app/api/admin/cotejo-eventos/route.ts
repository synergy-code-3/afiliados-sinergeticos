import { NextResponse, type NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { esAdmin } from "@/lib/admin-auth";
import { cotejarEventos, TAG_COTEJO } from "@/lib/cotejo";

export const dynamic = "force-dynamic";

/** Cotejo boletera ↔ web del seminario para el admin.
 * Los datos de origen viven en el caché de datos con revalidate de 24 h
 * (más el cron diario que lo calienta); `?refrescar=1` fuerza la resincronía. */
export async function GET(req: NextRequest) {
  if (!(await esAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  if (req.nextUrl.searchParams.get("refrescar") === "1") {
    // firma de Next 16: el perfil 'max' da stale-while-revalidate inmediato
    revalidateTag(TAG_COTEJO, "max");
  }
  const resultado = await cotejarEventos();
  return NextResponse.json(resultado);
}
