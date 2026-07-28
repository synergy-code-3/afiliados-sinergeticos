import { supabaseService } from "@/lib/supabase-server";
import AdminToggle from "./toggle";

export const dynamic = "force-dynamic";

interface Afiliado {
  id: string;
  nombre: string;
  telefono: string | null;
  ciudad: string | null;
  activo: boolean;
  created_at: string;
}

export default async function Admin({
  searchParams,
}: {
  searchParams: Promise<{ k?: string }>;
}) {
  const { k } = await searchParams;
  if (!k || k !== process.env.AFILIADOS_ADMIN_KEY) {
    return (
      <main className="mx-auto max-w-md">
        <h1 className="text-xl font-extrabold">Acceso restringido</h1>
      </main>
    );
  }

  const service = supabaseService();
  const { data: afiliados } = await service
    .from("af_afiliados")
    .select("id, nombre, telefono, ciudad, activo, created_at")
    .order("created_at", { ascending: false })
    .returns<Afiliado[]>();

  const { data: conteos } = await service
    .from("af_inscripciones")
    .select("afiliado_id, status")
    .returns<{ afiliado_id: string; status: string }[]>();
  const porAfiliado = new Map<string, { total: number; emitidos: number }>();
  for (const c of conteos ?? []) {
    const e = porAfiliado.get(c.afiliado_id) ?? { total: 0, emitidos: 0 };
    e.total += 1;
    if (c.status === "emitido") e.emitidos += 1;
    porAfiliado.set(c.afiliado_id, e);
  }

  const lista = afiliados ?? [];
  const totalInscritos = (conteos ?? []).length;

  return (
    <main className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-extrabold">Afiliados</h1>
      <p className="mt-1 text-sm text-white/60">
        {lista.length} afiliados · {totalInscritos} inscritos en total
      </p>
      <div className="mt-6 overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-left text-white/60">
            <tr>
              <th className="px-3 py-2 font-semibold">Afiliado</th>
              <th className="px-3 py-2 font-semibold">Ciudad</th>
              <th className="px-3 py-2 font-semibold">WhatsApp</th>
              <th className="px-3 py-2 font-semibold">Inscritos</th>
              <th className="px-3 py-2 font-semibold">Boletos</th>
              <th className="px-3 py-2 font-semibold">Estado</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((a) => {
              const c = porAfiliado.get(a.id) ?? { total: 0, emitidos: 0 };
              return (
                <tr key={a.id} className="border-t border-white/10">
                  <td className="px-3 py-2">{a.nombre}</td>
                  <td className="px-3 py-2 text-white/70">{a.ciudad ?? "—"}</td>
                  <td className="px-3 py-2 text-white/70">{a.telefono ?? "—"}</td>
                  <td className="px-3 py-2">{c.total}</td>
                  <td className="px-3 py-2">{c.emitidos}</td>
                  <td className="px-3 py-2">
                    <AdminToggle id={a.id} activo={a.activo} k={k} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
