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
  /** Referencia visual: "captura" recreada en HTML/CSS (decorativa). */
  mock: ReactNode;
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

/* ── Referencias visuales: "capturas" recreadas en HTML/CSS ──────────────────
 * No son imágenes: cada pantalla se RECREA en miniatura dentro de un marco
 * tipo ventana (lección clase-google — siempre al día y nítidas en cualquier
 * densidad). Son decorativas: aria-hidden, sin interacción, y SIEMPRE con una
 * descripción textual visible debajo. */

function MarcoCaptura({
  titulo,
  descripcion,
  children,
}: {
  titulo: string;
  descripcion: string;
  children: ReactNode;
}) {
  return (
    <div className="mock-figura">
      <div className="mock-marco" aria-hidden="true">
        <div className="mock-barra">
          <span className="mock-punto mp-r" />
          <span className="mock-punto mp-a" />
          <span className="mock-punto mp-v" />
          <span className="mock-barra-titulo">{titulo}</span>
        </div>
        <div className="mock-pantalla">{children}</div>
      </div>
      <p className="mock-pie">{descripcion}</p>
    </div>
  );
}

function MockInvitar() {
  return (
    <MarcoCaptura
      titulo="Tu panel · Inscribir a alguien"
      descripcion="Así se ve el formulario «Inscribir a alguien» en tu panel: eliges el evento, llenas nombre y WhatsApp (el correo es opcional) y tocas el botón verde."
    >
      <p className="mk-tag">Nuevo invitado</p>
      <p className="mk-titulo">Inscribir a alguien</p>
      <p className="mk-label">Evento</p>
      <div className="mk-field">
        <span className="mk-recorte">Seminario de Emprendedor a Empresario Digital</span>
        <span className="mk-chevron">▾</span>
      </div>
      <p className="mk-label">Nombre del invitado</p>
      <div className="mk-field">
        <span className="mk-ph">Nombre completo</span>
      </div>
      <p className="mk-label">Correo del invitado · opcional</p>
      <div className="mk-field">
        <span className="mk-ph">correo@ejemplo.com</span>
      </div>
      <p className="mk-label">WhatsApp del invitado · obligatorio</p>
      <div className="mk-fila">
        <div className="mk-field mk-lada">🇲🇽 +52</div>
        <div className="mk-field mk-crece">
          <span className="mk-ph">10 dígitos</span>
        </div>
      </div>
      <div className="mk-btn">Inscribir y crear boleto →</div>
    </MarcoCaptura>
  );
}

function MockPaseVip() {
  return (
    <MarcoCaptura
      titulo="El WhatsApp de tu invitado"
      descripcion="Así le llega a tu invitado su Pase de Invitado Especial por WhatsApp: un mensaje con su nombre y la liga de su boleto, al instante."
    >
      <div className="mk-wa">
        <div className="mk-wa-header">
          <span className="mk-wa-avatar">S</span>
          <span className="min-w-0">
            <span className="mk-wa-nombre">Sinergéticos</span>
            <span className="mk-wa-linea">en línea</span>
          </span>
        </div>
        <div className="mk-wa-chat">
          <div className="mk-wa-burbuja">
            <p className="mk-wa-texto">
              🎟️ ¡Hola Laura! Aquí está tu Pase de Invitado Especial de cortesía para el Seminario de
              Emprendedor a Empresario Digital. Te esperamos 🙌
            </p>
            <span className="mk-wa-liga">
              <span className="mk-wa-liga-titulo">Tu boleto · Pase de Invitado Especial</span>
              <span className="mk-wa-liga-url">synergyticket.net/ticket/8FK2…</span>
            </span>
            <span className="mk-wa-meta">
              9:41 p. m. <span className="mk-wa-checks">✓✓</span>
            </span>
          </div>
        </div>
      </div>
    </MarcoCaptura>
  );
}

function PremioMini({ meta }: { meta: number }) {
  const [fallo, setFallo] = useState(false);
  return (
    <span className="mk-premio">
      {fallo ? (
        <span className="mk-premio-img mk-premio-alt">🏆</span>
      ) : (
        <img
          src={`/premios/premio-${meta}.webp`}
          alt=""
          loading="lazy"
          className="mk-premio-img"
          onError={() => setFallo(true)}
        />
      )}
      <span className="mk-premio-meta">{meta}</span>
    </span>
  );
}

