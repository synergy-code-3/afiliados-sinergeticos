"use client";

/** El mapa de tu oportunidad — gira de agosto 2026 (Synergy +1).
 *
 * SVG dibujado a mano sobre proyección equirectangular:
 *   x = (lon + 125) * 25          →  -125°O … -85°O  ⇒  0 … 1000
 *   y = (38 - lat) * (640 / 24)   →   38°N … 14°N    ⇒  0 … 640
 * Con esa fórmula cualquier ciudad se coloca con sus coordenadas reales
 * sin re-dibujar nada. Los contornos son simplificados pero geográficos:
 * Baja California, Yucatán, el Río Bravo y las costas salen de puntos reales.
 *
 * Cero dependencias nuevas. Los montos vienen de lib/comisiones —
 * aquí no vive ningún precio.
 */

import { useEffect, useState } from "react";
import {
  COMISIONES_PAQUETE,
  PAQUETE_LABEL,
  dinero,
  monedaDe,
  type Geografia,
  type Paquete,
} from "@/lib/comisiones";

const VB_ANCHO = 1000;
const VB_ALTO = 640;

type PosEtiqueta = "arriba" | "abajo" | "izq" | "der";

interface CiudadGira {
  nombre: string;
  pais: Geografia;
  /** Coordenadas dentro del viewBox (ver fórmula del encabezado). */
  x: number;
  y: number;
  fecha: string;
  horaLocal: string;
  horaCdmx: string;
  /** De qué lado va el nombre, para que no se encimen en el racimo de Texas. */
  etiqueta: PosEtiqueta;
}

/** En orden cronológico de la gira — la caravana las recorre así. */
const CIUDADES: readonly CiudadGira[] = [
  { nombre: "Austin", pais: "US", x: 682, y: 206, fecha: "Martes 4 de agosto", horaLocal: "7:00 pm", horaCdmx: "6:00 pm", etiqueta: "arriba" },
  { nombre: "Tijuana", pais: "MX", x: 199, y: 146, fecha: "Martes 4 de agosto", horaLocal: "7:00 pm", horaCdmx: "9:00 pm", etiqueta: "izq" },
  { nombre: "Ciudad Juárez", pais: "MX", x: 463, y: 167, fecha: "Miércoles 5 de agosto", horaLocal: "6:00 pm", horaCdmx: "5:00 pm", etiqueta: "abajo" },
  { nombre: "San Antonio", pais: "US", x: 663, y: 229, fecha: "Miércoles 5 de agosto", horaLocal: "7:00 pm", horaCdmx: "6:00 pm", etiqueta: "abajo" },
  { nombre: "Houston", pais: "US", x: 741, y: 220, fecha: "Jueves 6 de agosto", horaLocal: "7:00 pm", horaCdmx: "6:00 pm", etiqueta: "der" },
  { nombre: "Dallas", pais: "US", x: 705, y: 139, fecha: "Jueves 6 de agosto", horaLocal: "9:00 pm", horaCdmx: "8:00 pm", etiqueta: "arriba" },
];

const PAQUETES: readonly Paquete[] = ["3m", "6m", "12m"];

/* ── Contornos ────────────────────────────────────────────────────────────────
 * La frontera MX–US es la MISMA polilínea en ambos países para que embonen:
 * Tijuana → San Luis Río Colorado → Nogales → El Paso/Juárez → Río Bravo →
 * Laredo → Brownsville. */

/** Sur de Estados Unidos, recortado arriba (~36.5°N) y a la derecha (~85°O):
 * costa de California, frontera, Texas completo y costa del Golfo. */
const D_US =
  "M78 40 L113 95 L170 115 L198 144 L199 146 " + // costa de California
  "L258 146 L350 178 L420 178 L420 166 L463 167 " + // frontera oeste
  "L548 235 L588 227 L638 280 L688 323 " + // Río Bravo hasta Brownsville
  "L690 272 L755 232 L825 224 L890 235 L938 205 L1000 203 " + // costa del Golfo
  "L1000 40 Z";

