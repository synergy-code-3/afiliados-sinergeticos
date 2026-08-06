"use client";

/** El mapa de tu oportunidad — eventos abiertos, en vivo (Synergy +1).
 *
 * La geografía (proyección, gazetteer, contornos y el acomodo determinístico
 * de etiquetas) vive en lib/mapa-geo.ts, compartida con el mapa de la
 * presentación. Este componente solo clasifica eventos y pinta.
 *
 * Los pines ya NO son fijos: vienen de /api/eventos (eventos activos futuros
 * con boleto de cortesía, mismo endpoint que usa el formulario de invitados).
 * Cada evento se ubica buscando su ciudad en el GAZETTEER local. Si la ciudad
 * no se reconoce — o cae fuera del recorte del mapa (38°N / 85°O), como
 * Chicago, Miami o Nueva York — el evento no se pierde: aparece como ficha
 * bajo el mapa.
 *
 * Orden a prueba de fallas: los eventos de cada ciudad van por fecha
 * ascendente, y las listas bajo el mapa (fichas de ciudad y eventos fuera
 * del recorte) van primero México y luego Estados Unidos, por fecha. Las
 * etiquetas de ciudad se acomodan solas: lado fijo por ciudad, empujón
 * vertical determinístico si dos quedarían a menos de 16px, y en racimos
 * densos (3+ ciudades juntas) solo se ve el punto con su conteo — el nombre
 * vive en el tooltip y en la ficha.
 *
 * Cero dependencias nuevas. Los montos vienen de lib/comisiones —
 * aquí no vive ningún precio.
 */

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  COMISIONES_PAQUETE,
  PAQUETE_LABEL,
  dinero,
  monedaDe,
  type Geografia,
  type Paquete,
} from "@/lib/comisiones";
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

/** Lo que devuelve /api/eventos (el `pais` ya viene resuelto por evento). */
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

const PAQUETES: readonly Paquete[] = ["3m", "6m", "12m"];

/* ── Orden a prueba de fallas ────────────────────────────────────────────────
 * Dentro de cada ciudad (tooltip y panel) los eventos van por fecha
 * ascendente. Las fichas de ciudad y los eventos fuera del recorte van
 * primero México y luego Estados Unidos, y dentro por fecha. El nombre
 * desempata: mismos datos, mismo orden, siempre. */

const tiempoDe = (e: EventoApi): number => {
  const t = Date.parse(e.date);
  return Number.isNaN(t) ? Number.MAX_SAFE_INTEGER : t;
};

const porFecha = (a: EventoApi, b: EventoApi): number =>
  tiempoDe(a) - tiempoDe(b) || a.name.localeCompare(b.name);

/** Aquí no hay usuario con región: primero México, luego Estados Unidos. */
const ordenPais = (g: Geografia): number => (g === "MX" ? 0 : 1);

/** El nombre del evento manda ("SEED Tijuana"); el venue es el respaldo. */
const ciudadDeEvento = (e: EventoApi): CiudadGazetteer | null =>
  buscarCiudad(e.name) ?? (e.venue ? buscarCiudad(e.venue) : null);


/* ── Reparto: pines agrupados por ciudad + fichas para el resto ── */

interface Pin {
  ciudad: CiudadGazetteer;
  x: number;
  y: number;
  pais: Geografia;
  eventos: readonly EventoApi[];
}

interface Suelto {
  evento: EventoApi;
  /** true → sin ciudad reconocida ("ubicación por confirmar"). */
  sinCiudad: boolean;
}

/** Fecha del evento más próximo del pin (sus eventos ya van por fecha). */
const primeraFecha = (p: Pin): number => {
  const primero = p.eventos[0];
  return primero ? tiempoDe(primero) : Number.MAX_SAFE_INTEGER;
};

function repartir(eventos: readonly EventoApi[]): {
  pines: readonly Pin[];
  sueltos: readonly Suelto[];
} {
  const clasificados = eventos.map((evento) => {
    const ciudad = ciudadDeEvento(evento);
    const enMapa = ciudad !== null && dentroDelMapa(xDeLon(ciudad.lon), yDeLat(ciudad.lat));
    return { evento, ciudad, enMapa };
  });
  const pines = GAZETTEER.flatMap((ciudad): Pin[] => {
    const delPin = clasificados
      .filter((c) => c.enMapa && c.ciudad === ciudad)
      .map((c) => c.evento)
      .sort(porFecha);
    const primero = delPin[0];
    if (!primero) return [];
    return [
      { ciudad, x: xDeLon(ciudad.lon), y: yDeLat(ciudad.lat), pais: primero.pais, eventos: delPin },
    ];
  }).sort(
    (a, b) =>
      ordenPais(a.pais) - ordenPais(b.pais) ||
      primeraFecha(a) - primeraFecha(b) ||
      a.ciudad.nombre.localeCompare(b.ciudad.nombre),
  );
  const sueltos = clasificados
    .filter((c) => !c.enMapa)
    .map((c) => ({ evento: c.evento, sinCiudad: c.ciudad === null }))
    .sort(
      (a, b) =>
        ordenPais(a.evento.pais) - ordenPais(b.evento.pais) || porFecha(a.evento, b.evento),
    );
  return { pines, sueltos };
}

