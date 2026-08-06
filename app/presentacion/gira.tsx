"use client";

import { useEffect, useState } from "react";
import type { Geografia } from "@/lib/comisiones";
import { estiloCascada } from "./piezas";

/** Gira dinámica — la ÚNICA fuente de fechas del deck.
 *
 * Consume /api/eventos (eventos futuros activos de la boletera, ya filtrados
 * en el servidor). El deck es UNO solo para México y Estados Unidos: se
 * muestran TODOS los eventos ordenados por fecha, cada fila con la bandera
 * de su país — así la sala ve de un vistazo dónde es cada evento.
 *
 * La boletera publica las sesiones AM y PM del mismo evento como eventos
 * separados → aquí se AGRUPAN por ciudad+fecha en una sola fila con ambas
 * horas. Y como un deck no scrollea, el contenido que no cabe se compacta:
 * tope de filas + "…y N fechas más en camino". Sin eventos o con error de
 * red, un aviso amable — el deck no vuelve a mostrar fechas viejas. */

const MENSAJE_SIN_FECHAS = "Muy pronto anunciamos las fechas de tu región";
const MENSAJE_CARGANDO = "Cargando las fechas…";

/** Topes de filas visibles: un deck NUNCA scrollea dentro de la slide. */
const MAX_FILAS_GIRA = 8;
const MAX_FILAS_COMPACTA = 4;

export const banderaDe = (g: Geografia): string => (g === "MX" ? "🇲🇽" : "🇺🇸");

interface EventoGira {
  id: string;
  ciudad: string;
  fechaLarga: string;
  /** Milisegundos de la fecha, para ordenar la gira cronológicamente. */
  marca: number;
  hora: string | null;
  venue: string | null;
  pais: Geografia;
}

/** Una fila por ciudad/día; junta las horas de las sesiones AM y PM. */
interface GrupoGira {
  id: string;
  ciudad: string;
  fechaLarga: string;
  marca: number;
  horas: readonly string[];
  venue: string | null;
  pais: Geografia;
}

type EstadoGira =
  | { fase: "cargando" }
  | { fase: "sin-eventos" }
  | { fase: "listo"; grupos: readonly GrupoGira[] };

