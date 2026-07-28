import { supabaseService } from "@/lib/supabase-server";
import AdminToggle from "./toggle";
import AdminRecursos from "./recursos";

export const dynamic = "force-dynamic";

interface Afiliado {
  id: string;
  nombre: string;
  telefono: string | null;
  ciudad: string | null;
  activo: boolean;
  created_at: string;
}

interface Recurso {
  id: string;
  titulo: string;
  descripcion: string;
  url: string;
  tipo: string;
  activo: boolean;
}

export default async function Admin({
  searchParams,
}: {
  searchParams: Promise<{ k?: string }>;
}) {
  const { k } = await searchParams;
  if (!k || k !== process.env.AFILIADOS_ADMIN_KEY) {
    return (
      <main className="wrap pb-24 pt-16">
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

  const { data: recursos } = await service
    .from("af_recursos")
    .select("id, titulo, descripcion, url, tipo, activo")
    .order("created_at", { ascending: false })
    .returns<Recurso[]>();

  const lista = afiliados ?? [];
  const totalInscritos = (conteos ?? []).length;

  return (
    <main className="relative">
      <div className="aurora"><span className="b1" /></div>
      <div className="wrap relative pb-24 pt-12">
        <p className="sec-tag mb-3">
          <span className="pulse inline-block h-1.5 w-1.5 rounded-full bg-[#19e16d]" />
          Administración
        </p>
        <h1 className="text-3xl font-extrabold">Afiliados</h1>
        <p className="mt-1.5 text-white/55">
          {lista.length} afiliados · {totalInscritos} inscritos en total
        </p>

        <div className="glass mt-6 overflow-x-auto !rounded-xl">
          <table className="w-full text-sm">
            <thead className="text-left text-white/45">
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em]">Afiliado</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em]">Ciudad</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em]">WhatsApp</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em]">Inscritos</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em]">Boletos</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em]">Estado</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((a) => {
                const c = porAfiliado.get(a.id) ?? { total: 0, emitidos: 0 };
                return (
                  <tr key={a.id} className="border-t border-white/[0.06]">
                    <td className="px-4 py-3 font-semibold">{a.nombre}</td>
                    <td className="px-4 py-3 text-white/60">{a.ciudad ?? "—"}</td>
                    <td className="px-4 py-3 tabular text-white/60">{a.telefono ?? "—"}</td>
                    <td className="px-4 py-3 tabular">{c.total}</td>
                    <td className="px-4 py-3 tabular">{c.emitidos}</td>
                    <td className="px-4 py-3">
                      <AdminToggle id={a.id} activo={a.activo} k={k} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <AdminRecursos recursos={recursos ?? []} k={k} />
      </div>
    </main>
  );
}
