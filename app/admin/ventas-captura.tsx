"use client";

import { useEffect, useState } from "react";
import {
  PAQUETE_LABEL,
  comisionPaqueteCents,
  dinero,
  monedaDe,
  overrideCents,
  type Geografia,
  type Paquete,
} from "@/lib/comisiones";

/**
 * Captura de una venta Synergy +1 — la mitad "capturar" de la sección
 * Ventas y comisiones (app/admin/ventas.tsx la monta; no se usa sola).
 *
 * Dos caminos: desde una inscripción del portal (buscando al comprador por
 * correo o teléfono) o captura libre (eligiendo al afiliado por nombre y
 * escribiendo los datos del comprador a mano).
 */

export interface AfiliadoBusqueda {
  id: string;
  nombre: string;
  referido_por: string | null;
  referidor_nombre: string | null;
}

export interface ResultadoBusqueda {
  inscripcion_id: string;
  nombre: string;
  email: string;
  telefono: string;
  event_name: string;
  event_tk_id: string;
  pais: string;
  created_at: string;
  ya_capturada: boolean;
  afiliado: AfiliadoBusqueda;
}

interface Proyeccion {
  afiliado_nombre: string;
  moneda: "MXN" | "USD";
  inscritos_con_boleto: number;
  tasa_cierre: number;
  tasa_por_defecto: boolean;
  comision_promedio_cents: number;
  proyeccion_cents: number;
}

const GEOGRAFIAS: Geografia[] = ["MX", "US"];
const PAQUETES: Paquete[] = ["3m", "6m", "12m"];
const GEO_LABEL: Record<Geografia, string> = { MX: "México · MXN", US: "EE. UU. · USD" };

export const CHIP_BASE =
  "min-h-[44px] rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:opacity-50";
export const CHIP_ON = "bg-[#19e16d] text-[#04140b]";
export const CHIP_OFF = "bg-white/10 text-white/60 hover:bg-white/15";

/** Utilidad proyectada del afiliado elegido — es una proyección, no una promesa. */
function TarjetaProyeccion({ afiliado }: { afiliado: AfiliadoBusqueda }) {
  const [p, setP] = useState<Proyeccion | null>(null);
  const [fallo, setFallo] = useState(false);

  useEffect(() => {
    let vivo = true;
    setP(null);
    setFallo(false);
    fetch(`/api/admin/ventas?proyeccion=${encodeURIComponent(afiliado.id)}`)
      .then((r) => r.json())
      .then((d: { ok?: boolean; proyeccion?: Proyeccion }) => {
        if (!vivo) return;
        if (d.ok && d.proyeccion) setP(d.proyeccion);
        else setFallo(true);
      })
      .catch(() => {
        if (vivo) setFallo(true);
      });
    return () => {
      vivo = false;
    };
  }, [afiliado.id]);

  if (fallo) return null;
  return (
    <div className="ventas-anim glass mt-4 px-5 py-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#d9b45b]">
        Proyección
      </p>
      {p ? (
        <>
          <p className="mt-1 text-2xl font-extrabold tabular">
            {dinero(p.proyeccion_cents, p.moneda)}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-white/55">
            {p.inscritos_con_boleto} inscritos con boleto × {Math.round(p.tasa_cierre * 100)}% de
            cierre × {dinero(p.comision_promedio_cents, p.moneda)} de comisión promedio — lo que{" "}
            {p.afiliado_nombre} puede generar.
          </p>
          {p.tasa_por_defecto ? (
            <p className="mt-1 text-xs text-white/40">
              Aún no hay historial de cierres — usamos 30% como referencia.
            </p>
          ) : null}
        </>
      ) : (
        <p className="mt-1 text-sm text-white/40">Calculando…</p>
      )}
    </div>
  );
}

type Modo = "inscripcion" | "libre";

