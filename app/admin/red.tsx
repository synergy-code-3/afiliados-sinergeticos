"use client";

import { dinero } from "@/lib/comisiones";

/**
 * Red +1 — cada afiliado que ha registrado a sus +1, con lo que esos +1 han
 * generado y el override (20% extra) que le han dejado a su líder.
 *
 * Componente de presentación: el integrador arma `arbol` en el server
 * component de /admin y lo pasa por props junto con `dbListo`.
 */

export interface MiembroRed {
  id: string;
  nombre: string;
  /** ISO — fecha en que se registró como +1 */
  creadoEl: string;
  /** ventas que ese +1 ha generado */
  ventas: number;
  comisionCents: number;
  /** override que sus ventas le han dejado a su líder */
  overrideCents: number;
  moneda: string;
}

export interface GrupoRed {
  lider: { id: string; nombre: string };
  miembros: MiembroRed[];
}

const TH = "px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em]";

const monedaSegura = (m: string): "MXN" | "USD" => (m === "USD" ? "USD" : "MXN");

function fechaLarga(iso: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

/** Suma de override por moneda, en texto: "$1,000 MXN · $200 USD". */
function overrideDelGrupo(miembros: MiembroRed[]): string {
  const totales = miembros.reduce(
    (acc, m) => {
      const mon = monedaSegura(m.moneda);
      return { ...acc, [mon]: acc[mon] + m.overrideCents };
    },
    { MXN: 0, USD: 0 },
  );
  const partes = (["MXN", "USD"] as const)
    .filter((mon) => totales[mon] > 0)
    .map((mon) => dinero(totales[mon], mon));
  return partes.length > 0 ? partes.join(" · ") : "—";
}

function TarjetaPendienteDb() {
  return (
    <section className="mt-12">
      <p className="sec-tag mb-1">Synergy +1</p>
      <h2 className="text-xl font-bold">Red +1</h2>
      <div className="mt-4 rounded-2xl border border-[#d9b45b]/40 bg-[#d9b45b]/[0.08] px-5 py-5">
        <p className="font-bold text-[#d9b45b]">Pendiente de activar en base de datos</p>
        <p className="mt-1.5 text-sm leading-relaxed text-white/60">
          Esta sección se activa al aplicar la migración{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">
            0082_afiliados_synergy_plus.sql
          </code>{" "}
          en la base (equipo Axis).
        </p>
      </div>
    </section>
  );
}

function Grupo({ grupo, orden }: { grupo: GrupoRed; orden: number }) {
  return (
    <div className="red-anim glass mt-4 overflow-hidden !rounded-xl" style={{ animationDelay: `${Math.min(orden, 6) * 0.06}s` }}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-5 py-4">
        <div>
          <p className="font-bold">{grupo.lider.nombre}</p>
          <p className="mt-0.5 text-sm text-white/55">
            {grupo.miembros.length} {grupo.miembros.length === 1 ? "+1 registrado" : "+1 registrados"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#d9b45b]">
            Override ganado
          </p>
          <p className="tabular font-bold text-[#d9b45b]">{overrideDelGrupo(grupo.miembros)}</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-white/45">
            <tr className="border-b border-white/10">
              <th className={TH}>Su +1</th>
              <th className={TH}>Se unió</th>
              <th className={TH}>Ventas</th>
              <th className={TH}>Comisión</th>
              <th className={TH}>Override al líder</th>
            </tr>
          </thead>
          <tbody>
            {grupo.miembros.map((m) => {
              const mon = monedaSegura(m.moneda);
              return (
                <tr key={m.id} className="border-t border-white/[0.06]">
                  <td className="px-4 py-3 font-semibold">{m.nombre}</td>
                  <td className="px-4 py-3 text-white/60">{fechaLarga(m.creadoEl)}</td>
                  <td className="px-4 py-3 tabular">{m.ventas}</td>
                  <td className="px-4 py-3 tabular text-white/70">
                    {m.comisionCents > 0 ? dinero(m.comisionCents, mon) : "—"}
                  </td>
                  <td className="px-4 py-3 tabular font-bold text-[#d9b45b]">
                    {m.overrideCents > 0 ? dinero(m.overrideCents, mon) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminRed({ dbListo, arbol }: { dbListo: boolean; arbol: GrupoRed[] }) {
  if (!dbListo) return <TarjetaPendienteDb />;

  return (
    <section className="mt-12">
      {/* animación propia; quien pide menos movimiento no la ve */}
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          @keyframes red-entrada {
            from { opacity: 0; transform: translateY(10px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .red-anim { animation: red-entrada 0.4s ease-out both; }
        }
      `}</style>
      <p className="sec-tag mb-1">Synergy +1</p>
      <h2 className="text-xl font-bold">Red +1</h2>
      <p className="mt-1 text-sm text-white/55">
        Cada afiliado con los +1 que ha registrado. El override es el 20% extra que las ventas
        de sus +1 le dejan, sin descontarle nada a nadie.
      </p>

      {arbol.length === 0 ? (
        <div className="glass mt-4 px-6 py-10 text-center">
          <p className="text-3xl" aria-hidden>🌱</p>
          <p className="mt-3 font-semibold text-white/70">
            Nadie ha registrado a su +1 todavía — el botón está en el panel de cada afiliado.
          </p>
        </div>
      ) : (
        arbol.map((g, i) => <Grupo key={g.lider.id} grupo={g} orden={i} />)
      )}
    </section>
  );
}
