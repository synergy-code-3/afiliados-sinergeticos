"use client";

import { useCallback, useEffect, useState } from "react";
import { construirCsv, descargarCsv } from "@/lib/csv";
import {
  PAQUETE_LABEL,
  PAGO_DIAS_HABILES,
  VALIDACION_HORAS,
  dinero,
  type Paquete,
} from "@/lib/comisiones";
import Capturar, { CHIP_BASE, CHIP_OFF, CHIP_ON } from "./ventas-captura";

/**
 * Ventas y comisiones Synergy +1 — sección del panel /admin.
 *
 * Recibe solo `dbListo` (resultado de synergyPlusListo()); los datos los trae
 * de sus propias APIs (/api/admin/buscar y /api/admin/ventas) para que la
 * búsqueda y las acciones se sientan inmediatas sin recargar la página.
 * La captura vive en ./ventas-captura.tsx; aquí van la leyenda y la lista.
 */

export interface VentaFila {
  id: string;
  afiliado_id: string;
  afiliado_nombre: string;
  inscripcion_id: string | null;
  comprador_nombre: string | null;
  comprador_email: string | null;
  comprador_telefono: string | null;
  event_name: string | null;
  paquete: Paquete;
  moneda: "MXN" | "USD";
  comision_cents: number;
  override_cents: number;
  override_para: string | null;
  override_para_nombre: string | null;
  estado: string;
  capturada_por: string;
  notas: string | null;
  created_at: string;
}

const FILTROS = ["todas", "pendiente", "validada", "pagada", "rechazada"] as const;
type Filtro = (typeof FILTROS)[number];

const ESTADO_UI: Record<string, { label: string; clase: string }> = {
  pendiente: { label: "Pendiente", clase: "bg-white/10 text-white/70" },
  validada: { label: "Validada", clase: "bg-[#19e16d]/15 text-[#19e16d]" },
  pagada: { label: "Pagada", clase: "bg-[#d9b45b]/15 text-[#d9b45b]" },
  rechazada: { label: "Rechazada", clase: "bg-[#ffb2b2]/15 text-[#ffb2b2]" },
};

const TH = "px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em]";

function fechaCorta(iso: string): string {
  return new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short" }).format(new Date(iso));
}

/* ── Piezas chicas ─────────────────────────────────────────────────────────── */

function Leyenda() {
  return (
    <div className="mt-4 rounded-2xl border border-[#d9b45b]/40 bg-[#d9b45b]/[0.08] px-5 py-4">
      <p className="text-sm font-semibold leading-relaxed text-[#d9b45b]">
        ⏱ Después de cada evento tenemos {VALIDACION_HORAS} horas para validar las comisiones.
        El corte se hace al cierre del evento y el depósito llega en {PAGO_DIAS_HABILES} días
        hábiles.
      </p>
    </div>
  );
}

