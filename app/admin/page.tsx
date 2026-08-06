import Link from "next/link";
import { supabaseService } from "@/lib/supabase-server";
import { estadoAdmin } from "@/lib/admin-auth";
import { synergyPlusListo } from "@/lib/schema";
import AdminToggle from "./toggle";
import AdminRecursos from "./recursos";
import SinAcceso from "./sin-acceso";
import AdminMetricasPanel, { type AdminMetricas } from "./metricas";
import AdminAdmins, { type Admin } from "./admins";
import AdminVentas from "./ventas";
import AdminRed, { type GrupoRed, type MiembroRed } from "./red";
import AdminCotejo from "./cotejo";

export const dynamic = "force-dynamic";

interface Afiliado {
  id: string;
  nombre: string;
  telefono: string | null;
  ciudad: string | null;
  activo: boolean;
  demo: boolean;
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

export default async function Admin() {
  // acceso SOLO por cuenta: la llave compartida se eliminó
  const { autenticado, ok, email: miCorreo } = await estadoAdmin();
  if (!ok) return <SinAcceso autenticado={autenticado} email={miCorreo} />;
  const service = supabaseService();
  const { data: admins } = await service
    .from("af_admins")
    .select("email, agregado_por, created_at")
    .order("created_at", { ascending: true })
    .returns<Admin[]>();
  const { data: afiliados } = await service
    .from("af_afiliados")
    .select("id, nombre, telefono, ciudad, activo, demo, created_at")
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

  // métricas con dinero: ventas, quién compró y comisiones al 20%
  const { data: metricasRaw } = await service.rpc("admin_metricas");
  const metricas = (metricasRaw ?? null) as AdminMetricas | null;

  // ── Synergy +1: red de referidos entre afiliados (migración 0082) ──
  const dbListo = await synergyPlusListo();
  let arbol: GrupoRed[] = [];
  if (dbListo) {
    const { data: conRef } = await service
      .from("af_afiliados")
      .select("id, nombre, referido_por, created_at")
      .not("referido_por", "is", null)
      .returns<{ id: string; nombre: string; referido_por: string; created_at: string }[]>();

    const hijos = conRef ?? [];
    const { data: ventasRef } = hijos.length
      ? await service
          .from("af_ventas")
          .select("afiliado_id, comision_cents, override_cents, moneda, estado")
          .in(
            "afiliado_id",
            hijos.map((h) => h.id),
          )
          .neq("estado", "rechazada")
          .returns<
            { afiliado_id: string; comision_cents: number; override_cents: number; moneda: string; estado: string }[]
          >()
      : { data: [] };

    const nombrePorId = new Map((afiliados ?? []).map((a) => [a.id, a.nombre]));
    const lideres = [...new Set(hijos.map((h) => h.referido_por))];
    arbol = lideres.map((liderId) => ({
      lider: { id: liderId, nombre: nombrePorId.get(liderId) ?? "—" },
      miembros: hijos
        .filter((h) => h.referido_por === liderId)
        .map((h): MiembroRed => {
          const suyas = (ventasRef ?? []).filter((v) => v.afiliado_id === h.id);
          // jamás se suman monedas distintas (en la base conviven MXN y USD):
          // se reporta la moneda dominante del miembro y SOLO sus centavos
          const monedas = [...new Set(suyas.map((v) => v.moneda))];
          const dominante =
            monedas
              .map((m) => ({
                moneda: m,
                comision: suyas
                  .filter((v) => v.moneda === m)
                  .reduce((t, v) => t + Number(v.comision_cents), 0),
                override: suyas
                  .filter((v) => v.moneda === m)
                  .reduce((t, v) => t + Number(v.override_cents), 0),
              }))
              .sort((a, b) => b.comision - a.comision)[0] ?? {
              moneda: "MXN",
              comision: 0,
              override: 0,
            };
          return {
            id: h.id,
            nombre: h.nombre,
            creadoEl: h.created_at,
            ventas: suyas.length,
            comisionCents: dominante.comision,
            overrideCents: dominante.override,
            moneda: dominante.moneda,
          };
        }),
    }));
  }

  const { data: recursos } = await service
    .from("af_recursos")
    .select("id, titulo, descripcion, url, tipo, activo")
    .order("created_at", { ascending: false })
    .returns<Recurso[]>();

  // ranking: quien más boletos colocó, arriba
  const lista = [...(afiliados ?? [])].sort((a, b) => {
    const ca = porAfiliado.get(a.id) ?? { total: 0, emitidos: 0 };
    const cb = porAfiliado.get(b.id) ?? { total: 0, emitidos: 0 };
    return cb.emitidos - ca.emitidos || cb.total - ca.total;
  });
  // la cuenta demo no cuenta en los números del negocio
  const idsDemo = new Set((afiliados ?? []).filter((a) => a.demo).map((a) => a.id));
  const conteosReales = (conteos ?? []).filter((c) => !idsDemo.has(c.afiliado_id));
  const totalInscritos = conteosReales.length;
  const totalEmitidos = conteosReales.filter((c) => c.status === "emitido").length;

  return (
    <main className="relative">
      <div className="aurora"><span className="b1" /></div>
      <div className="wrap relative pb-24 pt-12">
        <p className="sec-tag mb-3">
          <span className="pulse inline-block h-1.5 w-1.5 rounded-full bg-[#19e16d]" />
          Administración
        </p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold">Afiliados</h1>
            <p className="mt-1.5 text-white/55">
              {lista.filter((a) => !a.demo).length} afiliados · {totalInscritos} inscritos ·{" "}
              {totalEmitidos} boletos emitidos
            </p>
          </div>
          <Link href="/panel" className="btn-ghost btn-press !px-4 !py-2 !text-sm">
            ← Mi panel
          </Link>
        </div>

        {metricas ? <AdminMetricasPanel m={metricas} /> : null}

        <AdminVentas dbListo={dbListo} />

        <AdminRed dbListo={dbListo} arbol={arbol} />

        <AdminCotejo />

        <details className="mt-10">
          <summary className="cursor-pointer text-sm font-semibold text-white/50 hover:text-white/70">
            Administrar afiliados (activar / desactivar)
          </summary>
        <div className="glass mt-4 overflow-x-auto !rounded-xl">
          <table className="w-full text-sm">
            <thead className="text-left text-white/45">
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em]">#</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em]">Afiliado</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em]">Ciudad</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em]">WhatsApp</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em]">Inscritos</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em]">Boletos</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em]">Estado</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((a, n) => {
                const c = porAfiliado.get(a.id) ?? { total: 0, emitidos: 0 };
                return (
                  <tr key={a.id} className="border-t border-white/[0.06]">
                    <td className="px-4 py-3 tabular text-white/40">{n + 1}</td>
                    <td className="px-4 py-3 font-semibold">
                      {a.nombre}
                      {a.demo ? (
                        <span className="ml-2 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/50">
                          demo
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-white/60">{a.ciudad ?? "—"}</td>
                    <td className="px-4 py-3 tabular text-white/60">{a.telefono ?? "—"}</td>
                    <td className="px-4 py-3 tabular">{c.total}</td>
                    <td className="px-4 py-3 tabular">{c.emitidos}</td>
                    <td className="px-4 py-3">
                      <AdminToggle id={a.id} activo={a.activo} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </details>

        <AdminAdmins admins={admins ?? []} yo={miCorreo} />

        <AdminRecursos recursos={recursos ?? []} />
      </div>
    </main>
  );
}
