import { NextResponse } from "next/server";

export const revalidate = 300;

interface EventoTicketera {
  id: string;
  name: string;
  date: string;
  venue?: string;
  timezone?: string;
}

/** Eventos próximos invitables (gratis): excluye upgrades, pruebas y eventos
 * de paga como Synergy Unlimited. */
export async function GET() {
  const r = await fetch("https://synergyticket.net/api/events", {
    next: { revalidate: 300 },
  });
  if (!r.ok) return NextResponse.json({ eventos: [] });
  const todos = (await r.json()) as EventoTicketera[];
  const ahora = Date.now();
  const eventos = todos
    .filter((e) => {
      const n = (e.name ?? "").toLowerCase();
      if (n.includes("upgrade") || n.includes("prueba") || n.includes("unlimited")) return false;
      const d = new Date(e.date).getTime();
      return Number.isFinite(d) && d > ahora;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((e) => ({ id: e.id, name: e.name, date: e.date, venue: e.venue ?? "" }));
  return NextResponse.json({ eventos });
}
