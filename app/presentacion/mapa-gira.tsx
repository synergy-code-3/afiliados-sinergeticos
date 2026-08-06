"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { Geografia } from "@/lib/comisiones";
import {
  VB_ANCHO,
  VB_ALTO,
  xDeLon,
  yDeLat,
  GAZETTEER,
  buscarCiudad,
  dentroDelMapa,
  acomodarEtiquetas,
  D_US,
  D_MX,
  D_ESTADOS,
  type CiudadGazetteer,
} from "@/lib/mapa-geo";
import { banderaDe } from "./gira";

/** El mapa de la gira para la PRESENTACIÓN — se proyecta en una sala.
 *
 * Misma geografía que el mapa del panel (lib/mapa-geo.ts), pero sin
 * interacción: nadie va a pasar el mouse desde la tercera fila. Los pines
 * salen de /api/eventos, verde = evento en México, dorado = en Estados
 * Unidos, con etiquetas grandes y ondas que laten. Los eventos que caen
 * fuera del recorte del mapa (Chicago, Miami…) no se pierden: aparecen
 * como fichas debajo. La lectura completa vive en una lista sr-only. */

interface EventoApi {
  id: string;
  name: string;
  date: string;
  venue: string;
  pais: Geografia;
}

type Carga =
  | { estado: "cargando" }
  | { estado: "listo"; eventos: readonly EventoApi[] }
  | { estado: "error" };

const esGeografia = (v: unknown): v is Geografia => v === "MX" || v === "US";

const leerEvento = (v: unknown): EventoApi | null => {
  if (typeof v !== "object" || v === null) return null;
  const e = v as Record<string, unknown>;
  if (
    typeof e.id !== "string" ||
    typeof e.name !== "string" ||
    typeof e.date !== "string" ||
    !esGeografia(e.pais)
  ) {
    return null;
  }
  return {
    id: e.id,
    name: e.name,
    date: e.date,
    venue: typeof e.venue === "string" ? e.venue : "",
    pais: e.pais,
  };
};

const tiempoDe = (e: EventoApi): number => {
  const t = Date.parse(e.date);
  return Number.isNaN(t) ? Number.MAX_SAFE_INTEGER : t;
};

const ciudadDeEvento = (e: EventoApi): CiudadGazetteer | null =>
  buscarCiudad(e.name) ?? (e.venue ? buscarCiudad(e.venue) : null);

const fechaCorta = (iso: string): string => {
  const f = new Date(iso);
  if (Number.isNaN(f.getTime())) return "fecha por confirmar";
  return f.toLocaleDateString("es-MX", { day: "numeric", month: "long" });
};

interface PinGira {
  ciudad: CiudadGazetteer;
  x: number;
  y: number;
  pais: Geografia;
  eventos: readonly EventoApi[];
}

interface FueraDeMapa {
  evento: EventoApi;
  ciudad: CiudadGazetteer | null;
}

function repartir(eventos: readonly EventoApi[]): {
  pines: readonly PinGira[];
  fuera: readonly FueraDeMapa[];
} {
  const clasificados = eventos.map((evento) => {
    const ciudad = ciudadDeEvento(evento);
    const enMapa = ciudad !== null && dentroDelMapa(xDeLon(ciudad.lon), yDeLat(ciudad.lat));
    return { evento, ciudad, enMapa };
  });
  const pines = GAZETTEER.flatMap((ciudad): PinGira[] => {
    const delPin = clasificados
      .filter((c) => c.enMapa && c.ciudad === ciudad)
      .map((c) => c.evento)
      .sort((a, b) => tiempoDe(a) - tiempoDe(b));
    const primero = delPin[0];
    if (!primero) return [];
    return [
      { ciudad, x: xDeLon(ciudad.lon), y: yDeLat(ciudad.lat), pais: primero.pais, eventos: delPin },
    ];
  });
  const fuera = clasificados
    .filter((c) => !c.enMapa)
    .map((c) => ({ evento: c.evento, ciudad: c.ciudad }))
    .sort((a, b) => tiempoDe(a.evento) - tiempoDe(b.evento));
  return { pines, fuera };
}

const pct = (v: number, total: number): string => `${((v / total) * 100).toFixed(2)}%`;

