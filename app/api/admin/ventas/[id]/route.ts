import { NextResponse, type NextRequest } from "next/server";
import { supabaseService } from "@/lib/supabase-server";
import { esAdmin } from "@/lib/admin-auth";
import { synergyPlusListo } from "@/lib/schema";

/**
 * Cambios de estado de una venta Synergy +1 (solo admins).
 *
 * PATCH { accion: 'validar' | 'rechazar' | 'pagar' | 'pendiente' }
 * Cada transición deja su timestamp (validada_at, pagada_at) para que el corte
 * de las 72 horas y el pago a 10 días hábiles se puedan auditar después.
 */

const ACCIONES = ["validar", "rechazar", "pagar", "pendiente"] as const;
type Accion = (typeof ACCIONES)[number];

interface VentaEstado {
  id: string;
  estado: string;
  validada_at: string | null;
}

interface Cambio {
  estado: string;
  validada_at?: string | null;
  pagada_at?: string | null;
}

function transicion(accion: Accion, venta: VentaEstado): Cambio | { error: string } {
  const ahora = new Date().toISOString();
  switch (accion) {
    case "validar":
      return { estado: "validada", validada_at: ahora, pagada_at: null };
    case "rechazar":
      return { estado: "rechazada", pagada_at: null };
    case "pagar":
      if (venta.estado === "rechazada") {
        return { error: "Esta venta está rechazada — regrésala a pendiente antes de pagarla." };
      }
      // si se paga directo, la validación queda implícita con la misma hora
      return { estado: "pagada", pagada_at: ahora, validada_at: venta.validada_at ?? ahora };
    case "pendiente":
      return { estado: "pendiente", validada_at: null, pagada_at: null };
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await esAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!(await synergyPlusListo())) return NextResponse.json({ ok: false, pendiente: true });

  const { id } = await ctx.params;
  const { accion } = (await req.json()) as { accion?: string };
  if (!ACCIONES.includes(accion as Accion)) {
    return NextResponse.json({ error: "Esa acción no existe." }, { status: 400 });
  }

  const service = supabaseService();
  const { data: venta } = await service
    .from("af_ventas")
    .select("id, estado, validada_at")
    .eq("id", id)
    .maybeSingle<VentaEstado>();
  if (!venta) {
    return NextResponse.json({ error: "No encontramos esa venta." }, { status: 404 });
  }

  const cambio = transicion(accion as Accion, venta);
  if ("error" in cambio) return NextResponse.json({ error: cambio.error }, { status: 409 });

  const { error } = await service.from("af_ventas").update(cambio).eq("id", venta.id);
  if (error) {
    return NextResponse.json({ error: "No se pudo actualizar la venta. Intenta de nuevo." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, estado: cambio.estado });
}