/* ── Validación del borde: nunca confiar en la respuesta de la red ── */

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

/* ── Textos ── */

const nombrePais = (g: Geografia): string => (g === "MX" ? "México" : "Estados Unidos");

const fechaLarga = (iso: string): string => {
  const f = new Date(iso);
  if (Number.isNaN(f.getTime())) return "Fecha por confirmar";
  const texto = f.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};

/** "Ganas de $2,500 a $3,000 por persona…" — todo sale de lib/comisiones. */
const textoComision = (g: Geografia): string => {
  const montos = PAQUETES.map((p) => COMISIONES_PAQUETE[g][p]);
  const moneda = monedaDe(g);
  const min = dinero(Math.min(...montos), moneda);
  const max = dinero(Math.max(...montos), moneda);
  const nombreMoneda = moneda === "MXN" ? "pesos mexicanos" : "dólares";
  return `Ganas de ${min} a ${max} por persona que se une al Club (${nombreMoneda})`;
};

const ariaPin = (pin: Pin): string => {
  const cuantos = pin.eventos.length > 1 ? `${pin.eventos.length} eventos. ` : "";
  const lista = pin.eventos
    .map((e) => `${e.name}: ${fechaLarga(e.date)}${e.venue ? `, en ${e.venue}` : ""}`)
    .join(". ");
  return `${pin.ciudad.nombre}, ${nombrePais(pin.pais)}. ${cuantos}${lista}. ${textoComision(pin.pais)}.`;
};

const pct = (v: number, total: number): string => `${((v / total) * 100).toFixed(2)}%`;

/** El mapa recorta los tooltips (overflow hidden): cerca de un borde, el
 * tooltip se corre hacia adentro; cerca del fondo, se abre hacia arriba. */