const FORMATO_LARGO = new Intl.DateTimeFormat("es-MX", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

/** "Tijuana | 09 de Agosto | 10:00 am" → ["Tijuana", "09 de Agosto", "10:00 am"]. */
const partesDeNombre = (nombre: string): readonly string[] =>
  nombre
    .split("|")
    .map((parte) => parte.trim())
    .filter((parte) => parte.length > 0);

/** Fechas sin hora ("2026-08-09") se anclan a mediodía para no correrse de día. */
const marcaDe = (fecha: string): number =>
  new Date(/^\d{4}-\d{2}-\d{2}$/.test(fecha) ? `${fecha}T12:00:00` : fecha).getTime();

const esGeografia = (v: unknown): v is Geografia => v === "MX" || v === "US";

/** Valida y limpia un evento crudo de la API — nunca confiar en datos externos. */
const aEventoGira = (crudo: Record<string, unknown>): EventoGira | null => {
  const { id, name, date, venue, pais } = crudo;
  if (typeof name !== "string" || name.trim() === "") return null;
  if (typeof id !== "string" && typeof id !== "number") return null;
  if (!esGeografia(pais)) return null;

  const partes = partesDeNombre(name);
  const marca = typeof date === "string" ? marcaDe(date) : Number.NaN;
  const fechaLarga = Number.isFinite(marca)
    ? FORMATO_LARGO.format(marca)
    : (partes[1] ?? "");
  if (fechaLarga === "") return null;

  return {
    id: String(id),
    ciudad: partes[0] ?? name,
    fechaLarga,
    marca: Number.isFinite(marca) ? marca : Number.MAX_SAFE_INTEGER,
    hora: partes[2] ?? null,
    venue: typeof venue === "string" && venue.trim() !== "" ? venue.trim() : null,
    pais,
  };
};

/** Sesiones AM/PM del mismo evento llegan separadas: una fila por ciudad+fecha.
 * (Exportada solo para pruebas.) */
export const agruparEventos = (eventos: readonly EventoGira[]): readonly GrupoGira[] =>
  eventos.reduce<readonly GrupoGira[]>((grupos, e) => {
    const idx = grupos.findIndex(
      (g) => g.ciudad === e.ciudad && g.fechaLarga === e.fechaLarga,
    );
    if (idx === -1) {
      return [
        ...grupos,
        {
          id: e.id,
          ciudad: e.ciudad,
          fechaLarga: e.fechaLarga,
          marca: e.marca,
          horas: e.hora ? [e.hora] : [],
          venue: e.venue,
          pais: e.pais,
        },
      ];
    }
    const previo = grupos[idx];
    const horas =
      e.hora && !previo.horas.includes(e.hora) ? [...previo.horas, e.hora] : previo.horas;
    return grupos.map((g, i) =>
      i === idx
        ? { ...g, horas, venue: g.venue ?? e.venue, marca: Math.min(g.marca, e.marca) }
        : g,
    );
  }, []);

/** "10:00 am" · "10:00 am y 6:00 pm" · "10:00 am, 4:00 pm y 6:00 pm".
 * (Exportada solo para pruebas.) */
export const textoHoras = (horas: readonly string[]): string | null => {
  if (horas.length === 0) return null;
  if (horas.length === 1) return horas[0];
  return `${horas.slice(0, -1).join(", ")} y ${horas[horas.length - 1]}`;
};

const textoRestantes = (n: number): string =>
  n === 1 ? "…y 1 fecha más en camino" : `…y ${n} fechas más en camino`;

/** Extrae el arreglo { eventos } del cuerpo sin confiar en su forma. */
const eventosCrudos = (cuerpo: unknown): readonly unknown[] => {
  if (typeof cuerpo !== "object" || cuerpo === null) return [];
  const lista = (cuerpo as { eventos?: unknown }).eventos;
  return Array.isArray(lista) ? lista : [];
};

const useEventosGira = (): EstadoGira => {
  const [estado, setEstado] = useState<EstadoGira>({ fase: "cargando" });

  useEffect(() => {
    let cancelado = false;
    const resolver = (nuevo: EstadoGira) => {
      if (!cancelado) setEstado(nuevo);
    };

    fetch("/api/eventos")
      .then((r) =>
        r.ok ? (r.json() as Promise<unknown>) : Promise.reject(new Error(`HTTP ${r.status}`)),
      )
      .then((cuerpo) => {
        const grupos = [
          ...agruparEventos(
            eventosCrudos(cuerpo)
              .filter((e): e is Record<string, unknown> => typeof e === "object" && e !== null)
              .map(aEventoGira)
              .filter((e): e is EventoGira => e !== null),
          ),
        ].sort((a, b) => a.marca - b.marca || a.ciudad.localeCompare(b.ciudad));
        resolver(grupos.length > 0 ? { fase: "listo", grupos } : { fase: "sin-eventos" });
      })
      // El error de red tiene UX definida por Manuel: el aviso "muy pronto…".
      .catch(() => resolver({ fase: "sin-eventos" }));

    return () => {
      cancelado = true;
    };
  }, []);

  return estado;
};

/** Variante grande para la slide de la gira: filas compactas de una línea,
 * tope de 8, título y encabezado siempre en viewport (1280×720 incluido). */
export function GiraDinamica() {
  const estado = useEventosGira();

  if (estado.fase === "cargando") {
    return (
      <div className="pres-card mt-6 p-6" role="status">
        <p className="text-lg font-semibold text-white/50">{MENSAJE_CARGANDO}</p>
      </div>
    );
  }

  if (estado.fase === "sin-eventos") {
    return (
      <div className="pres-card mt-6 p-8 text-center sm:p-10">
        <p className="text-[clamp(1.5rem,3.2vw,2.6rem)] font-extrabold leading-snug">
          {MENSAJE_SIN_FECHAS}
        </p>
      </div>
    );
  }

  const visibles = estado.grupos.slice(0, MAX_FILAS_GIRA);
  const restantes = estado.grupos.length - visibles.length;

  return (
    <ul className="pres-card mt-6 p-2.5 sm:p-4">
      {visibles.map((g, i) => {
        const horas = textoHoras(g.horas);
        return (
          <li
            key={g.id}
            className={`cascada-item px-3 py-2 sm:px-5 sm:py-2.5 ${
              i > 0 ? "border-t border-white/10" : ""
            }`}
            style={estiloCascada(i)}
          >
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-0.5">
              <span
                className="text-[clamp(1rem,1.8vw,1.45rem)]"
                aria-label={g.pais === "MX" ? "Evento en México" : "Evento en Estados Unidos"}
              >
                {banderaDe(g.pais)}
              </span>
              <span className="text-[clamp(1.1rem,2vw,1.6rem)] font-extrabold leading-tight texto-verde">
                {g.ciudad}
              </span>
              <span className="tabular text-[clamp(0.95rem,1.5vw,1.25rem)] font-semibold text-white/85">
                {g.fechaLarga}
                {horas ? ` · ${horas}` : ""}
              </span>
              {g.venue ? (
                <span className="min-w-0 flex-1 truncate text-right text-[clamp(0.85rem,1.2vw,1rem)] text-white/55">
                  {g.venue}
                </span>
              ) : null}
            </div>
          </li>
        );
      })}
      {restantes > 0 ? (
        <li className="border-t border-white/10 px-3 py-2 text-[clamp(0.95rem,1.5vw,1.2rem)] font-semibold text-white/60 sm:px-5">
          {textoRestantes(restantes)}
        </li>
      ) : null}
    </ul>
  );
}

/** Variante compacta para el cierre: bandera · ciudad · fecha, tope de 4. */
export function GiraCompacta() {
  const estado = useEventosGira();

  if (estado.fase === "cargando") {
    return (
      <p className="text-lg text-white/55" role="status">
        {MENSAJE_CARGANDO}
      </p>
    );
  }

  if (estado.fase === "sin-eventos") {
    return <p className="max-w-sm text-xl font-bold text-white/85">{MENSAJE_SIN_FECHAS}.</p>;
  }

  const visibles = estado.grupos.slice(0, MAX_FILAS_COMPACTA);
  const restantes = estado.grupos.length - visibles.length;

  return (
    <ul className="space-y-2 text-left text-lg text-white/85 lg:text-xl">
      {visibles.map((g) => {
        const horas = textoHoras(g.horas);
        return (
          <li key={g.id}>
            <span aria-hidden="true">{banderaDe(g.pais)}</span>{" "}
            <strong className="texto-verde">{g.ciudad}</strong> · {g.fechaLarga}
            {horas ? ` · ${horas}` : ""}
          </li>
        );
      })}
      {restantes > 0 ? <li className="text-white/60">{textoRestantes(restantes)}</li> : null}
    </ul>
  );
}