function TarjetaPendienteDb() {
  return (
    <section className="mt-12">
      <p className="sec-tag mb-1">Synergy +1</p>
      <h2 className="text-xl font-bold">Ventas y comisiones</h2>
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

/* ── Lista ─────────────────────────────────────────────────────────────────── */

type AccionVenta = "validar" | "rechazar" | "pagar" | "pendiente";

function BotonAccion({
  titulo,
  clase,
  onClick,
  disabled,
  children,
}: {
  titulo: string;
  clase: string;
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={titulo}
      aria-label={titulo}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-xl text-base font-bold transition disabled:opacity-40 ${clase}`}
    >
      {children}
    </button>
  );
}

function AccionesFila({
  venta,
  onAccion,
  ocupada,
}: {
  venta: VentaFila;
  onAccion: (id: string, a: AccionVenta) => void;
  ocupada: boolean;
}) {
  if (venta.estado === "pendiente") {
    return (
      <div className="flex justify-end gap-1.5">
        <BotonAccion
          titulo="Validar"
          clase="bg-[#19e16d]/15 text-[#19e16d] hover:bg-[#19e16d]/25"
          onClick={() => onAccion(venta.id, "validar")}
          disabled={ocupada}
        >
          ✓
        </BotonAccion>
        <BotonAccion
          titulo="Rechazar"
          clase="bg-[#ffb2b2]/15 text-[#ffb2b2] hover:bg-[#ffb2b2]/25"
          onClick={() => onAccion(venta.id, "rechazar")}
          disabled={ocupada}
        >
          ✗
        </BotonAccion>
      </div>
    );
  }
  if (venta.estado === "validada") {
    return (
      <div className="flex justify-end gap-1.5">
        <BotonAccion
          titulo="Marcar como pagada"
          clase="bg-[#d9b45b]/15 text-[#d9b45b] hover:bg-[#d9b45b]/25"
          onClick={() => onAccion(venta.id, "pagar")}
          disabled={ocupada}
        >
          $
        </BotonAccion>
        <BotonAccion
          titulo="Rechazar"
          clase="bg-[#ffb2b2]/15 text-[#ffb2b2] hover:bg-[#ffb2b2]/25"
          onClick={() => onAccion(venta.id, "rechazar")}
          disabled={ocupada}
        >
          ✗
        </BotonAccion>
      </div>
    );
  }
  return (
    <div className="flex justify-end">
      <BotonAccion
        titulo="Regresar a pendiente"
        clase="bg-white/10 text-white/60 hover:bg-white/15"
        onClick={() => onAccion(venta.id, "pendiente")}
        disabled={ocupada}
      >
        ↩
      </BotonAccion>
    </div>
  );
}

function exportarCsv(ventas: VentaFila[]) {
  descargarCsv(
    "ventas-synergy-plus",
    construirCsv(
      ["Comprador", "Correo", "Teléfono", "Evento", "Afiliado", "Paquete", "Comisión",
       "Override", "Override para", "Moneda", "Estado", "Capturada por", "Fecha", "Notas"],
      ventas.map((v) => [
        v.comprador_nombre ?? "",
        v.comprador_email ?? "",
        v.comprador_telefono ?? "",
        v.event_name ?? "",
        v.afiliado_nombre,
        PAQUETE_LABEL[v.paquete] ?? v.paquete,
        (v.comision_cents / 100).toFixed(2),
        (v.override_cents / 100).toFixed(2),
        v.override_para_nombre ?? "",
        v.moneda,
        ESTADO_UI[v.estado]?.label ?? v.estado,
        v.capturada_por,
        v.created_at.slice(0, 10),
        v.notas ?? "",
      ]),
    ),
  );
}

interface ListaProps {
  ventas: VentaFila[];
  cargando: boolean;
  error: string | null;
  filtro: Filtro;
  onFiltro: (f: Filtro) => void;
  onAccion: (id: string, a: AccionVenta) => void;
  accionId: string | null;
}

function Lista({ ventas, cargando, error, filtro, onFiltro, onAccion, accionId }: ListaProps) {
  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTROS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => onFiltro(f)}
              className={`${CHIP_BASE} ${filtro === f ? CHIP_ON : CHIP_OFF}`}
            >
              {f === "todas" ? "Todas" : ESTADO_UI[f]?.label ?? f}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => exportarCsv(ventas)}
          disabled={ventas.length === 0}
          className="btn-ghost btn-press !min-h-[44px] !px-4 !py-2 !text-sm"
        >
          Descargar CSV
        </button>
      </div>

      {error ? <p className="mt-3 text-sm font-semibold text-[#ffb2b2]">{error}</p> : null}

      {cargando ? (
        <p className="mt-4 text-sm text-white/40">Cargando ventas…</p>
      ) : ventas.length === 0 ? (
        <div className="glass mt-4 px-6 py-8 text-center">
          <p className="text-sm text-white/55">
            {filtro === "todas"
              ? "Todavía no hay ventas capturadas — la primera se registra aquí arriba."
              : "No hay ventas en ese estado."}
          </p>
        </div>
      ) : (
        <div className="glass mt-4 overflow-x-auto !rounded-xl">
          <table className="w-full text-sm">
            <thead className="text-left text-white/45">
              <tr className="border-b border-white/10">
                <th className={TH}>Comprador</th>
                <th className={TH}>Afiliado</th>
                <th className={TH}>Paquete</th>
                <th className={TH}>Comisión</th>
                <th className={TH}>Override</th>
                <th className={TH}>Estado</th>
                <th className={TH}>Capturó</th>
                <th className={TH}>Fecha</th>
                <th className={TH} />
              </tr>
            </thead>
            <tbody>
              {ventas.map((v) => (
                <tr key={v.id} className="border-t border-white/[0.06]">
                  <td className="px-4 py-3">
                    <p className="font-semibold">{v.comprador_nombre ?? "—"}</p>
                    {v.event_name ? (
                      <p className="text-xs text-white/40">{v.event_name}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-white/70">{v.afiliado_nombre}</td>
                  <td className="px-4 py-3 text-white/70">{PAQUETE_LABEL[v.paquete] ?? v.paquete}</td>
                  <td className="px-4 py-3 tabular font-bold">
                    {dinero(v.comision_cents, v.moneda)}
                  </td>
                  <td className="px-4 py-3 tabular text-[#d9b45b]">
                    {v.override_cents > 0 ? (
                      <>
                        {dinero(v.override_cents, v.moneda)}
                        {v.override_para_nombre ? (
                          <span className="block text-xs text-white/40">
                            para {v.override_para_nombre}
                          </span>
                        ) : null}
                      </>
                    ) : (
                      <span className="text-white/30">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold ${ESTADO_UI[v.estado]?.clase ?? "bg-white/10 text-white/60"}`}
                    >
                      {ESTADO_UI[v.estado]?.label ?? v.estado}
                    </span>
                  </td>
                  <td className="max-w-[160px] truncate px-4 py-3 text-xs text-white/50">
                    {v.capturada_por}
                  </td>
                  <td className="px-4 py-3 tabular text-white/60">{fechaCorta(v.created_at)}</td>
                  <td className="px-4 py-3">
                    <AccionesFila venta={v} onAccion={onAccion} ocupada={accionId !== null} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ── Sección completa ──────────────────────────────────────────────────────── */

export default function AdminVentas({ dbListo }: { dbListo: boolean }) {
  const [ventas, setVentas] = useState<VentaFila[]>([]);
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [cargando, setCargando] = useState(true);
  const [errorLista, setErrorLista] = useState<string | null>(null);
  const [accionId, setAccionId] = useState<string | null>(null);

  const cargarVentas = useCallback(async () => {
    setCargando(true);
    try {
      const qs = filtro === "todas" ? "" : `?estado=${filtro}`;
      const r = await fetch(`/api/admin/ventas${qs}`);
      const d = (await r.json()) as { ok?: boolean; ventas?: VentaFila[]; error?: string };
      if (!r.ok || !d.ok) {
        setErrorLista(d.error ?? "No se pudo cargar la lista de ventas.");
      } else {
        setVentas(d.ventas ?? []);
        setErrorLista(null);
      }
    } catch {
      setErrorLista("Error de conexión.");
    }
    setCargando(false);
  }, [filtro]);

  useEffect(() => {
    if (dbListo) void cargarVentas();
  }, [dbListo, cargarVentas]);

  async function accion(id: string, a: AccionVenta) {
    if (accionId) return;
    setAccionId(id);
    try {
      const r = await fetch(`/api/admin/ventas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: a }),
      });
      const d = (await r.json()) as { ok?: boolean; error?: string };
      if (!r.ok || !d.ok) setErrorLista(d.error ?? "No se pudo actualizar la venta.");
      else await cargarVentas();
    } catch {
      setErrorLista("Error de conexión.");
    }
    setAccionId(null);
  }

  if (!dbListo) return <TarjetaPendienteDb />;

  return (
    <section className="mt-12">
      {/* animación propia; quien pide menos movimiento no la ve */}
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          @keyframes ventas-entrada {
            from { opacity: 0; transform: translateY(10px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .ventas-anim { animation: ventas-entrada 0.35s ease-out both; }
        }
      `}</style>
      <p className="sec-tag mb-1">Synergy +1</p>
      <h2 className="text-xl font-bold">Ventas y comisiones</h2>
      <Leyenda />
      <Capturar onCapturada={() => void cargarVentas()} />
      <Lista
        ventas={ventas}
        cargando={cargando}
        error={errorLista}
        filtro={filtro}
        onFiltro={setFiltro}
        onAccion={(id, a) => void accion(id, a)}
        accionId={accionId}
      />
    </section>
  );
}