/** México completo: frontera, Golfo, Yucatán, Caribe, Chiapas, Pacífico,
 * Mar de Cortés y la península de Baja California hasta Los Cabos. */
const D_MX =
  "M199 146 L258 146 L350 178 L420 178 L420 166 L463 167 " + // frontera
  "L548 235 L588 227 L638 280 L688 323 " + // Río Bravo
  "L679 421 L722 501 L765 529 L830 516 L863 484 L868 453 " + // Golfo y Campeche
  "L948 437 L954 449 L939 475 L918 520 " + // Yucatán y Caribe
  "L896 539 L851 538 L818 621 " + // Belice, Guatemala, Chiapas
  "L745 581 L628 564 L570 533 L518 505 L483 469 L465 395 L428 352 L353 269 L288 179 " + // Pacífico
  "L261 168 L254 187 L288 243 L318 285 L341 320 L368 369 L378 403 " + // Mar de Cortés (lado este de Baja)
  "L360 389 L323 357 L249 271 L268 248 L240 219 L210 164 Z"; // Pacífico de Baja hasta Tijuana

/** Líneas internas que hacen reconocibles a Texas y California. */
const D_ESTADOS =
  "M463 167 L466 160 L550 160 L550 40 " + // oeste de Texas y su panhandle
  "M625 40 L625 92 L774 117 L782 173 L779 229 " + // Río Rojo y frontera con Luisiana
  "M209 40 L259 80 L258 141"; // límite este de California

/** Recorrido de la caravana, ciudad por ciudad en orden de la gira. */
const D_RUTA =
  "M682 206 C560 150 330 105 199 146 " +
  "C300 195 385 192 463 167 " +
  "C535 195 615 205 663 229 " +
  "C692 252 722 244 741 220 " +
  "C762 190 733 162 705 139";

const nombrePais = (g: Geografia): string => (g === "MX" ? "México" : "Estados Unidos");

const ariaCiudad = (c: CiudadGira): string =>
  `${c.nombre}, ${nombrePais(c.pais)}. Reunión informativa: ${c.fecha}, ` +
  `${c.horaLocal} hora local (${c.horaCdmx} hora Ciudad de México).`;

const pct = (v: number, total: number): string => `${((v / total) * 100).toFixed(2)}%`;

const RECORRIDO = CIUDADES.map((c, i) => `${i + 1} ${c.nombre}`).join(" → ");

function TarjetaComision({ g }: { g: Geografia }) {
  const moneda = monedaDe(g);
  return (
    <div className={`mco-ley ${g === "MX" ? "mco-ley-mx" : "mco-ley-us"}`}>
      <p className="mco-ley-titulo">
        <span className={`mco-ley-punto ${g === "MX" ? "mco-fondo-mx" : "mco-fondo-us"}`} aria-hidden="true" />
        Eventos en {nombrePais(g)}
      </p>
      <p className="mco-ley-sub">Comisión por persona que se une al Club</p>
      <ul className="mco-ley-lista">
        {PAQUETES.map((p) => (
          <li key={p}>
            <span>{PAQUETE_LABEL[p]}</span>
            <strong className="tabular">{dinero(COMISIONES_PAQUETE[g][p], moneda)}</strong>
          </li>
        ))}
      </ul>
      <p className="mco-ley-moneda">{moneda === "MXN" ? "Pesos mexicanos (MXN)" : "Dólares (USD)"}</p>
    </div>
  );
}