function MockGanas() {
  return (
    <MarcoCaptura
      titulo="Tu panel · Comisiones y premios"
      descripcion="Tu comisión fija por paquete — México y EE. UU. lado a lado — y la escalera de premios al acumular 10, 20, 50 y 100 invitados que compraron."
    >
      <table className="mk-tabla">
        <thead>
          <tr>
            <th>Paquete</th>
            <th>🇲🇽 México</th>
            <th>🇺🇸 EE. UU.</th>
          </tr>
        </thead>
        <tbody>
          {PAQUETES.map((p) => (
            <tr key={p}>
              <td>{PAQUETE_LABEL[p]}</td>
              <td className="mk-monto">{dinero(comisionPaqueteCents("MX", p), "MXN")}</td>
              <td className="mk-monto">{dinero(comisionPaqueteCents("US", p), "USD")}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mk-premios">
        {PREMIOS_VOLUMEN.map((p) => (
          <PremioMini key={p.meta} meta={p.meta} />
        ))}
      </div>
    </MarcoCaptura>
  );
}

function MockCobras() {
  return (
    <MarcoCaptura
      titulo="El camino de tu dinero"
      descripcion={`Del evento a tu cuenta: validación de ${VALIDACION_HORAS} horas, corte del evento y depósito en ${PAGO_DIAS_HABILES} días hábiles.`}
    >
      <div className="mk-tl">
        <span className="mk-tl-linea" />
        <span className="mk-tl-nodo">
          <span className="mk-tl-icono">🎪</span>
          <span className="mk-tl-nombre">Evento</span>
          <span className="mk-tl-sub">el seminario</span>
        </span>
        <span className="mk-tl-nodo">
          <span className="mk-tl-icono">⏱</span>
          <span className="mk-tl-nombre">Validación</span>
          <span className="mk-tl-sub">{VALIDACION_HORAS} horas</span>
        </span>
        <span className="mk-tl-nodo">
          <span className="mk-tl-icono">✂️</span>
          <span className="mk-tl-nombre">Corte</span>
          <span className="mk-tl-sub">del evento</span>
        </span>
        <span className="mk-tl-nodo es-oro">
          <span className="mk-tl-icono">💸</span>
          <span className="mk-tl-nombre">Depósito</span>
          <span className="mk-tl-sub">{PAGO_DIAS_HABILES} días hábiles</span>
        </span>
      </div>
    </MarcoCaptura>
  );
}

function MockEquipo() {
  return (
    <MarcoCaptura
      titulo="Tu panel · Tu liga personal"
      descripcion={`Así se ve la tarjeta «Tu liga personal»: tu liga única, los botones para copiarla o mandarla por WhatsApp, y tu ${PCT_EQUIPO}% extra.`}
    >
      <div className="mk-fila-entre">
        <p className="mk-tag">Tu liga personal</p>
        <span className="mk-badge-oro">{PCT_EQUIPO}% EXTRA</span>
      </div>
      <div className="mk-field">
        <span className="mk-recorte mk-url">
          https://afiliados.sinergeticos.com/crear-cuenta?ref=ABC123
        </span>
      </div>
      <div className="mk-fila">
        <span className="mk-btn mk-btn-mitad">Copiar</span>
        <span className="mk-btn-ghost mk-btn-mitad">Invitar por WhatsApp</span>
      </div>
    </MarcoCaptura>
  );
}

const TUTORIALES: Tutorial[] = [
  {
    id: "invitar",
    titulo: "Cómo invitar a tu +1",
    resumen: "De cero a boleto en un minuto.",
    mock: <MockInvitar />,
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
        titulo: "Su Pase de Invitado Especial llega solo",
        detalle:
          "El Pase de Invitado Especial de cortesía le llega a tu invitado por WhatsApp al instante, sin que tú hagas nada más.",
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
    titulo: "Cómo se genera el Pase de Invitado Especial",
    resumen: "Qué pasa por dentro cuando inscribes a alguien.",
    mock: <MockPaseVip />,
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
          "Al inscribirlo, su boleto se genera en la boletera oficial de Sinergéticos — es un Pase de Invitado Especial de cortesía real, con su nombre.",
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
    mock: <MockGanas />,
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
        detalle: "Va con su Pase de Invitado Especial de cortesía, sin costo para él.",
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
    mock: <MockCobras />,
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
    mock: <MockEquipo />,
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
                  <div className="mock-zona">{t.mock}</div>
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

        /* ── Referencias visuales (capturas recreadas) ── */
        .mock-zona { padding: 2px 20px 24px; }
        .mock-figura { max-width: 420px; margin: 0 auto; }
        .mock-marco {
          pointer-events: none; user-select: none; overflow: hidden;
          background: var(--surface-md, #16201c);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 16px;
          box-shadow: -5px -5px 12px var(--neu-luz), 7px 7px 16px var(--neu-sombra);
        }
        .mock-barra {
          display: flex; align-items: center; gap: 5px;
          padding: 9px 12px;
          background: rgba(255, 255, 255, 0.03);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .mock-punto { flex: none; width: 9px; height: 9px; border-radius: 50%; }
        .mp-r { background: rgba(255, 95, 87, 0.75); }
        .mp-a { background: rgba(254, 188, 46, 0.75); }
        .mp-v { background: rgba(40, 200, 64, 0.75); }
        .mock-barra-titulo {
          margin-left: 6px; min-width: 0;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          font-size: 10px; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; color: rgba(255, 255, 255, 0.4);
        }
        .mock-pantalla { padding: 14px; }
        .mock-pie {
          max-width: 420px; margin: 10px auto 0;
          font-size: 13px; line-height: 1.5; text-align: center;
          color: rgba(255, 255, 255, 0.5);
        }

        /* elementos mini de panel/formulario */
        .mk-tag {
          margin: 0; font-size: 8px; font-weight: 700; letter-spacing: 0.16em;
          text-transform: uppercase; color: #19e16d;
        }
        .mk-titulo { margin: 2px 0 4px; font-size: 14px; font-weight: 800; color: #fff; }
        .mk-label {
          margin: 10px 0 4px; font-size: 8.5px; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: rgba(255, 255, 255, 0.9);
        }
        .mk-field {
          display: flex; align-items: center; justify-content: space-between;
          gap: 8px; min-height: 30px; min-width: 0; padding: 7px 10px;
          background: #0b110e;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 8px;
          font-size: 11px; color: rgba(255, 255, 255, 0.8);
          box-shadow:
            inset 3px 3px 7px var(--neu-sombra-suave),
            inset -2px -2px 6px var(--neu-luz-suave);
        }
        .mk-ph { color: rgba(255, 255, 255, 0.4); }
        .mk-recorte { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .mk-url { font-size: 10px; color: rgba(255, 255, 255, 0.65); }
        .mk-chevron { flex: none; color: rgba(255, 255, 255, 0.4); }
        .mk-fila { display: flex; gap: 8px; }
        .mk-fila-entre {
          display: flex; align-items: center; justify-content: space-between;
          gap: 8px; margin-bottom: 8px;
        }
        .mk-lada { flex: none; }
        .mk-crece { flex: 1; }
        .mk-btn {
          display: flex; align-items: center; justify-content: center;
          min-height: 32px; margin-top: 12px; padding: 0 12px;
          border-radius: 9px;
          background: #19e16d; color: #04140b;
          font-size: 11.5px; font-weight: 800;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35), 3px 3px 8px var(--neu-sombra);
        }
        .mk-btn-ghost {
          display: flex; align-items: center; justify-content: center;
          min-height: 32px; margin-top: 12px; padding: 0 12px;
          border-radius: 9px;
          background: var(--surface, #121917); color: rgba(255, 255, 255, 0.9);
          font-size: 11px; font-weight: 700;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: -3px -3px 7px var(--neu-luz), 4px 4px 9px var(--neu-sombra);
        }
        .mk-btn-mitad { flex: 1; margin-top: 12px; }
        .mk-badge-oro {
          flex: none; padding: 3px 9px; border-radius: 999px;
          font-size: 9px; font-weight: 800; letter-spacing: 0.1em;
          color: #d9b45b; background: rgba(217, 180, 91, 0.12);
          border: 1px solid rgba(217, 180, 91, 0.45);
        }

        /* chat de WhatsApp */
        .mk-wa {
          overflow: hidden; border-radius: 10px;
          background: #0b141a; border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .mk-wa-header {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 10px; background: #1f2c34;
        }
        .mk-wa-avatar {
          flex: none; display: grid; place-items: center;
          width: 24px; height: 24px; border-radius: 50%;
          background: linear-gradient(135deg, #24f27c, #0d7a3c);
          color: #04140b; font-size: 12px; font-weight: 800;
        }
        .mk-wa-nombre { display: block; font-size: 11px; font-weight: 700; color: #e9edef; line-height: 1.2; }
        .mk-wa-linea { display: block; font-size: 9px; color: #8696a0; }
        .mk-wa-chat { padding: 12px 10px; }
        .mk-wa-burbuja {
          max-width: 92%; padding: 8px 9px 6px;
          background: #005c4b;
          border-radius: 2px 10px 10px 10px;
          color: #e9edef;
        }
        .mk-wa-texto { margin: 0; font-size: 11px; line-height: 1.5; }
        .mk-wa-liga {
          display: block; margin-top: 7px; padding: 7px 9px;
          background: rgba(0, 0, 0, 0.25);
          border-radius: 7px;
          border-left: 3px solid #19e16d;
        }
        .mk-wa-liga-titulo { display: block; font-size: 10px; font-weight: 700; color: #e9edef; }
        .mk-wa-liga-url {
          display: block; margin-top: 1px; font-size: 9.5px; color: #53bdeb;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .mk-wa-meta { display: block; margin-top: 4px; text-align: right; font-size: 9px; color: #8696a0; }
        .mk-wa-checks { color: #53bdeb; letter-spacing: -0.12em; }

        /* tabla mini de comisiones + franja de premios */
        .mk-tabla { width: 100%; border-collapse: collapse; font-size: 10.5px; }
        .mk-tabla th {
          padding: 4px 6px; text-align: left;
          font-size: 8px; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; color: rgba(255, 255, 255, 0.45);
          border-bottom: 1px solid rgba(255, 255, 255, 0.12);
        }
        .mk-tabla td {
          padding: 5px 6px; font-weight: 600; color: rgba(255, 255, 255, 0.85);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .mk-tabla tbody tr:last-child td { border-bottom: none; }
        .mk-tabla td.mk-monto {
          font-weight: 800; color: #19e16d; font-variant-numeric: tabular-nums;
        }
        .mk-premios { display: flex; gap: 7px; margin-top: 12px; }
        .mk-premio {
          flex: 1; min-width: 0;
          display: flex; flex-direction: column; align-items: center; gap: 3px;
        }
        .mk-premio-img {
          display: block; width: 100%; aspect-ratio: 16 / 9; object-fit: cover;
          border-radius: 7px; border: 1px solid rgba(217, 180, 91, 0.25);
          background: #0b110e;
        }
        .mk-premio-alt { display: grid; place-items: center; font-size: 13px; }
        .mk-premio-meta {
          font-size: 9.5px; font-weight: 800; color: #d9b45b;
          font-variant-numeric: tabular-nums;
        }

        /* línea de tiempo del cobro */
        .mk-tl { position: relative; display: flex; padding: 4px 0 2px; }
        .mk-tl-linea {
          position: absolute; left: 12.5%; right: 12.5%; top: 21px; height: 3px;
          border-radius: 99px;
          background: linear-gradient(90deg, rgba(25, 225, 109, 0.55), rgba(217, 180, 91, 0.75));
          transform-origin: left center;
        }
        .mk-tl-nodo {
          position: relative; z-index: 1; flex: 1; min-width: 0;
          display: flex; flex-direction: column; align-items: center; gap: 4px;
          text-align: center;
        }
        .mk-tl-icono {
          display: grid; place-items: center;
          width: 37px; height: 37px; border-radius: 50%; font-size: 15px;
          background: var(--surface, #121917);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: -3px -3px 7px var(--neu-luz), 4px 4px 9px var(--neu-sombra);
        }
        .mk-tl-nombre {
          font-size: 9px; font-weight: 800; letter-spacing: 0.08em;
          text-transform: uppercase; color: rgba(255, 255, 255, 0.85);
        }
        .mk-tl-sub { font-size: 8.5px; color: rgba(255, 255, 255, 0.45); }
        .mk-tl-nodo.es-oro .mk-tl-icono {
          background: linear-gradient(180deg, rgba(217, 180, 91, 0.22), rgba(217, 180, 91, 0.06));
          border-color: rgba(217, 180, 91, 0.55);
          box-shadow:
            -3px -3px 7px var(--neu-luz), 4px 4px 9px var(--neu-sombra),
            0 0 16px -2px rgba(217, 180, 91, 0.45);
        }
        .mk-tl-nodo.es-oro .mk-tl-nombre { color: #d9b45b; }

        @media (prefers-reduced-motion: no-preference) {
          @keyframes tut-aparecer {
            from { opacity: 0; transform: translateY(10px); }
          }
          @keyframes mk-trazo {
            from { transform: scaleX(0); }
          }
          .esta-abierto .tut-paso { animation: tut-aparecer 0.45s cubic-bezier(0.16, 1, 0.3, 1) backwards; }
          .esta-abierto .tut-paso:nth-child(2) { animation-delay: 0.05s; }
          .esta-abierto .tut-paso:nth-child(3) { animation-delay: 0.1s; }
          .esta-abierto .tut-paso:nth-child(4) { animation-delay: 0.15s; }
          .esta-abierto .mock-figura { animation: tut-aparecer 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.2s backwards; }
          .esta-abierto .mk-tl-linea { animation: mk-trazo 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.45s backwards; }
        }
        @media (prefers-reduced-motion: reduce) {
          .tut-cuerpo, .tut-chevron { transition: none; }
        }
      `}</style>
    </section>
  );
}
