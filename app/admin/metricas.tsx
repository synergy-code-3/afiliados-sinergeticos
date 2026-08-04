"use client";

import { useState } from "react";
import { construirCsv, descargarCsv } from "@/lib/csv";
import { comisionCents, dinero, COMISION_PCT } from "@/lib/comisiones";

export interface FilaAfiliado {
  id: string;
  nombre: string;
  ciudad: string | null;
  telefono: string | null;
  activo: boolean;
  inscritos: number;
  con_boleto: number;
  compraron: number;
  ventas_mxn: number;
  ventas_usd: number;
  ventas_mxn_mes: number;
  ventas_usd_mes: number;
}

export interface FilaCiudad {
  ciudad: string;
  afiliados: number;
  inscritos: number;
  ventas_mxn: number;
  ventas_usd: number;
}

export interface FilaEvento {
  evento: string;
  pais: string;
  inscritos: number;
  con_boleto: number;
  compraron: number;
}

export interface AdminMetricas {
  afiliados_total: number;
  afiliados_activos: number;
  inscritos: number;
  con_boleto: number;
  compraron: number;
  ventas_mxn: number;
  ventas_usd: number;
  ventas_mxn_mes: number;
  ventas_usd_mes: number;
  afiliados: FilaAfiliado[];
  ciudades: FilaCiudad[];
  eventos: FilaEvento[];
}

type Vista = "afiliados" | "ciudades" | "eventos";

function Tarjeta({ etiqueta, valor, nota }: { etiqueta: string; valor: string; nota?: string }) {
  return (
    <div className="glass px-5 py-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">{etiqueta}</p>
      <p className="mt-1 text-2xl font-extrabold tabular">{valor}</p>
      {nota ? <p className="mt-1 text-xs text-white/40">{nota}</p> : null}
    </div>
  );
}

const TH = "px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em]";

