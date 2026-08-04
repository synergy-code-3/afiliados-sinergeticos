import { NextResponse } from "next/server";
import { paisDeEvento } from "@/lib/pais";

export const revalidate = 300;

interface EventoTicketera {
  id: string;
  name: string;
  date: string;
  venue?: string;
  timezone?: string;
  isActive?: boolean;
  freeTicketEnabled?: boolean;
}

/** Eventos activos invitables: sincroniza con la boletera (isActive +
 * boleto gratis habilitado + fecha futura). Excluye por nombre los
 * upgrades, pruebas y eventos de paga como Synergy Unlimited. */
export async function GET() {
  const r = await fetch("https://synergyticket.net/api/events", {
    next: { revalidate: 300 },
  });
  if (!r.ok) return NextResponse.json({ eventos: [] });
  const todos = (await r.json()) as EventoTicketera[];
  const ahora = Date.now();
  const eventos = todos
    .filter((e) => {
      if (e.isActive === false) return false;
      if (e.freeTicketEnabled === false) return false;
      const n = (e.name ?? "").toLowerCase();
      if (n.includes("upgrade") || n.includes("prueba") || n.includes("unlimited")) return false;
      const d = new Date(e.date).getTime();
      return Number.isFinite(d) && d > ahora;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((e) => ({
      id: e.id,
      name: e.name,
      date: e.date,
      venue: e.venue ?? "",
      // pesos si el evento es en México, dólares si es en EE. UU.
      pais: paisDeEvento(e.timezone, e.name),
    }));
  return NextResponse.json({ eventos });
}