const claseTooltip = (pin: Pin): string => {
  const h =
    pin.x < VB_ANCHO * 0.15
      ? " mco-tooltip-izq"
      : pin.x > VB_ANCHO * 0.85
        ? " mco-tooltip-der"
        : "";
  const v = pin.y > VB_ALTO * 0.66 ? " mco-tooltip-arriba" : "";
  return h + v;
};


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
  const [carga, setCarga] = useState<Carga>({ estado: "cargando" });
  const [activo, setActivo] = useState<string | null>(null);

  // Mismo patrón que panel-client: fetch simple a /api/eventos al montar.
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

  useEffect(() => {
    if (activo === null) return;
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActivo(null);
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [activo]);

  const { pines, sueltos } = useMemo(
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
  const pinActivo = pines.find((p) => p.ciudad.nombre === activo) ?? null;
  const sinEventos =
    carga.estado === "error" || (carga.estado === "listo" && carga.eventos.length === 0);

  return (
    <section className="mco mt-8" aria-labelledby="mco-titulo">
      <span className="sec-tag">Próximos eventos</span>
      <h2 id="mco-titulo" className="mt-2 text-2xl font-extrabold sm:text-3xl">
        El mapa de tu oportunidad
      </h2>
      <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-white/60">
        Los eventos abiertos, en vivo — este mapa se actualiza solo. Toca cada
        punto para ver la fecha y el lugar, y aquí mismo lo que ganas por cada
        persona que se une al Club.
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
            </svg>

            {pines.map((pin) => {
              const abierta = activo === pin.ciudad.nombre;
              const tono = pin.pais === "MX" ? "mx" : "us";
              const eti = etiquetas.get(pin.ciudad.nombre) ?? { visible: true, dy: 0 };
              return (
                <div
                  key={pin.ciudad.nombre}
                  className="mco-ciudad"
                  style={{ left: pct(pin.x, VB_ANCHO), top: pct(pin.y, VB_ALTO) }}
                >
                  <button
                    type="button"
                    className="mco-pin"
                    aria-label={ariaPin(pin)}
                    aria-expanded={abierta}
                    onClick={() => setActivo(pin.ciudad.nombre)}
                    onMouseEnter={() => setActivo(pin.ciudad.nombre)}
                    onMouseLeave={() => setActivo((prev) => (prev === pin.ciudad.nombre ? null : prev))}
                    onFocus={() => setActivo(pin.ciudad.nombre)}
                    onBlur={() => setActivo((prev) => (prev === pin.ciudad.nombre ? null : prev))}
                  >
                    <span className={`mco-onda mco-onda-${tono}`} aria-hidden="true" />
                    <span className={`mco-onda mco-onda-2 mco-onda-${tono}`} aria-hidden="true" />
                    <span className={`mco-punto mco-fondo-${tono}`} aria-hidden="true">
                      {pin.eventos.length > 1 ? pin.eventos.length : ""}
                    </span>
                    {eti.visible ? (
                      <span
                        className={`mco-eti mco-eti-${pin.ciudad.etiqueta}`}
                        style={{ "--eti-dy": `${eti.dy}px` } as CSSProperties}
                        aria-hidden="true"
                      >
                        {pin.ciudad.nombre}
                      </span>
                    ) : null}
                  </button>

                  {/* El botón ya dice todo esto en su aria-label. */}
                  <div
                    className={`mco-tooltip${claseTooltip(pin)}${abierta ? " es-visible" : ""}`}
                    aria-hidden="true"
                  >
                    <p className="mco-tt-ciudad">
                      {pin.ciudad.nombre} · {nombrePais(pin.pais)}
                    </p>
                    {pin.eventos.map((e) => (
                      <div key={e.id} className="mco-tt-evento">
                        <p className="mco-tt-nombre">{e.name}</p>
                        <p className="mco-tt-fecha">{fechaLarga(e.date)}</p>
                        {e.venue ? <p className="mco-tt-lugar">{e.venue}</p> : null}
                      </div>
                    ))}
                    <p className="mco-tt-comision">{textoComision(pin.pais)}.</p>
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

      {carga.estado === "cargando" ? (
        <>
          <div className="mco-esqueletos" aria-hidden="true">
            <span className="mco-esqueleto" />
            <span className="mco-esqueleto" />
            <span className="mco-esqueleto" />
          </div>
          <p className="sr-only" role="status">
            Cargando los próximos eventos…
          </p>
        </>
      ) : null}

      {sinEventos ? (
        <p className="mco-vacio">Pronto anunciaremos los próximos eventos aquí.</p>
      ) : null}

      {/* En pantallas chicas los pines quedan muy juntos en los racimos:
          estas fichas son el camino cómodo con el pulgar. */}
      {pines.length > 0 ? (
        <div className="mco-chips">
          {pines.map((pin) => (
            <button
              key={pin.ciudad.nombre}
              type="button"
              className={`mco-chip${activo === pin.ciudad.nombre ? " es-activa" : ""}`}
              aria-label={ariaPin(pin)}
              aria-expanded={activo === pin.ciudad.nombre}
              onClick={() =>
                setActivo((prev) => (prev === pin.ciudad.nombre ? null : pin.ciudad.nombre))
              }
            >
              <span
                className={`mco-chip-punto ${pin.pais === "MX" ? "mco-fondo-mx" : "mco-fondo-us"}`}
                aria-hidden="true"
              />
              {pin.ciudad.nombre}
              {pin.eventos.length > 1 ? ` · ${pin.eventos.length}` : ""}
            </button>
          ))}
        </div>
      ) : null}

      {/* Eventos que no caben en el mapa (ciudad sin reconocer o fuera del
          recorte): no se pierden, viven aquí. */}
      {sueltos.length > 0 ? (
        <div className="mco-sueltos">
          {sueltos.map(({ evento, sinCiudad }) => (
            <div key={evento.id} className="mco-suelto">
              <p className="mco-suelto-nombre">{evento.name}</p>
              <p className="mco-suelto-fecha">
                {fechaLarga(evento.date)}
                {sinCiudad ? <span className="mco-suelto-tag"> · ubicación por confirmar</span> : null}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {/* Panel fijo inferior: el "tooltip" de teléfono. El envoltorio con
          aria-live existe siempre para que el lector de pantalla anuncie. */}
      <div aria-live="polite">
        {pinActivo !== null ? (
          <div className="mco-panel">
            <span
              className={`mco-punto mco-punto-panel ${pinActivo.pais === "MX" ? "mco-fondo-mx" : "mco-fondo-us"}`}
              aria-hidden="true"
            >
              {pinActivo.eventos.length > 1 ? pinActivo.eventos.length : ""}
            </span>
            <div className="mco-panel-info">
              <p className="mco-tt-ciudad">
                {pinActivo.ciudad.nombre} · {nombrePais(pinActivo.pais)}
              </p>
              {pinActivo.eventos.map((e) => (
                <p key={e.id} className="mco-tt-fecha">
                  {e.name} — {fechaLarga(e.date)}
                  {e.venue ? ` · ${e.venue}` : ""}
                </p>
              ))}
              <p className="mco-tt-lugar">{textoComision(pinActivo.pais)}.</p>
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
        /* --eti-dy: empujón vertical del acomodo determinístico (0 si libra). */
        .mco-eti-arriba { bottom: 36px; left: 50%; transform: translateX(-50%) translateY(var(--eti-dy, 0px)); }
        .mco-eti-abajo  { top: 36px; left: 50%; transform: translateX(-50%) translateY(var(--eti-dy, 0px)); }
        .mco-eti-izq    { right: 38px; top: 50%; transform: translateY(calc(-50% + var(--eti-dy, 0px))); }
        .mco-eti-der    { left: 38px; top: 50%; transform: translateY(calc(-50% + var(--eti-dy, 0px))); }

        /* ── Tooltip (pantallas medianas en adelante) ── */
        .mco-tooltip {
          position: absolute;
          left: 0;
          top: 30px;
          transform: translateX(-50%) translateY(4px);
          width: 248px;
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
        /* Variantes de borde: que el overflow del mapa no recorte el tooltip. */
        .mco-tooltip-arriba { top: auto; bottom: 30px; }
        .mco-tooltip-izq { transform: translateX(-12%) translateY(4px); }
        .mco-tooltip-izq.es-visible { transform: translateX(-12%) translateY(0); }
        .mco-tooltip-der { transform: translateX(-88%) translateY(4px); }
        .mco-tooltip-der.es-visible { transform: translateX(-88%) translateY(0); }
        .mco-tt-ciudad { font-size: 15px; font-weight: 800; }
        .mco-tt-evento { margin-top: 8px; }
        .mco-tt-nombre { font-size: 14px; font-weight: 700; }
        .mco-tt-fecha { margin-top: 2px; font-size: 13px; color: rgba(255, 255, 255, 0.75); }
        .mco-tt-lugar { margin-top: 2px; font-size: 12.5px; color: rgba(255, 255, 255, 0.55); }
        .mco-tt-comision { margin-top: 10px; font-size: 12.5px; color: rgba(255, 255, 255, 0.6); }

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

        /* ── Esqueleto de carga (sutil, bajo el mapa) ── */
        .mco-esqueletos { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
        .mco-esqueleto {
          width: 132px;
          height: 44px;
          border-radius: 12px;
          background: var(--surface, #121917);
          box-shadow:
            inset 4px 4px 10px rgba(2, 6, 4, 0.55),
            inset -3px -3px 8px rgba(46, 66, 56, 0.25);
          opacity: 0.6;
        }

        /* ── Sin eventos (o error de red): el mapa se queda, esto avisa ── */
        .mco-vacio { margin-top: 14px; font-size: 14px; color: rgba(255, 255, 255, 0.6); }

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

        /* ── Fichas de eventos fuera del mapa (todas las pantallas) ── */
        .mco-sueltos { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
        .mco-suelto {
          min-height: 44px;
          padding: 10px 14px;
          border-radius: 12px;
          background: var(--surface, #121917);
          box-shadow:
            -4px -4px 10px var(--neu-luz, rgba(46, 66, 56, 0.5)),
            5px 5px 12px var(--neu-sombra, rgba(2, 6, 4, 0.85));
        }
        .mco-suelto-nombre { font-size: 14px; font-weight: 700; }
        .mco-suelto-fecha { margin-top: 2px; font-size: 12.5px; color: rgba(255, 255, 255, 0.55); }
        .mco-suelto-tag { color: rgba(255, 255, 255, 0.45); }

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

        /* Las tarjetas ya NO flotan sobre el mapa en grande: la de USA
           (arriba a la derecha) tapaba a Houston y su etiqueta con la gira
           de Texas encendida, y cualquier esquina tapa a alguna ciudad del
           gazetteer en algún ancho (Tijuana/Mexicali arriba a la izquierda,
           Yucatán abajo a la derecha). El mapa queda limpio y las tarjetas
           viven debajo, lado a lado. */

        @keyframes mco-onda {
          from { transform: scale(0.5); opacity: 0.85; }
          to   { transform: scale(2.7); opacity: 0; }
        }
        @keyframes mco-pulso {
          0%, 100% { opacity: 0.4; }
          50%      { opacity: 0.75; }
        }
        @keyframes mco-sube {
          from { transform: translateY(14px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }

        /* El movimiento solo existe para quien no pidió reducirlo:
           sin animación las ondas quedan invisibles y el esqueleto, quieto. */
        @media (prefers-reduced-motion: no-preference) {
          .mco-onda { animation: mco-onda 2.6s ease-out infinite; }
          .mco-onda-2 { animation-delay: 1.3s; }
          .mco-esqueleto { animation: mco-pulso 1.6s ease-in-out infinite; }
          .mco-esqueleto:nth-child(2) { animation-delay: 0.2s; }
          .mco-esqueleto:nth-child(3) { animation-delay: 0.4s; }
          .mco-panel { animation: mco-sube 0.28s cubic-bezier(0.16, 1, 0.3, 1) both; }
        }
      `}</style>
    </section>
  );
}
