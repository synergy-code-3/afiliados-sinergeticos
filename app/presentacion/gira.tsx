"use client";

import { useEffect, useState } from "react";
import type { Geografia } from "@/lib/comisiones";
import { estiloCascada } from "./piezas";

/** Gira dinámica — la ÚNICA fuente de fechas del deck.
 *
 * Consume /api/eventos (eventos futuros activos de la boletera, ya filtrados
 * en el servidor) y muestra SOLO los del país de la versión: el deck MX jamás
 * enseña ciudades de EE. UU. y viceversa.
 *
 * La boletera publica las sesiones AM y PM del mismo evento como eventos
 * separados → aquí se AGRUPAN por ciudad+fecha en una sola fila con ambas
 * horas. Y como un deck no scrollea, el contenido que no cabe se compacta:
 * tope de filas + "…y N fechas más en camino". Sin eventos o con error de
 * red, un aviso amable — el deck no vuelve a mostrar fechas viejas. */

const MENSAJE_SIN_FECHAS = "Muy pronto anunciamos las fechas de tu región";
const MENSAJE_CARGANDO = "Cargando las fechas…";

/** Topes de filas visibles: un deck NUNCA scrollea dentro de la slide. */
const MAX_FILAS_GIRA = 6;
const MAX_FILAS_COMPACTA = 4;

interface EventoGira {
  id: string;
  ciudad: string;
  fechaLarga: string;
  hora: string | null;
  venue: string | null;
}

/** Una fila por ciudad/día; junta las horas de las sesiones AM y PM. */
interface GrupoGira {
  id: string;
  ciudad: string;
  fechaLarga: string;
  horas: readonly string[];
  venue: string | null;
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

/** Valida y limpia un evento crudo de la API — nunca confiar en datos externos. */
const aEventoGira = (crudo: Record<string, unknown>): EventoGira | null => {
  const { id, name, date, venue } = crudo;
  if (typeof name !== "string" || name.trim() === "") return null;
  if (typeof id !== "string" && typeof id !== "number") return null;

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
    hora: partes[2] ?? null,
    venue: typeof venue === "string" && venue.trim() !== "" ? venue.trim() : null,
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
          horas: e.hora ? [e.hora] : [],
          venue: e.venue,
        },
      ];
    }
    const previo = grupos[idx];
    const horas =
      e.hora && !previo.horas.includes(e.hora) ? [...previo.horas, e.hora] : previo.horas;
    return grupos.map((g, i) =>
      i === idx ? { ...g, horas, venue: g.venue ?? e.venue } : g,
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

const useEventosGira = (pais: Geografia): EstadoGira => {
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
        const grupos = agruparEventos(
          eventosCrudos(cuerpo)
            .filter((e): e is Record<string, unknown> => typeof e === "object" && e !== null)
            .filter((e) => e.pais === pais)
            .map(aEventoGira)
            .filter((e): e is EventoGira => e !== null),
        );
        resolver(grupos.length > 0 ? { fase: "listo", grupos } : { fase: "sin-eventos" });
      })
      // El error de red tiene UX definida por Manuel: el aviso "muy pronto…".
      .catch(() => resolver({ fase: "sin-eventos" }));

    return () => {
      cancelado = true;
    };
  }, [pais]);

  return estado;
};

/** Variante grande para la slide de la gira: filas compactas de una línea,
 * tope de 6, título y encabezado siempre en viewport (1280×720 incluido). */
export function GiraDinamica({ pais }: { pais: Geografia }) {
  const estado = useEventosGira(pais);

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
            <div className="flex flex-wrap items-baseline gap-x-5 gap-y-0.5">
              <span className="text-[clamp(1.15rem,2.1vw,1.7rem)] font-extrabold leading-tight texto-verde">
                {g.ciudad}
              </span>
              <span className="tabular text-[clamp(0.95rem,1.6vw,1.3rem)] font-semibold text-white/85">
                {g.fechaLarga}
                {horas ? ` · ${horas}` : ""}
              </span>
              {g.venue ? (
                <span className="min-w-0 flex-1 truncate text-right text-[clamp(0.85rem,1.3vw,1.05rem)] text-white/55">
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

/** Variante compacta para el cierre: ciudad · fecha · horas, tope de 4. */
export function GiraCompacta({ pais }: { pais: Geografia }) {
  const estado = useEventosGira(pais);

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
            <strong className="texto-verde">{g.ciudad}</strong> · {g.fechaLarga}
            {horas ? ` · ${horas}` : ""}
          </li>
        );
      })}
      {restantes > 0 ? <li className="text-white/60">{textoRestantes(restantes)}</li> : null}
    </ul>
  );
}
