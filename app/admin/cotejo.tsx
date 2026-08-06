"use client";

import { useCallback, useEffect, useState } from "react";
import type { FilaCotejo, ResultadoCotejo } from "@/lib/cotejo";

/** Cotejo de eventos: la boletera (que emite pases) contra la web pública del
 * seminario (lo que la gente ve). Se sincroniza solo cada 24 horas; el botón
 * fuerza una resincronía inmediata. */

const TH = "px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em]";

function Tabla({ titulo, filas, tono }: { titulo: string; filas: FilaCotejo[]; tono: "rojo" | "ambar" }) {
  if (filas.length === 0) return null;
  const color = tono === "rojo" ? "text-[#ffb2b2]" : "text-[#ffd28a]";
  return (
    <div className="mt-5">
      <p className={`text-sm font-bold ${color}`}>
        {titulo} ({filas.length})
      </p>
      <div className="glass mt-2 overflow-x-auto !rounded-xl">
        <table className="w-full text-sm">
          <thead className="text-left text-white/45">
            <tr className="border-b border-white/10">
              <th className={TH}>Ciudad / evento</th>
              <th className={TH}>En la web</th>
              <th className={TH}>En la boletera</th>
              <th className={TH}>Qué pasa</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f, n) => (
              <tr key={n} className="border-t border-white/[0.06]">
                <td className="px-4 py-3 font-semibold">{f.ciudad}</td>
                <td className="px-4 py-3 tabular text-white/60">{f.fechaWeb}</td>
                <td className="px-4 py-3 tabular text-white/60">{f.fechaBoletera}</td>
                <td className={`px-4 py-3 ${color}`}>{f.detalle}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminCotejo() {
  const [datos, setDatos] = useState<ResultadoCotejo | null>(null);
  const [cargando, setCargando] = useState(true);
  const [fallo, setFallo] = useState(false);

  const cargar = useCallback(async (refrescar: boolean) => {
    setCargando(true);
    setFallo(false);
    try {
      const r = await fetch(`/api/admin/cotejo-eventos${refrescar ? "?refrescar=1" : ""}`);
      const d = (await r.json()) as ResultadoCotejo;
      if (!r.ok || !d.ok) setFallo(true);
      else setDatos(d);
    } catch {
      setFallo(true);
    }
    setCargando(false);
  }, []);

  useEffect(() => {
    void cargar(false);
  }, [cargar]);

  const pendientes = datos
    ? datos.soloWeb.length + datos.soloBoletera.length + datos.discrepancias.length + datos.sinLiga.length
    : 0;

  return (
    <section className="mt-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="sec-tag mb-1">Boletera ↔ web del seminario</p>
          <h2 className="text-xl font-bold">Cotejo de eventos</h2>
          <p className="mt-1 text-sm text-white/55">
            Compara lo registrado en la boletera con lo que sale en
            seminariodeemprendedoraempresariodigital.com. Se sincroniza solo cada 24 horas.
          </p>
        </div>
        <button
          onClick={() => void cargar(true)}
          disabled={cargando}
          className="btn-ghost btn-press !px-4 !py-2 !text-sm"
        >
          {cargando ? "Sincronizando…" : "Actualizar ahora"}
        </button>
      </div>

      {fallo ? (
        <p className="mt-4 text-sm font-semibold text-[#ffb2b2]">
          No se pudo consultar alguna de las dos fuentes. Intenta de nuevo en un momento.
        </p>
      ) : null}

      {datos ? (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="glass px-5 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">
                Eventos que cuadran
              </p>
              <p className="mt-1 text-2xl font-extrabold tabular text-[#19e16d]">
                {datos.coincidencias}
              </p>
            </div>
            <div className="glass px-5 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">
                Por revisar
              </p>
              <p
                className={`mt-1 text-2xl font-extrabold tabular ${
                  pendientes === 0 ? "text-[#19e16d]" : "text-[#ffd28a]"
                }`}
              >
                {pendientes === 0 ? "Todo cuadra ✓" : pendientes}
              </p>
            </div>
          </div>

          <Tabla titulo="En la web pero mal en la boletera" filas={datos.soloWeb} tono="rojo" />
          <Tabla titulo="Datos que no cuadran" filas={datos.discrepancias} tono="ambar" />
          <Tabla
            titulo="En la boletera pero faltan en la web"
            filas={datos.soloBoletera}
            tono="ambar"
          />
          <Tabla titulo="Sin liga a la boletera" filas={datos.sinLiga} tono="ambar" />
        </>
      ) : cargando ? (
        <p className="mt-4 text-sm text-white/45">Sincronizando con ambas fuentes…</p>
      ) : null}
    </section>
  );
}