export default function AdminMetricasPanel({ m }: { m: AdminMetricas }) {
  const [vista, setVista] = useState<Vista>("afiliados");

  const comMxn = comisionCents(m.ventas_mxn);
  const comUsd = comisionCents(m.ventas_usd);
  const tasaCierre = m.con_boleto > 0 ? Math.round((m.compraron / m.con_boleto) * 100) : 0;

  function exportar() {
    if (vista === "afiliados") {
      descargarCsv(
        "afiliados-comisiones",
        construirCsv(
          ["Afiliado", "Ciudad", "WhatsApp", "Estado", "Inscritos", "Con boleto", "Compraron",
           "Ventas MXN", "Comisión MXN", "Ventas USD", "Comisión USD"],
          m.afiliados.map((a) => [
            a.nombre, a.ciudad ?? "", a.telefono ?? "", a.activo ? "Activo" : "Desactivado",
            String(a.inscritos), String(a.con_boleto), String(a.compraron),
            (a.ventas_mxn / 100).toFixed(2), (comisionCents(a.ventas_mxn) / 100).toFixed(2),
            (a.ventas_usd / 100).toFixed(2), (comisionCents(a.ventas_usd) / 100).toFixed(2),
          ]),
        ),
      );
    } else if (vista === "ciudades") {
      descargarCsv(
        "afiliados-por-ciudad",
        construirCsv(
          ["Ciudad", "Afiliados", "Inscritos", "Ventas MXN", "Comisión MXN", "Ventas USD", "Comisión USD"],
          m.ciudades.map((c) => [
            c.ciudad, String(c.afiliados), String(c.inscritos),
            (c.ventas_mxn / 100).toFixed(2), (comisionCents(c.ventas_mxn) / 100).toFixed(2),
            (c.ventas_usd / 100).toFixed(2), (comisionCents(c.ventas_usd) / 100).toFixed(2),
          ]),
        ),
      );
    } else {
      descargarCsv(
        "afiliados-por-evento",
        construirCsv(
          ["Evento", "País", "Inscritos", "Con boleto", "Compraron"],
          m.eventos.map((e) => [
            e.evento, e.pais, String(e.inscritos), String(e.con_boleto), String(e.compraron),
          ]),
        ),
      );
    }
  }

  return (
    <section className="mt-8">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tarjeta
          etiqueta="Afiliados"
          valor={String(m.afiliados_total)}
          nota={`${m.afiliados_activos} activos`}
        />
        <Tarjeta
          etiqueta="Invitados"
          valor={String(m.inscritos)}
          nota={`${m.con_boleto} con boleto`}
        />
        <Tarjeta
          etiqueta="Compraron"
          valor={String(m.compraron)}
          nota={`${tasaCierre}% de los que tienen boleto`}
        />
        <Tarjeta
          etiqueta="Por pagar · MXN"
          valor={dinero(comMxn, "MXN")}
          nota={`${Math.round(COMISION_PCT * 100)}% de ${dinero(m.ventas_mxn, "MXN")}`}
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tarjeta etiqueta="Ventas MXN" valor={dinero(m.ventas_mxn, "MXN")} nota={`este mes ${dinero(m.ventas_mxn_mes, "MXN")}`} />
        <Tarjeta etiqueta="Ventas USD" valor={dinero(m.ventas_usd, "USD")} nota={`este mes ${dinero(m.ventas_usd_mes, "USD")}`} />
        <Tarjeta etiqueta="Por pagar · USD" valor={dinero(comUsd, "USD")} nota={`${Math.round(COMISION_PCT * 100)}% de ${dinero(m.ventas_usd, "USD")}`} />
        <Tarjeta
          etiqueta="Comisión del mes"
          valor={dinero(comisionCents(m.ventas_mxn_mes), "MXN")}
          nota={`+ ${dinero(comisionCents(m.ventas_usd_mes), "USD")}`}
        />
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(["afiliados", "ciudades", "eventos"] as Vista[]).map((v) => (
            <button
              key={v}
              onClick={() => setVista(v)}
              className={`rounded-lg px-4 py-2 text-sm font-bold capitalize transition ${
                vista === v ? "bg-[#19e16d] text-[#04140b]" : "bg-white/10 text-white/60 hover:bg-white/15"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        <button onClick={exportar} className="btn-ghost btn-press !px-4 !py-2 !text-sm">
          Descargar CSV
        </button>
      </div>

      <div className="glass mt-4 overflow-x-auto !rounded-xl">
        {vista === "afiliados" ? (
          <table className="w-full text-sm">
            <thead className="text-left text-white/45">
              <tr className="border-b border-white/10">
                <th className={TH}>#</th>
                <th className={TH}>Afiliado</th>
                <th className={TH}>Ciudad</th>
                <th className={TH}>Inscritos</th>
                <th className={TH}>Boletos</th>
                <th className={TH}>Compraron</th>
                <th className={TH}>Ventas</th>
                <th className={TH}>Comisión</th>
              </tr>
            </thead>
            <tbody>
              {m.afiliados.map((a, n) => (
                <tr key={a.id} className="border-t border-white/[0.06]">
                  <td className="px-4 py-3 tabular text-white/40">{n + 1}</td>
                  <td className="px-4 py-3 font-semibold">
                    {a.nombre}
                    {!a.activo ? (
                      <span className="ml-2 text-[10px] font-bold uppercase text-[#ffb2b2]">baja</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-white/60">{a.ciudad || "—"}</td>
                  <td className="px-4 py-3 tabular">{a.inscritos}</td>
                  <td className="px-4 py-3 tabular">{a.con_boleto}</td>
                  <td className="px-4 py-3 tabular font-semibold text-[#19e16d]">{a.compraron}</td>
                  <td className="px-4 py-3 tabular text-white/70">
                    {a.ventas_mxn > 0 ? dinero(a.ventas_mxn, "MXN") : null}
                    {a.ventas_mxn > 0 && a.ventas_usd > 0 ? " · " : null}
                    {a.ventas_usd > 0 ? dinero(a.ventas_usd, "USD") : null}
                    {a.ventas_mxn === 0 && a.ventas_usd === 0 ? "—" : null}
                  </td>
                  <td className="px-4 py-3 tabular font-bold">
                    {a.ventas_mxn > 0 ? dinero(comisionCents(a.ventas_mxn), "MXN") : null}
                    {a.ventas_mxn > 0 && a.ventas_usd > 0 ? " · " : null}
                    {a.ventas_usd > 0 ? dinero(comisionCents(a.ventas_usd), "USD") : null}
                    {a.ventas_mxn === 0 && a.ventas_usd === 0 ? "—" : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : vista === "ciudades" ? (
          <table className="w-full text-sm">
            <thead className="text-left text-white/45">
              <tr className="border-b border-white/10">
                <th className={TH}>Ciudad</th>
                <th className={TH}>Afiliados</th>
                <th className={TH}>Inscritos</th>
                <th className={TH}>Ventas</th>
                <th className={TH}>Comisión</th>
              </tr>
            </thead>
            <tbody>
              {m.ciudades.map((c) => (
                <tr key={c.ciudad} className="border-t border-white/[0.06]">
                  <td className="px-4 py-3 font-semibold">{c.ciudad}</td>
                  <td className="px-4 py-3 tabular">{c.afiliados}</td>
                  <td className="px-4 py-3 tabular">{c.inscritos}</td>
                  <td className="px-4 py-3 tabular text-white/70">
                    {c.ventas_mxn > 0 ? dinero(c.ventas_mxn, "MXN") : "—"}
                    {c.ventas_usd > 0 ? ` · ${dinero(c.ventas_usd, "USD")}` : ""}
                  </td>
                  <td className="px-4 py-3 tabular font-bold">
                    {c.ventas_mxn > 0 ? dinero(comisionCents(c.ventas_mxn), "MXN") : "—"}
                    {c.ventas_usd > 0 ? ` · ${dinero(comisionCents(c.ventas_usd), "USD")}` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-white/45">
              <tr className="border-b border-white/10">
                <th className={TH}>Evento</th>
                <th className={TH}>País</th>
                <th className={TH}>Inscritos</th>
                <th className={TH}>Boletos</th>
                <th className={TH}>Compraron</th>
                <th className={TH}>Cierre</th>
              </tr>
            </thead>
            <tbody>
              {m.eventos.map((e) => (
                <tr key={`${e.evento}-${e.pais}`} className="border-t border-white/[0.06]">
                  <td className="px-4 py-3 font-semibold">{e.evento}</td>
                  <td className="px-4 py-3 text-white/60">{e.pais}</td>
                  <td className="px-4 py-3 tabular">{e.inscritos}</td>
                  <td className="px-4 py-3 tabular">{e.con_boleto}</td>
                  <td className="px-4 py-3 tabular font-semibold text-[#19e16d]">{e.compraron}</td>
                  <td className="px-4 py-3 tabular text-white/60">
                    {e.con_boleto > 0 ? `${Math.round((e.compraron / e.con_boleto) * 100)}%` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="mt-3 text-xs text-white/40">
        Comisión al {Math.round(COMISION_PCT * 100)}% de cada venta. Se atribuye al afiliado
        cualquier compra posterior a la inscripción de su invitado. La cuenta demo está excluida.
      </p>
    </section>
  );
}