export default function Capturar({ onCapturada }: { onCapturada: () => void }) {
  const [modo, setModo] = useState<Modo>("inscripcion");

  // búsqueda del comprador (por inscripción)
  const [q, setQ] = useState("");
  const [resultados, setResultados] = useState<ResultadoBusqueda[]>([]);
  const [buscando, setBuscando] = useState(false);

  // búsqueda de afiliado (captura libre)
  const [qAfiliado, setQAfiliado] = useState("");
  const [afiliados, setAfiliados] = useState<AfiliadoBusqueda[]>([]);

  const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null);

  // selección + formulario
  const [seleccion, setSeleccion] = useState<ResultadoBusqueda | null>(null);
  const [afiliadoSel, setAfiliadoSel] = useState<AfiliadoBusqueda | null>(null);
  const [geografia, setGeografia] = useState<Geografia>("MX");
  const [paquete, setPaquete] = useState<Paquete>("12m");
  const [notas, setNotas] = useState("");
  const [compradorNombre, setCompradorNombre] = useState("");
  const [compradorEmail, setCompradorEmail] = useState("");
  const [compradorTelefono, setCompradorTelefono] = useState("");
  const [eventoNombre, setEventoNombre] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  // buscar inscripciones por correo o teléfono, con respiro de 350 ms
  useEffect(() => {
    const texto = q.trim();
    if (modo !== "inscripcion" || texto.length < 3) {
      setResultados([]);
      return;
    }
    const timer = setTimeout(async () => {
      setBuscando(true);
      setErrorBusqueda(null);
      try {
        const r = await fetch(`/api/admin/buscar?q=${encodeURIComponent(texto)}`);
        const d = (await r.json()) as { resultados?: ResultadoBusqueda[]; error?: string };
        if (!r.ok || d.error) setErrorBusqueda(d.error ?? "No se pudo buscar.");
        else setResultados(d.resultados ?? []);
      } catch {
        setErrorBusqueda("Error de conexión.");
      }
      setBuscando(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [q, modo]);

  // buscar afiliados por nombre (captura libre)
  useEffect(() => {
    const texto = qAfiliado.trim();
    if (modo !== "libre" || texto.length < 2) {
      setAfiliados([]);
      return;
    }
    const timer = setTimeout(async () => {
      setBuscando(true);
      setErrorBusqueda(null);
      try {
        const r = await fetch(`/api/admin/buscar?afiliado=${encodeURIComponent(texto)}`);
        const d = (await r.json()) as { afiliados?: AfiliadoBusqueda[]; error?: string };
        if (!r.ok || d.error) setErrorBusqueda(d.error ?? "No se pudo buscar.");
        else setAfiliados(d.afiliados ?? []);
      } catch {
        setErrorBusqueda("Error de conexión.");
      }
      setBuscando(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [qAfiliado, modo]);

  function cambiarModo(nuevo: Modo) {
    setModo(nuevo);
    setSeleccion(null);
    setAfiliadoSel(null);
    setErrorForm(null);
    setErrorBusqueda(null);
  }

  function elegirInscripcion(r: ResultadoBusqueda) {
    setSeleccion(r);
    setGeografia(r.pais === "US" ? "US" : "MX");
    setExito(null);
    setErrorForm(null);
  }

  function elegirAfiliado(a: AfiliadoBusqueda) {
    setAfiliadoSel(a);
    setExito(null);
    setErrorForm(null);
  }

  function limpiarFormulario() {
    setSeleccion(null);
    setAfiliadoSel(null);
    setNotas("");
    setCompradorNombre("");
    setCompradorEmail("");
    setCompradorTelefono("");
    setEventoNombre("");
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (guardando) return;
    const esLibre = modo === "libre";
    if (esLibre && !afiliadoSel) {
      setErrorForm("Primero elige al afiliado que hizo la venta.");
      return;
    }
    if (esLibre && !compradorNombre.trim()) {
      setErrorForm("Escribe el nombre del comprador.");
      return;
    }
    const body = esLibre
      ? {
          afiliado_id: afiliadoSel?.id,
          comprador_nombre: compradorNombre.trim(),
          comprador_email: compradorEmail.trim() || undefined,
          comprador_telefono: compradorTelefono.trim() || undefined,
          event_name: eventoNombre.trim() || undefined,
          geografia,
          paquete,
          notas: notas.trim() || undefined,
        }
      : {
          inscripcion_id: seleccion?.inscripcion_id,
          afiliado_id: seleccion?.afiliado.id,
          comprador_nombre: seleccion?.nombre,
          geografia,
          paquete,
          notas: notas.trim() || undefined,
        };

    setGuardando(true);
    setErrorForm(null);
    try {
      const r = await fetch("/api/admin/ventas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = (await r.json()) as {
        ok?: boolean;
        error?: string;
        afiliado_nombre?: string;
        override_para_nombre?: string | null;
        venta?: { comision_cents: number; override_cents: number; moneda: "MXN" | "USD" };
      };
      if (!r.ok || !d.ok || !d.venta) {
        setErrorForm(d.error ?? "No se pudo guardar la venta.");
      } else {
        const base = `Venta guardada: ${dinero(d.venta.comision_cents, d.venta.moneda)} de comisión para ${d.afiliado_nombre}.`;
        const extra =
          d.venta.override_cents > 0 && d.override_para_nombre
            ? ` ${d.override_para_nombre} +${dinero(d.venta.override_cents, d.venta.moneda)} de override.`
            : "";
        setExito(base + extra);
        limpiarFormulario();
        onCapturada();
      }
    } catch {
      setErrorForm("Error de conexión.");
    }
    setGuardando(false);
  }

  const afiliadoActivo = modo === "libre" ? afiliadoSel : (seleccion?.afiliado ?? null);
  const formListo = modo === "libre" ? afiliadoSel !== null : seleccion !== null;
  const sinResultados =
    modo === "inscripcion" &&
    !seleccion &&
    !buscando &&
    q.trim().length >= 3 &&
    resultados.length === 0 &&
    !errorBusqueda;

  return (
    <div className="glass mt-6 p-5 sm:p-6">
      <h3 className="text-base font-bold">Capturar una venta</h3>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => cambiarModo("inscripcion")}
          className={`${CHIP_BASE} ${modo === "inscripcion" ? CHIP_ON : CHIP_OFF}`}
        >
          Desde una inscripción
        </button>
        <button
          type="button"
          onClick={() => cambiarModo("libre")}
          className={`${CHIP_BASE} ${modo === "libre" ? CHIP_ON : CHIP_OFF}`}
        >
          Captura libre
        </button>
      </div>

      {modo === "inscripcion" ? (
        <div className="mt-4">
          <label className="label" htmlFor="buscar-comprador">
            ¿Quién compró?
          </label>
          <input
            id="buscar-comprador"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Correo o teléfono del comprador…"
            className="field !py-4 !text-lg"
            autoComplete="off"
          />
        </div>
      ) : (
        <div className="mt-4">
          <label className="label" htmlFor="buscar-afiliado">
            ¿Qué afiliado hizo la venta?
          </label>
          <input
            id="buscar-afiliado"
            value={qAfiliado}
            onChange={(e) => setQAfiliado(e.target.value)}
            placeholder="Nombre del afiliado…"
            className="field !py-4 !text-lg"
            autoComplete="off"
          />
        </div>
      )}

      {buscando ? <p className="mt-3 text-sm text-white/40">Buscando…</p> : null}
      {errorBusqueda ? (
        <p className="mt-3 text-sm font-semibold text-[#ffb2b2]">{errorBusqueda}</p>
      ) : null}

      {/* resultados: inscripciones */}
      {modo === "inscripcion" && !seleccion && resultados.length > 0 ? (
        <div className="mt-4 space-y-3">
          {resultados.map((r) => (
            <button
              key={r.inscripcion_id}
              type="button"
              onClick={() => elegirInscripcion(r)}
              disabled={r.ya_capturada}
              className="ventas-anim glass block w-full !rounded-xl px-4 py-3.5 text-left transition hover:border-[#19e16d]/40 disabled:opacity-60"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-bold">{r.nombre}</p>
                  <p className="mt-0.5 text-sm text-white/55">
                    {r.telefono}
                    {r.email ? ` · ${r.email}` : ""}
                  </p>
                  <p className="mt-0.5 text-sm text-white/55">
                    {r.event_name || "Evento sin nombre"} ·{" "}
                    {r.pais === "US" ? "EE. UU." : "México"}
                  </p>
                  <p className="mt-0.5 text-sm">
                    Lo trajo{" "}
                    <span className="font-semibold text-[#19e16d]">{r.afiliado.nombre}</span>
                  </p>
                </div>
                {r.ya_capturada ? (
                  <span className="rounded-lg bg-[#d9b45b]/15 px-2.5 py-1 text-xs font-bold text-[#d9b45b]">
                    Ya capturada
                  </span>
                ) : (
                  <span className="text-sm font-bold text-[#19e16d]">Capturar →</span>
                )}
              </div>
            </button>
          ))}
        </div>
      ) : null}
      {sinResultados ? (
        <p className="mt-3 text-sm text-white/40">
          No encontramos inscripciones con ese dato. Prueba la captura libre.
        </p>
      ) : null}

      {/* resultados: afiliados (captura libre) */}
      {modo === "libre" && !afiliadoSel && afiliados.length > 0 ? (
        <div className="mt-4 space-y-3">
          {afiliados.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => elegirAfiliado(a)}
              className="ventas-anim glass block w-full !rounded-xl px-4 py-3.5 text-left transition hover:border-[#19e16d]/40"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-bold">{a.nombre}</p>
                  {a.referidor_nombre ? (
                    <p className="mt-0.5 text-sm text-white/55">
                      Su +1 líder: {a.referidor_nombre}
                    </p>
                  ) : null}
                </div>
                <span className="text-sm font-bold text-[#19e16d]">Elegir →</span>
              </div>
            </button>
          ))}
        </div>
      ) : null}

      {/* selección elegida */}
      {seleccion ? (
        <div className="ventas-anim mt-4 rounded-xl border border-[#19e16d]/30 bg-[#19e16d]/[0.06] px-4 py-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-bold">{seleccion.nombre}</p>
              <p className="mt-0.5 text-sm text-white/55">
                {seleccion.event_name || "Evento sin nombre"} · lo trajo{" "}
                {seleccion.afiliado.nombre}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSeleccion(null)}
              className="min-h-[44px] rounded-lg bg-white/10 px-4 text-sm font-bold text-white/60 transition hover:bg-white/15"
            >
              Cambiar
            </button>
          </div>
        </div>
      ) : null}
      {modo === "libre" && afiliadoSel ? (
        <div className="ventas-anim mt-4 rounded-xl border border-[#19e16d]/30 bg-[#19e16d]/[0.06] px-4 py-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-bold">
              Venta de <span className="text-[#19e16d]">{afiliadoSel.nombre}</span>
            </p>
            <button
              type="button"
              onClick={() => setAfiliadoSel(null)}
              className="min-h-[44px] rounded-lg bg-white/10 px-4 text-sm font-bold text-white/60 transition hover:bg-white/15"
            >
              Cambiar
            </button>
          </div>
        </div>
      ) : null}

      {afiliadoActivo ? <TarjetaProyeccion afiliado={afiliadoActivo} /> : null}

      {/* formulario de captura */}
      {formListo ? (
        <form onSubmit={guardar} className="mt-5 space-y-4">
          {modo === "libre" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Nombre del comprador</label>
                <input
                  value={compradorNombre}
                  onChange={(e) => setCompradorNombre(e.target.value)}
                  placeholder="Nombre y apellido"
                  className="field"
                />
              </div>
              <div>
                <label className="label">Evento · opcional</label>
                <input
                  value={eventoNombre}
                  onChange={(e) => setEventoNombre(e.target.value)}
                  placeholder="Ej. Seminario Dallas"
                  className="field"
                />
              </div>
              <div>
                <label className="label">Correo · opcional</label>
                <input
                  value={compradorEmail}
                  onChange={(e) => setCompradorEmail(e.target.value)}
                  type="email"
                  placeholder="correo@ejemplo.com"
                  className="field"
                />
              </div>
              <div>
                <label className="label">WhatsApp · opcional</label>
                <input
                  value={compradorTelefono}
                  onChange={(e) => setCompradorTelefono(e.target.value)}
                  placeholder="+52 33 1234 5678"
                  className="field"
                />
              </div>
            </div>
          ) : null}

          <div>
            <span className="label">Geografía del evento</span>
            {seleccion ? (
              // Con inscripción, la geografía LA DEFINE EL EVENTO del referido
              // (regla de Manuel: nadie la decide a mano) — el servidor también
              // la impone, esto solo evita ofrecer una palanca falsa.
              <p className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold">
                {GEO_LABEL[geografia]}
                <span className="font-normal text-white/45">· la define el evento del referido</span>
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {GEOGRAFIAS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGeografia(g)}
                    className={`${CHIP_BASE} ${geografia === g ? CHIP_ON : CHIP_OFF}`}
                  >
                    {GEO_LABEL[g]}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <span className="label">Paquete del Club</span>
            <div className="flex flex-wrap gap-2">
              {PAQUETES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPaquete(p)}
                  className={`${CHIP_BASE} ${paquete === p ? CHIP_ON : CHIP_OFF}`}
                >
                  {PAQUETE_LABEL[p]} ·{" "}
                  {dinero(comisionPaqueteCents(geografia, p), monedaDe(geografia))}
                </button>
              ))}
            </div>
            {afiliadoActivo?.referido_por && afiliadoActivo.referidor_nombre ? (
              <p className="mt-2 text-sm text-[#d9b45b]">
                {afiliadoActivo.referidor_nombre} ganaría +
                {dinero(overrideCents(comisionPaqueteCents(geografia, paquete)), monedaDe(geografia))}{" "}
                de override por ser su +1 líder.
              </p>
            ) : null}
          </div>

          <div>
            <label className="label">Notas · opcional</label>
            <input
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej. pagó en 3 parcialidades"
              className="field"
            />
          </div>

          {errorForm ? (
            <p className="text-sm font-semibold text-[#ffb2b2]">{errorForm}</p>
          ) : null}
          <button disabled={guardando} className="btn-cta btn-press">
            {guardando ? "Guardando…" : "Guardar venta"}
          </button>
        </form>
      ) : null}

      {exito ? (
        <p className="ventas-anim mt-4 rounded-xl border border-[#19e16d]/30 bg-[#19e16d]/[0.08] px-4 py-3 text-sm font-semibold text-[#19e16d]">
          ✓ {exito}
        </p>
      ) : null}
    </div>
  );
}