export default function MapaGira() {
  const [carga, setCarga] = useState<Carga>({ estado: "cargando" });

  useEffect(() => {
    let cancelado = false;
    fetch("/api/eventos")
      .then((r) => r.json())
      .then((d: { eventos?: unknown[] }) => {
        if (cancelado) return;
        const eventos = Array.isArray(d?.eventos)
          ? d.eventos.map(leerEvento).filter((e): e is EventoApi => e !== null)
          : [];
        setCarga({ estado: "listo", eventos });
      })
      .catch(() => {
        if (!cancelado) setCarga({ estado: "error" });
      });
    return () => {
      cancelado = true;
    };
  }, []);

  const { pines, fuera } = useMemo(
    () => repartir(carga.estado === "listo" ? carga.eventos : []),
    [carga],
  );
  const etiquetas = useMemo(
    () =>
      acomodarEtiquetas(
        pines.map((p) => ({ x: p.x, y: p.y, nombre: p.ciudad.nombre, etiqueta: p.ciudad.etiqueta })),
      ),
    [pines],
  );

  const totalEventos = carga.estado === "listo" ? carga.eventos.length : 0;
  const totalMX = carga.estado === "listo" ? carga.eventos.filter((e) => e.pais === "MX").length : 0;
  const totalUS = totalEventos - totalMX;
  const sinEventos = carga.estado === "error" || (carga.estado === "listo" && totalEventos === 0);

  return (
    <div className="mgi">
      <div className="mgi-marco pres-card">
        <div className="mgi-mapa">
          <svg className="mgi-svg" viewBox={`0 0 ${VB_ANCHO} ${VB_ALTO}`} aria-hidden="true">
            <defs>
              <pattern id="mgi-grid" width="64" height="64" patternUnits="userSpaceOnUse">
                <path d="M64 0H0V64" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
              </pattern>
              <linearGradient id="mgi-fade-norte" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#0e1412" stopOpacity="1" />
                <stop offset="1" stopColor="#0e1412" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="mgi-fade-este" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#0e1412" stopOpacity="0" />
                <stop offset="1" stopColor="#0e1412" stopOpacity="1" />
              </linearGradient>
            </defs>

            <rect x="0" y="0" width={VB_ANCHO} height={VB_ALTO} fill="url(#mgi-grid)" />
            <path className="mgi-pais mgi-pais-us" d={D_US} />
            <path className="mgi-pais mgi-pais-mx" d={D_MX} />
            <path className="mgi-estados" d={D_ESTADOS} />
            <rect x="0" y="36" width={VB_ANCHO} height="86" fill="url(#mgi-fade-norte)" />
            <rect x="915" y="36" width="85" height="200" fill="url(#mgi-fade-este)" />

            <text x="370" y="102" textAnchor="middle" className="mgi-pais-nombre">
              Estados Unidos
            </text>
            <text x="565" y="425" textAnchor="middle" className="mgi-pais-nombre">
              México
            </text>
          </svg>

          {pines.map((pin) => {
            const tono = pin.pais === "MX" ? "mx" : "us";
            const eti = etiquetas.get(pin.ciudad.nombre) ?? { visible: true, dy: 0 };
            return (
              <div
                key={pin.ciudad.nombre}
                className="mgi-ciudad"
                style={{ left: pct(pin.x, VB_ANCHO), top: pct(pin.y, VB_ALTO) }}
                aria-hidden="true"
              >
                <span className={`mgi-onda mgi-onda-${tono}`} />
                <span className={`mgi-onda mgi-onda-2 mgi-onda-${tono}`} />
                <span className={`mgi-punto mgi-fondo-${tono}`}>
                  {pin.eventos.length > 1 ? pin.eventos.length : ""}
                </span>
                {eti.visible ? (
                  <span
                    className={`mgi-eti mgi-eti-${pin.ciudad.etiqueta}`}
                    style={{ "--eti-dy": `${eti.dy}px` } as CSSProperties}
                  >
                    {pin.ciudad.nombre}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* Conteo por país — la leyenda que la sala sí alcanza a leer. */}
      {totalEventos > 0 ? (
        <div className="mgi-leyenda" aria-hidden="true">
          <span className="mgi-chip">
            <span className="mgi-chip-punto mgi-fondo-mx" /> 🇲🇽 México · {totalMX}{" "}
            {totalMX === 1 ? "evento" : "eventos"}
          </span>
          <span className="mgi-chip">
            <span className="mgi-chip-punto mgi-fondo-us" /> 🇺🇸 Estados Unidos · {totalUS}{" "}
            {totalUS === 1 ? "evento" : "eventos"}
          </span>
        </div>
      ) : null}

      {/* Eventos fuera del recorte del mapa: no se pierden. */}
      {fuera.length > 0 ? (
        <div className="mgi-leyenda" aria-hidden="true">
          {fuera.map(({ evento, ciudad }) => (
            <span key={evento.id} className="mgi-chip">
              {banderaDe(evento.pais)} {ciudad?.nombre ?? evento.name} ·{" "}
              {fechaCorta(evento.date)}
            </span>
          ))}
        </div>
      ) : null}

      {carga.estado === "cargando" ? (
        <p className="mgi-aviso" role="status">
          Cargando los próximos eventos…
        </p>
      ) : null}
      {sinEventos ? <p className="mgi-aviso">Muy pronto anunciamos las próximas fechas.</p> : null}

      {/* Lectura completa para lector de pantalla (el mapa es decorativo). */}
      {pines.length > 0 ? (
        <ul className="sr-only">
          {pines.map((pin) => (
            <li key={pin.ciudad.nombre}>
              {pin.ciudad.nombre}, {pin.pais === "MX" ? "México" : "Estados Unidos"}:{" "}
              {pin.eventos.map((e) => `${e.name}, ${fechaCorta(e.date)}`).join("; ")}
            </li>
          ))}
        </ul>
      ) : null}

      <style>{`
        .mgi { width: min(100%, calc((100dvh - 305px) * ${VB_ANCHO / VB_ALTO})); margin: 20px auto 0; }
        .mgi-marco { padding: 10px; }
        .mgi-mapa {
          position: relative;
          aspect-ratio: ${VB_ANCHO} / ${VB_ALTO};
          border-radius: 12px;
          overflow: hidden;
          background: color-mix(in srgb, #0e1412 92%, #000);
          box-shadow: inset 5px 5px 14px rgba(2,6,4,0.65), inset -4px -4px 10px rgba(46,66,56,0.22);
        }
        .mgi-svg { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }

        .mgi-pais { stroke-width: 1.4; stroke-linejoin: round; }
        .mgi-pais-us {
          fill: color-mix(in srgb, #d9b45b 12%, #121917);
          stroke: rgba(217,180,91,0.38);
          filter: drop-shadow(0 0 7px rgba(217,180,91,0.14));
        }
        .mgi-pais-mx {
          fill: color-mix(in srgb, #19e16d 12%, #121917);
          stroke: rgba(25,225,109,0.4);
          filter: drop-shadow(0 0 7px rgba(25,225,109,0.16));
        }
        .mgi-estados { fill: none; stroke: rgba(255,255,255,0.07); stroke-width: 1; }
        .mgi-pais-nombre {
          fill: rgba(255,255,255,0.13);
          font-size: 19px;
          font-weight: 700;
          letter-spacing: 0.42em;
          text-transform: uppercase;
        }

        .mgi-ciudad { position: absolute; width: 0; height: 0; }
        .mgi-punto {
          position: absolute;
          left: 0; top: 0;
          transform: translate(-50%, -50%);
          z-index: 2;
          width: 22px; height: 22px;
          border-radius: 999px;
          display: grid; place-items: center;
          font-size: 12px; font-weight: 800; color: #04140b;
        }
        .mgi-fondo-mx { background: #19e16d; box-shadow: 0 0 16px rgba(25,225,109,0.55); }
        .mgi-fondo-us { background: #d9b45b; box-shadow: 0 0 16px rgba(217,180,91,0.5); }

        .mgi-onda {
          position: absolute;
          left: 0; top: 0;
          width: 22px; height: 22px;
          margin: -11px 0 0 -11px;
          border-radius: 999px;
          border: 2px solid;
          opacity: 0; /* solo existe animada; sin movimiento no estorba */
          pointer-events: none;
        }
        .mgi-onda-mx { border-color: rgba(25,225,109,0.55); }
        .mgi-onda-us { border-color: rgba(217,180,91,0.5); }

        /* Etiquetas a escala de sala: más grandes que en el panel. */
        .mgi-eti {
          position: absolute;
          white-space: nowrap;
          font-size: clamp(11px, 1.15vw, 15px);
          font-weight: 700;
          letter-spacing: 0.05em;
          color: rgba(255,255,255,0.78);
          text-shadow: 0 1px 5px rgba(0,0,0,0.85);
          pointer-events: none;
        }
        .mgi-eti-arriba { bottom: 14px; left: 0; transform: translateX(-50%) translateY(var(--eti-dy, 0px)); }
        .mgi-eti-abajo  { top: 14px; left: 0; transform: translateX(-50%) translateY(var(--eti-dy, 0px)); }
        .mgi-eti-izq    { right: 16px; top: 0; transform: translateY(calc(-50% + var(--eti-dy, 0px))); }
        .mgi-eti-der    { left: 16px; top: 0; transform: translateY(calc(-50% + var(--eti-dy, 0px))); }

        .mgi-leyenda {
          display: flex; flex-wrap: wrap; justify-content: center; gap: 10px;
          margin-top: 14px;
        }
        .mgi-chip {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 8px 16px;
          border-radius: 999px;
          background: #121917;
          font-size: clamp(0.85rem, 1.4vw, 1.1rem); font-weight: 700;
          color: rgba(255,255,255,0.85);
          box-shadow: -4px -4px 10px rgba(46,66,56,0.5), 5px 5px 12px rgba(2,6,4,0.85);
        }
        .mgi-chip-punto { width: 10px; height: 10px; border-radius: 999px; flex: none; }

        .mgi-aviso {
          margin-top: 16px;
          text-align: center;
          font-size: clamp(1rem, 1.8vw, 1.4rem);
          font-weight: 600;
          color: rgba(255,255,255,0.6);
        }

        @keyframes mgi-onda {
          from { transform: scale(0.5); opacity: 0.85; }
          to   { transform: scale(2.9); opacity: 0; }
        }
        @media (prefers-reduced-motion: no-preference) {
          .mgi-onda { animation: mgi-onda 2.6s ease-out infinite; }
          .mgi-onda-2 { animation-delay: 1.3s; }
        }
      `}</style>
    </div>
  );
}