export default function MapaComisiones() {
  const [activo, setActivo] = useState<number | null>(null);

  useEffect(() => {
    if (activo === null) return;
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActivo(null);
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [activo]);

  return (
    <section className="mco mt-8" aria-labelledby="mco-titulo">
      <span className="sec-tag">La gira · Agosto 2026</span>
      <h2 id="mco-titulo" className="mt-2 text-2xl font-extrabold sm:text-3xl">
        El mapa de tu oportunidad
      </h2>
      <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-white/60">
        Seis ciudades en tres días, entre México y Estados Unidos. Toca cada punto
        para ver la fecha y la hora de la reunión informativa — y aquí mismo, lo
        que ganas por cada persona que se une al Club.
      </p>

      <div className="mco-cuerpo">
        <div className="mco-tarjeta">
          <div className="mco-mapa">
            <svg className="mco-svg" viewBox={`0 0 ${VB_ANCHO} ${VB_ALTO}`} aria-hidden="true">
              <defs>
                <pattern id="mco-grid" width="64" height="64" patternUnits="userSpaceOnUse">
                  <path d="M64 0H0V64" fill="none" stroke="rgba(255,255,255,0.035)" strokeWidth="1" />
                </pattern>
                {/* Difuminados en los bordes recortados: el continente "sigue". */}
                <linearGradient id="mco-fade-norte" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" className="mco-stop" stopOpacity="1" />
                  <stop offset="1" className="mco-stop" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="mco-fade-este" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" className="mco-stop" stopOpacity="0" />
                  <stop offset="1" className="mco-stop" stopOpacity="1" />
                </linearGradient>
              </defs>

              <rect x="0" y="0" width={VB_ANCHO} height={VB_ALTO} fill="url(#mco-grid)" />
              <path className="mco-pais mco-pais-us" d={D_US} />
              <path className="mco-pais mco-pais-mx" d={D_MX} />
              <path className="mco-estados" d={D_ESTADOS} />
              <rect x="0" y="36" width={VB_ANCHO} height="86" fill="url(#mco-fade-norte)" />
              <rect x="915" y="36" width="85" height="200" fill="url(#mco-fade-este)" />

              <text x="370" y="102" textAnchor="middle" className="mco-pais-nombre">
                Estados Unidos
              </text>
              <text x="565" y="425" textAnchor="middle" className="mco-pais-nombre">
                México
              </text>

              <path className="mco-ruta-base" d={D_RUTA} />
              <path className="mco-ruta-caravana" d={D_RUTA} />
            </svg>

            {CIUDADES.map((c, i) => {
              const abierta = activo === i;
              const tono = c.pais === "MX" ? "mx" : "us";
              return (
                <div
                  key={c.nombre}
                  className="mco-ciudad"
                  style={{ left: pct(c.x, VB_ANCHO), top: pct(c.y, VB_ALTO) }}
                >
                  <button
                    type="button"
                    className="mco-pin"
                    aria-label={ariaCiudad(c)}
                    aria-expanded={abierta}
                    onClick={() => setActivo(i)}
                    onMouseEnter={() => setActivo(i)}
                    onMouseLeave={() => setActivo((prev) => (prev === i ? null : prev))}
                    onFocus={() => setActivo(i)}
                    onBlur={() => setActivo((prev) => (prev === i ? null : prev))}
                  >
                    <span className={`mco-onda mco-onda-${tono}`} aria-hidden="true" />
                    <span className={`mco-onda mco-onda-2 mco-onda-${tono}`} aria-hidden="true" />
                    <span className={`mco-punto mco-fondo-${tono}`} aria-hidden="true">
                      {i + 1}
                    </span>
                    <span className={`mco-eti mco-eti-${c.etiqueta}`} aria-hidden="true">
                      {c.nombre}
                    </span>
                  </button>

                  {/* El botón ya dice todo esto en su aria-label. */}
                  <div className={`mco-tooltip${abierta ? " es-visible" : ""}`} aria-hidden="true">
                    <p className="mco-tt-ciudad">
                      {c.nombre} · {nombrePais(c.pais)}
                    </p>
                    <p className="mco-tt-fecha">{c.fecha}</p>
                    <p className="mco-tt-horas">
                      {c.horaLocal} hora local · {c.horaCdmx} CDMX
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mco-leyendas">
          <TarjetaComision g="MX" />
          <TarjetaComision g="US" />
        </div>
      </div>

      {/* En pantallas chicas los pines quedan muy juntos en Texas:
          estas fichas son el camino cómodo con el pulgar. */}
      <div className="mco-chips">
        {CIUDADES.map((c, i) => (
          <button
            key={c.nombre}
            type="button"
            className={`mco-chip${activo === i ? " es-activa" : ""}`}
            aria-label={ariaCiudad(c)}
            aria-expanded={activo === i}
            onClick={() => setActivo((prev) => (prev === i ? null : i))}
          >
            <span
              className={`mco-chip-punto ${c.pais === "MX" ? "mco-fondo-mx" : "mco-fondo-us"}`}
              aria-hidden="true"
            />
            {i + 1} · {c.nombre}
          </button>
        ))}
      </div>

      <p className="mt-3 text-xs leading-relaxed text-white/40">
        La línea punteada marca el recorrido de la gira: {RECORRIDO}.
      </p>

      {/* Panel fijo inferior: el "tooltip" de teléfono. El envoltorio con
          aria-live existe siempre para que el lector de pantalla anuncie. */}
      <div aria-live="polite">
        {activo !== null ? (
          <div className="mco-panel">
            <span
              className={`mco-punto mco-punto-panel ${CIUDADES[activo].pais === "MX" ? "mco-fondo-mx" : "mco-fondo-us"}`}
              aria-hidden="true"
            >
              {activo + 1}
            </span>
            <div className="mco-panel-info">
              <p className="mco-tt-ciudad">
                {CIUDADES[activo].nombre} · {nombrePais(CIUDADES[activo].pais)}
              </p>
              <p className="mco-tt-fecha">{CIUDADES[activo].fecha}</p>
              <p className="mco-tt-horas">
                {CIUDADES[activo].horaLocal} hora local · {CIUDADES[activo].horaCdmx} CDMX
              </p>
            </div>
            <button type="button" className="mco-panel-cerrar" onClick={() => setActivo(null)}>
              Cerrar
            </button>
          </div>
        ) : null}
      </div>

      <style>{`
        .mco-cuerpo { position: relative; margin-top: 20px; }

        .mco-tarjeta {
          position: relative;
          padding: 10px;
          border-radius: var(--radius, 18px);
          background: var(--bg, #0e1412);
          box-shadow:
            -6px -6px 14px var(--neu-luz, rgba(46, 66, 56, 0.55)),
            8px 8px 18px var(--neu-sombra, rgba(2, 6, 4, 0.85));
        }
        /* La ventana del mapa va hundida (inset), como campo neumórfico. */
        .mco-mapa {
          position: relative;
          aspect-ratio: ${VB_ANCHO} / ${VB_ALTO};
          border-radius: 12px;
          overflow: hidden;
          background: var(--bg, #0e1412);
          background: color-mix(in srgb, var(--bg, #0e1412) 92%, #000);
        }
        .mco-mapa::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 12px;
          pointer-events: none;
          z-index: 6;
          box-shadow:
            inset 5px 5px 14px rgba(2, 6, 4, 0.65),
            inset -4px -4px 10px rgba(46, 66, 56, 0.22);
        }
        .mco-svg { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
        .mco-stop { stop-color: var(--bg, #0e1412); }

        .mco-pais { stroke-width: 1.4; stroke-linejoin: round; }
        .mco-pais-us {
          fill: var(--surface, #121917);
          fill: color-mix(in srgb, var(--oro, #d9b45b) 12%, var(--surface, #121917));
          stroke: rgba(217, 180, 91, 0.38);
          filter: drop-shadow(0 0 7px rgba(217, 180, 91, 0.14));
        }
        .mco-pais-mx {
          fill: var(--surface, #121917);
          fill: color-mix(in srgb, var(--accent, #19e16d) 12%, var(--surface, #121917));
          stroke: rgba(25, 225, 109, 0.4);
          filter: drop-shadow(0 0 7px rgba(25, 225, 109, 0.16));
        }
        .mco-estados { fill: none; stroke: rgba(255, 255, 255, 0.07); stroke-width: 1; }
        .mco-pais-nombre {
          fill: rgba(255, 255, 255, 0.13);
          font-size: 19px;
          font-weight: 700;
          letter-spacing: 0.42em;
          text-transform: uppercase;
        }

        .mco-ruta-base { fill: none; stroke: rgba(25, 225, 109, 0.13); stroke-width: 5; stroke-linecap: round; }
        .mco-ruta-caravana {
          fill: none;
          stroke: var(--accent, #19e16d);
          stroke-width: 2.25;
          stroke-linecap: round;
          stroke-dasharray: 4 12;
          opacity: 0.9;
        }

        /* ── Pines ── */
        .mco-ciudad { position: absolute; width: 0; height: 0; }
        .mco-pin {
          position: absolute;
          left: 0;
          top: 0;
          transform: translate(-50%, -50%);
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
          padding: 0;
          border: 0;
          background: transparent;
          cursor: pointer;
          z-index: 10;
        }
        .mco-punto {
          position: relative;
          z-index: 2;
          width: 20px;
          height: 20px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          font-size: 11px;
          font-weight: 800;
          color: #04140b;
          transition: transform 0.2s ease;
        }
        .mco-pin:hover .mco-punto,
        .mco-pin:focus-visible .mco-punto { transform: scale(1.2); }
        .mco-fondo-mx { background: var(--accent, #19e16d); box-shadow: 0 0 14px rgba(25, 225, 109, 0.5); }
        .mco-fondo-us { background: var(--oro, #d9b45b); box-shadow: 0 0 14px rgba(217, 180, 91, 0.45); }

        .mco-onda {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 20px;
          height: 20px;
          margin: -10px 0 0 -10px;
          border-radius: 999px;
          border: 2px solid;
          opacity: 0; /* solo existe animada; sin movimiento no estorba */
          pointer-events: none;
        }
        .mco-onda-mx { border-color: rgba(25, 225, 109, 0.55); }
        .mco-onda-us { border-color: rgba(217, 180, 91, 0.5); }

        .mco-eti {
          position: absolute;
          white-space: nowrap;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
          color: rgba(255, 255, 255, 0.62);
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.8);
          pointer-events: none;
        }
        .mco-eti-arriba { bottom: 36px; left: 50%; transform: translateX(-50%); }
        .mco-eti-abajo  { top: 36px; left: 50%; transform: translateX(-50%); }
        .mco-eti-izq    { right: 38px; top: 50%; transform: translateY(-50%); }
        .mco-eti-der    { left: 38px; top: 50%; transform: translateY(-50%); }

        /* ── Tooltip (pantallas medianas en adelante) ── */
        .mco-tooltip {
          position: absolute;
          left: 0;
          top: 30px;
          transform: translateX(-50%) translateY(4px);
          width: 232px;
          background: var(--surface, #121917);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 14px;
          padding: 13px 15px;
          box-shadow:
            -5px -5px 12px var(--neu-luz, rgba(46, 66, 56, 0.45)),
            7px 7px 16px var(--neu-sombra, rgba(2, 6, 4, 0.85));
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.18s ease, transform 0.18s ease, visibility 0.18s;
          z-index: 40;
          pointer-events: none;
        }
        .mco-tooltip.es-visible { opacity: 1; visibility: visible; transform: translateX(-50%) translateY(0); }
        .mco-tt-ciudad { font-size: 15px; font-weight: 800; }
        .mco-tt-fecha { margin-top: 4px; font-size: 13px; color: rgba(255, 255, 255, 0.75); }
        .mco-tt-horas { margin-top: 2px; font-size: 13px; color: rgba(255, 255, 255, 0.55); }

        /* ── Tarjetas de comisión ── */
        .mco-leyendas { display: grid; gap: 12px; margin-top: 14px; }
        .mco-ley {
          background: var(--surface, #121917);
          border-radius: var(--radius, 18px);
          padding: 18px 20px;
          box-shadow:
            -6px -6px 14px var(--neu-luz, rgba(46, 66, 56, 0.55)),
            8px 8px 18px var(--neu-sombra, rgba(2, 6, 4, 0.85));
        }
        .mco-ley-titulo {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .mco-ley-punto { width: 10px; height: 10px; border-radius: 999px; flex: none; }
        .mco-ley-sub { margin-top: 6px; font-size: 13px; color: rgba(255, 255, 255, 0.6); }
        .mco-ley-lista { margin-top: 10px; display: grid; gap: 6px; }
        .mco-ley-lista li {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.78);
        }
        .mco-ley-lista strong { font-size: 15px; font-weight: 800; }
        .mco-ley-mx strong { color: var(--accent, #19e16d); }
        .mco-ley-us strong { color: var(--oro, #d9b45b); }
        .mco-ley-moneda {
          margin-top: 10px;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.4);
        }

        /* ── Fichas de ciudad (solo móvil) ── */
        .mco-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
        .mco-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 44px;
          padding: 10px 14px;
          border: 0;
          border-radius: 12px;
          cursor: pointer;
          background: var(--surface, #121917);
          color: rgba(255, 255, 255, 0.85);
          font-size: 14px;
          font-weight: 600;
          box-shadow:
            -4px -4px 10px var(--neu-luz, rgba(46, 66, 56, 0.5)),
            5px 5px 12px var(--neu-sombra, rgba(2, 6, 4, 0.85));
        }
        .mco-chip.es-activa {
          color: #fff;
          box-shadow:
            inset 4px 4px 10px rgba(2, 6, 4, 0.75),
            inset -3px -3px 8px rgba(46, 66, 56, 0.35);
        }
        .mco-chip-punto { width: 9px; height: 9px; border-radius: 999px; flex: none; }

        /* ── Panel fijo inferior (el tooltip del teléfono) ── */
        .mco-panel { display: none; }
        .mco-punto-panel { width: 30px; height: 30px; font-size: 13px; flex: none; }
        .mco-panel-info { flex: 1; min-width: 0; }
        .mco-panel-cerrar {
          flex: none;
          min-height: 44px;
          padding: 0 16px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 12px;
          background: transparent;
          color: rgba(255, 255, 255, 0.85);
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
        }

        @media (max-width: 639px) {
          .mco-tooltip { display: none; }
          .mco-eti { display: none; }
          .mco-panel {
            display: flex;
            align-items: center;
            gap: 12px;
            position: fixed;
            left: 12px;
            right: 12px;
            bottom: 12px;
            z-index: 70;
            padding: 14px 14px 14px 18px;
            background: var(--surface, #121917);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: var(--radius, 18px);
            box-shadow:
              -6px -6px 14px var(--neu-luz, rgba(46, 66, 56, 0.45)),
              8px 8px 20px var(--neu-sombra, rgba(2, 6, 4, 0.9));
          }
        }

        @media (min-width: 640px) {
          .mco-chips { display: none; }
          .mco-leyendas { grid-template-columns: 1fr 1fr; }
        }

        /* En grande, las tarjetas flotan sobre los océanos del mapa. */
        @media (min-width: 1024px) {
          .mco-leyendas { margin-top: 0; }
          .mco-ley { position: absolute; width: 260px; z-index: 20; }
          .mco-ley-mx { left: 22px; bottom: 22px; }
          .mco-ley-us { right: 22px; top: 22px; }
        }

        @keyframes mco-onda {
          from { transform: scale(0.5); opacity: 0.85; }
          to   { transform: scale(2.7); opacity: 0; }
        }
        /* -160 es múltiplo del periodo del guion (4+12): el ciclo no brinca. */
        @keyframes mco-caravana { to { stroke-dashoffset: -160; } }
        @keyframes mco-sube {
          from { transform: translateY(14px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }

        /* El movimiento solo existe para quien no pidió reducirlo:
           sin animación las ondas quedan invisibles y la caravana, quieta. */
        @media (prefers-reduced-motion: no-preference) {
          .mco-onda { animation: mco-onda 2.6s ease-out infinite; }
          .mco-onda-2 { animation-delay: 1.3s; }
          .mco-ruta-caravana { animation: mco-caravana 10s linear infinite; }
          .mco-panel { animation: mco-sube 0.28s cubic-bezier(0.16, 1, 0.3, 1) both; }
        }
      `}</style>
    </section>
  );
}
