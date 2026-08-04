"use client";

import { useState, type ReactNode } from "react";
import {
  OVERRIDE_PCT,
  PAGO_DIAS_HABILES,
  PAQUETE_LABEL,
  VALIDACION_HORAS,
  comisionPaqueteCents,
  dinero,
  type Paquete,
} from "@/lib/comisiones";

/** Sección "Tutoriales · aprende a ganar" — acordeón con los 5 tutoriales del
 * programa Synergy +1. Contenido estático: no depende de la base de datos. */

interface Paso {
  titulo: string;
  detalle: string;
  /** Contenido adicional debajo del detalle (tabla de comisiones o premios). */
  extra?: "tabla" | "premios";
}

interface Tutorial {
  id: string;
  titulo: string;
  resumen: string;
  icono: ReactNode;
  pasos: Paso[];
}

function Icono({ children }: { children: ReactNode }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const PCT_EQUIPO = Math.round(OVERRIDE_PCT * 100);

const TUTORIALES: Tutorial[] = [
  {
    id: "invitar",
    titulo: "Cómo invitar a tu +1",
    resumen: "De cero a boleto en un minuto.",
    icono: (
      <Icono>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M19 8v6" />
        <path d="M22 11h-6" />
      </Icono>
    ),
    pasos: [
      {
        titulo: "Elige el evento",
        detalle:
          "En «Inscribir a alguien», selecciona el Seminario de Emprendedor a Empresario Digital con Jorge Serratos y Manuel de León.",
      },
      {
        titulo: "Llena sus datos",
        detalle:
          "Solo su nombre y su WhatsApp. El correo es opcional — si no lo tienes a la mano, no pasa nada.",
      },
      {
        titulo: "Su pase VIP llega solo",
        detalle:
          "El pase VIP de cortesía le llega a tu invitado por WhatsApp al instante, sin que tú hagas nada más.",
      },
      {
        titulo: "Refuérzalo tú",
        detalle:
          "En «Mis inscritos», toca «Copiar liga» y mándale su boleto también desde tu propio WhatsApp — que le llegue de alguien de confianza.",
      },
    ],
  },
  {
    id: "pase-vip",
    titulo: "Cómo se genera el pase VIP de cortesía",
    resumen: "Qué pasa por dentro cuando inscribes a alguien.",
    icono: (
      <Icono>
        <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
        <path d="M13 5v2" />
        <path d="M13 11v2" />
        <path d="M13 17v2" />
      </Icono>
    ),
    pasos: [
      {
        titulo: "El sistema emite su boleto",
        detalle:
          "Al inscribirlo, su boleto se genera en la boletera oficial de Sinergéticos — es un pase VIP de cortesía real, con su nombre.",
      },
      {
        titulo: "Le llega por WhatsApp",
        detalle: "El boleto viaja solo: le llega a tu invitado por WhatsApp al instante.",
      },
      {
        titulo: "Tú siempre lo tienes a la mano",
        detalle:
          "Desde «Mis inscritos» puedes ver su boleto y reenviárselo las veces que haga falta.",
      },
    ],
  },
  {
    id: "como-ganas",
    titulo: "Cómo ganas",
    resumen: "Comisiones por cada paquete y premios por volumen.",
    icono: (
      <Icono>
        <circle cx="12" cy="12" r="10" />
        <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
        <path d="M12 6v2" />
        <path d="M12 16v2" />
      </Icono>
    ),
    pasos: [
      {
        titulo: "Tu invitado vive el seminario",
        detalle: "Va con su pase VIP de cortesía, sin costo para él.",
      },
      {
        titulo: "Si compra, tú ganas",
        detalle:
          "Cuando tu invitado entra al Club Sinergético, tú recibes una comisión fija según el paquete que elija y el país del evento:",
        extra: "tabla",
      },
      {
        titulo: "Y por volumen, premios",
        detalle:
          "Además de tus comisiones, al acumular invitados que ya compraron vas ganando premios:",
        extra: "premios",
      },
    ],
  },
  {
    id: "como-cobras",
    titulo: "Cómo cobras",
    resumen: "Del evento a tu cuenta, con fechas claras.",
    icono: (
      <Icono>
        <rect width="20" height="12" x="2" y="6" rx="2" />
        <circle cx="12" cy="12" r="2" />
        <path d="M6 12h.01" />
        <path d="M18 12h.01" />
      </Icono>
    ),
    pasos: [
      {
        titulo: "Validación",
        detalle: `Después del evento hay ${VALIDACION_HORAS} horas para validar tus comisiones.`,
      },
      {
        titulo: "Corte",
        detalle: "Con todo validado, se hace el corte del evento.",
      },
      {
        titulo: "Depósito",
        detalle: `El depósito llega a tu cuenta en ${PAGO_DIAS_HABILES} días hábiles.`,
      },
      {
        titulo: "¿Algo no cuadra?",
        detalle: "Toca el globito verde de WhatsApp y lo revisamos contigo.",
      },
    ],
  },
  {
    id: "equipo",
    titulo: "Cómo crecer tu equipo +1",
    resumen: `Gana un ${PCT_EQUIPO}% extra por las comisiones de tu equipo.`,
    icono: (
      <Icono>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </Icono>
    ),
    pasos: [
      {
        titulo: "Comparte tu liga",
        detalle:
          "¿Conoces a alguien que también quiera ganar invitando? Regístralo con tu liga de afiliado.",
      },
      {
        titulo: "Se vuelve parte de tu equipo +1",
        detalle: "Al registrarse contigo, esa persona queda ligada a tu cuenta.",
      },
      {
        titulo: `Ganas ${PCT_EQUIPO}% extra`,
        detalle: `De cada comisión que esa persona genere, tú recibes un ${PCT_EQUIPO}% adicional — sin quitarle nada a ella: es un extra que pone Sinergéticos.`,
      },
    ],
  },
];

const PAQUETES: Paquete[] = ["3m", "6m", "12m"];

function TablaComisiones() {
  return (
    <div className="mt-3 overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full min-w-[400px] text-sm">
        <thead className="text-left text-white/45">
          <tr className="border-b border-white/10">
            <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em]">Paquete</th>
            <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em]">
              Evento en México · MXN
            </th>
            <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em]">
              Evento en EE. UU. · USD
            </th>
          </tr>
        </thead>
        <tbody>
          {PAQUETES.map((p) => (
            <tr key={p} className="border-t border-white/[0.06]">
              <td className="px-4 py-3 font-semibold">{PAQUETE_LABEL[p]}</td>
              <td className="px-4 py-3 font-bold tabular text-[#19e16d]">
                {dinero(comisionPaqueteCents("MX", p), "MXN")}
              </td>
              <td className="px-4 py-3 font-bold tabular text-[#19e16d]">
                {dinero(comisionPaqueteCents("US", p), "USD")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const PREMIOS_VOLUMEN = [
  { meta: 10, premio: "Renovación del Club Sinergético" },
  { meta: 20, premio: "Pase Black a Synergy Unlimited" },
  { meta: 50, premio: "Viaje a Nueva York con Jorge Serratos" },
  { meta: 100, premio: "Mastermind + 3 boletos VIP" },
] as const;

function ListaPremiosVolumen() {
  return (
    <ul className="mt-3 space-y-2">
      {PREMIOS_VOLUMEN.map((p) => (
        <li key={p.meta} className="flex items-center gap-3">
          <span className="inline-flex h-9 min-w-11 flex-none items-center justify-center rounded-full border border-[#d9b45b]/35 px-2 text-sm font-extrabold tabular text-[#d9b45b]">
            {p.meta}
          </span>
          <span className="text-[15px] font-semibold text-white/85">{p.premio}</span>
        </li>
      ))}
    </ul>
  );
}

export default function SeccionTutoriales() {
  const [abierto, setAbierto] = useState<string | null>(TUTORIALES[0].id);

  return (
    <section className="mt-12">
      <p className="sec-tag mb-1">Tutoriales</p>
      <h2 className="text-xl font-bold">Aprende a ganar</h2>
      <p className="mt-1 text-sm text-white/55">
        Cinco tutoriales cortos, paso a paso. Toca cualquiera para abrirlo.
      </p>

      <div className="mt-5 space-y-3">
        {TUTORIALES.map((t) => {
          const estaAbierto = abierto === t.id;
          return (
            <article key={t.id} className="glass tut-item">
              <h3>
                <button
                  type="button"
                  id={`tut-boton-${t.id}`}
                  aria-expanded={estaAbierto}
                  aria-controls={`tut-panel-${t.id}`}
                  onClick={() => setAbierto(estaAbierto ? null : t.id)}
                  className="tut-boton"
                >
                  <span className="tut-icono">{t.icono}</span>
                  <span className="min-w-0">
                    <span className="block text-base font-bold sm:text-lg">{t.titulo}</span>
                    <span className="mt-0.5 block text-sm text-white/50">{t.resumen}</span>
                  </span>
                  <span className="tut-chevron" aria-hidden="true">
                    <Icono>
                      <path d="m6 9 6 6 6-6" />
                    </Icono>
                  </span>
                </button>
              </h3>
              <div
                id={`tut-panel-${t.id}`}
                role="region"
                aria-labelledby={`tut-boton-${t.id}`}
                inert={!estaAbierto}
                className={`tut-cuerpo${estaAbierto ? " esta-abierto" : ""}`}
              >
                <div>
                  <ol className="tut-pasos">
                    {t.pasos.map((paso, i) => (
                      <li key={paso.titulo} className="tut-paso">
                        <span className="tut-marca" aria-hidden="true">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold">{paso.titulo}</p>
                          <p className="mt-1 text-[15px] leading-relaxed text-white/60">
                            {paso.detalle}
                          </p>
                          {paso.extra === "tabla" ? <TablaComisiones /> : null}
                          {paso.extra === "premios" ? <ListaPremiosVolumen /> : null}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <p className="mt-5 text-[15px] text-white/55">
        ¿Dudas? Toca el <span className="font-bold text-[#19e16d]">globito verde de WhatsApp</span>{" "}
        y Daniel te ayuda.
      </p>

      <style>{`
        .tut-item { overflow: hidden; }
        .tut-boton {
          display: flex; width: 100%; align-items: center; gap: 16px;
          min-height: 44px; padding: 18px 20px;
          background: none; border: none; color: inherit;
          font-family: inherit; text-align: left; cursor: pointer;
        }
        .tut-icono {
          flex: none; display: grid; place-items: center;
          width: 44px; height: 44px; border-radius: 14px;
          color: #19e16d;
          background: rgba(25, 225, 109, 0.1);
          border: 1px solid rgba(25, 225, 109, 0.18);
        }
        .tut-chevron {
          flex: none; margin-left: auto; color: rgba(255, 255, 255, 0.45);
          transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .tut-boton[aria-expanded="true"] .tut-chevron { transform: rotate(180deg); }
        .tut-cuerpo {
          display: grid; grid-template-rows: 0fr;
          transition: grid-template-rows 0.5s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .tut-cuerpo.esta-abierto { grid-template-rows: 1fr; }
        .tut-cuerpo > div { overflow: hidden; }
        .tut-pasos { margin: 0; padding: 4px 20px 22px; list-style: none; }
        .tut-paso { position: relative; padding: 14px 0 14px 80px; }
        .tut-paso + .tut-paso { border-top: 1px solid rgba(255, 255, 255, 0.06); }
        .tut-marca {
          position: absolute; left: -2px; top: 50%; transform: translateY(-50%);
          font-size: 62px; font-weight: 900; line-height: 1; letter-spacing: -0.05em;
          font-variant-numeric: tabular-nums;
          color: rgba(25, 225, 109, 0.11);
          pointer-events: none; user-select: none;
        }
        @media (max-width: 480px) {
          .tut-paso { padding-left: 60px; }
          .tut-marca { font-size: 44px; }
        }
        @media (prefers-reduced-motion: no-preference) {
          @keyframes tut-aparecer {
            from { opacity: 0; transform: translateY(10px); }
          }
          .esta-abierto .tut-paso { animation: tut-aparecer 0.45s cubic-bezier(0.16, 1, 0.3, 1) backwards; }
          .esta-abierto .tut-paso:nth-child(2) { animation-delay: 0.05s; }
          .esta-abierto .tut-paso:nth-child(3) { animation-delay: 0.1s; }
          .esta-abierto .tut-paso:nth-child(4) { animation-delay: 0.15s; }
        }
        @media (prefers-reduced-motion: reduce) {
          .tut-cuerpo, .tut-chevron { transition: none; }
        }
      `}</style>
    </section>
  );
}
