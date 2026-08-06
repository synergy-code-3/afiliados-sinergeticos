"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";

/** Celebración de registro — overlay a pantalla completa que aparece cuando el
 * afiliado registra a un invitado. Un pase dorado-verde entra girando en 3D
 * (CSS puro: perspective + preserve-3d, dos caras reales), llueve confetti en
 * dos profundidades con monedas "$" y anillos de onda, y el gancho en dorado
 * empuja a registrar al siguiente. Sin auto-cierre: el afiliado decide.
 *
 * Accesible: role="dialog" + aria-modal, Escape cierra, el velo cierra con
 * onMouseDown (nunca onClick), focus trap entre los dos botones y con
 * prefers-reduced-motion: reduce se salta toda la animación (tarjeta estática
 * al instante, sin partículas).
 *
 * El integrador lo monta desde panel-client.tsx pasando el texto de comisión
 * YA formateado según la geografía del evento (lib/comisiones.ts). */

interface CelebracionProps {
  abierta: boolean;
  nombreInvitado: string;
  /** ej. "$2,500 MXN" — ya formateado por el integrador según la geografía del evento */
  comisionTexto: string;
  onRegistrarOtro: () => void;
  onCerrar: () => void;
}

/* ── Partículas (constantes deterministas: nada de aleatorio en render) ──
   Presupuesto: 8 confetti frente + 6 confetti fondo + 6 monedas + 3 anillos
   + 1 centinela = 24 nodos. Todo termina antes de ~2.5s y se desmonta. */

interface PiezaConfeti {
  izq: number; // % horizontal
  retraso: number; // s
  dur: number; // s
  deriva: number; // px de deriva lateral al caer
  giro: number; // grados de rotación total
  color: string;
}

const CONFETI_FRENTE: readonly PiezaConfeti[] = [
  { izq: 8, retraso: 0.0, dur: 1.7, deriva: 42, giro: 620, color: "#19e16d" },
  { izq: 20, retraso: 0.22, dur: 2.0, deriva: -34, giro: 540, color: "#d9b45b" },
  { izq: 33, retraso: 0.08, dur: 1.8, deriva: 26, giro: 700, color: "#eafff2" },
  { izq: 47, retraso: 0.3, dur: 2.1, deriva: -48, giro: 480, color: "#19e16d" },
  { izq: 60, retraso: 0.05, dur: 1.75, deriva: 38, giro: 660, color: "#d9b45b" },
  { izq: 72, retraso: 0.26, dur: 1.95, deriva: -22, giro: 580, color: "#f0d9a0" },
  { izq: 84, retraso: 0.12, dur: 1.85, deriva: 30, giro: 640, color: "#19e16d" },
  { izq: 94, retraso: 0.34, dur: 2.05, deriva: -40, giro: 520, color: "#d9b45b" },
];

const CONFETI_FONDO: readonly PiezaConfeti[] = [
  { izq: 14, retraso: 0.15, dur: 2.15, deriva: -26, giro: 420, color: "#0d7a3c" },
  { izq: 28, retraso: 0.38, dur: 2.1, deriva: 20, giro: 380, color: "#a8894a" },
  { izq: 42, retraso: 0.1, dur: 2.2, deriva: -18, giro: 440, color: "#0d7a3c" },
  { izq: 58, retraso: 0.4, dur: 2.05, deriva: 24, giro: 400, color: "#a8894a" },
  { izq: 73, retraso: 0.2, dur: 2.15, deriva: -30, giro: 460, color: "#134f2c" },
  { izq: 88, retraso: 0.42, dur: 2.05, deriva: 16, giro: 360, color: "#a8894a" },
];

interface Moneda {
  izq: number;
  retraso: number;
  dur: number;
  deriva: number;
}

const MONEDAS: readonly Moneda[] = [
  { izq: 12, retraso: 0.1, dur: 2.0, deriva: 30 },
  { izq: 30, retraso: 0.35, dur: 2.15, deriva: -24 },
  { izq: 50, retraso: 0.05, dur: 1.9, deriva: 18 },
  { izq: 66, retraso: 0.4, dur: 2.1, deriva: -32 },
  { izq: 80, retraso: 0.18, dur: 2.05, deriva: 26 },
  { izq: 92, retraso: 0.3, dur: 2.1, deriva: -20 },
];

const RETRASOS_ANILLOS: readonly number[] = [0, 0.22, 0.44];

function estiloConfeti(p: PiezaConfeti): CSSProperties {
  return {
    left: `${p.izq}%`,
    background: p.color,
    animationDelay: `${p.retraso}s`,
    animationDuration: `${p.dur}s`,
    "--cel-deriva": `${p.deriva}px`,
    "--cel-giro": `${p.giro}deg`,
  } as CSSProperties;
}

function estiloMoneda(m: Moneda): CSSProperties {
  return {
    left: `${m.izq}%`,
    animationDelay: `${m.retraso}s`,
    animationDuration: `${m.dur}s`,
    "--cel-deriva": `${m.deriva}px`,
  } as CSSProperties;
}

/** Lluvia de celebración. El centinela invisible dura más que la partícula más
 * larga; cuando su animación termina, el padre desmonta todo el campo. */
function LluviaCelebracion({ alTerminar }: { alTerminar: () => void }) {
  return (
    <div className="cel-particulas" aria-hidden="true">
      {RETRASOS_ANILLOS.map((retraso, i) => (
        <span
          key={`anillo-${retraso}`}
          className={i === 1 ? "cel-anillo cel-anillo-oro" : "cel-anillo"}
          style={{ animationDelay: `${retraso}s` }}
        />
      ))}
      {CONFETI_FONDO.map((p) => (
        <span key={`fondo-${p.izq}`} className="cel-confeti cel-confeti-fondo" style={estiloConfeti(p)} />
      ))}
      {CONFETI_FRENTE.map((p) => (
        <span key={`frente-${p.izq}`} className="cel-confeti" style={estiloConfeti(p)} />
      ))}
      {MONEDAS.map((m) => (
        <span key={`moneda-${m.izq}`} className="cel-moneda" style={estiloMoneda(m)}>
          $
        </span>
      ))}
      <span
        className="cel-centinela"
        onAnimationEnd={(e) => {
          if (e.animationName === "cel-centinela") alTerminar();
        }}
      />
    </div>
  );
}

/** Pase 3D de dos caras: entra girando en Y con brillo especular y queda
 * flotando con un tilt suave. El nombre va grabado en la cara frontal. */
function PaseAfiliado({ nombreInvitado }: { nombreInvitado: string }) {
  return (
    <div className="cel-escena">
      <div className="cel-pase-giro">
        <div className="cel-pase">
          <div className="cel-pase-frente">
            <div className="cel-pase-cabecera">
              <span className="cel-pase-marca">
                SYNERGY <b>+1</b>
              </span>
              <span className="cel-check" aria-hidden="true">
                ✓
              </span>
            </div>
            <div className="cel-pase-linea" />
            <p className="cel-pase-etiqueta">Pase de Afiliado ·</p>
            <p className="cel-pase-nombre">{nombreInvitado}</p>
            <div className="cel-pase-pie">
              <span className="cel-chip-vip">VIP · Cortesía</span>
              <span className="cel-pase-filosofia">1 + 1 = 3</span>
            </div>
            <span className="cel-brillo" aria-hidden="true" />
          </div>
          <div className="cel-pase-reverso" aria-hidden="true">
            <p className="cel-reverso-formula">1 + 1 = 3</p>
            <p className="cel-reverso-marca">
              SYNERGY <b>+1</b>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CelebracionRegistro({
  abierta,
  nombreInvitado,
  comisionTexto,
  onRegistrarOtro,
  onCerrar,
}: CelebracionProps) {
  const idTitulo = useId();
  const refPrimario = useRef<HTMLButtonElement>(null);
  const refSecundario = useRef<HTMLButtonElement>(null);
  const [lluviaActiva, setLluviaActiva] = useState(true);
  const [sinMovimiento, setSinMovimiento] = useState(false);

  // Cada apertura relanza la lluvia (los keyframes se reinician al remontar).
  useEffect(() => {
    if (abierta) setLluviaActiva(true);
  }, [abierta]);

  // Con movimiento reducido las partículas ni siquiera se montan.
  useEffect(() => {
    const consulta = window.matchMedia("(prefers-reduced-motion: reduce)");
    setSinMovimiento(consulta.matches);
    const alCambiar = (e: MediaQueryListEvent) => setSinMovimiento(e.matches);
    consulta.addEventListener("change", alCambiar);
    return () => consulta.removeEventListener("change", alCambiar);
  }, []);

  // Escape cierra, siempre.
  useEffect(() => {
    if (!abierta) return;
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
    };
    document.addEventListener("keydown", alTeclear);
    return () => document.removeEventListener("keydown", alTeclear);
  }, [abierta, onCerrar]);

  // Autofocus en el CTA primario y devolución del foco al cerrar.
  useEffect(() => {
    if (!abierta) return;
    const previo = document.activeElement;
    refPrimario.current?.focus();
    return () => {
      if (previo instanceof HTMLElement) previo.focus();
    };
  }, [abierta]);

  // El fondo no scrollea mientras la celebración está abierta.
  useEffect(() => {
    if (!abierta) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = anterior;
    };
  }, [abierta]);

  if (!abierta) return null;

  /* Focus trap básico: Tab circula entre los dos botones. */
  const atraparFoco = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key !== "Tab") return;
    const primero = refPrimario.current;
    const ultimo = refSecundario.current;
    if (!primero || !ultimo) return;
    if (e.shiftKey && document.activeElement === primero) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault();
      primero.focus();
    }
  };

  return (
    <div
      className="cel-velo"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCerrar();
      }}
    >
      <div className="cel-resplandor" aria-hidden="true" />
      {lluviaActiva && !sinMovimiento && (
        <LluviaCelebracion alTerminar={() => setLluviaActiva(false)} />
      )}

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        className="cel-caja"
        onKeyDown={atraparFoco}
      >
        <PaseAfiliado nombreInvitado={nombreInvitado} />

        <h2 id={idTitulo} className="cel-titulo">
          ¡{nombreInvitado} ya tiene su pase!
        </h2>
        <p className="cel-gancho">
          Esta puede ser otra comisión de <strong>{comisionTexto}</strong>
        </p>
        <p className="cel-vamos">Vamos por más 🔥</p>

        <div className="cel-acciones">
          <button
            ref={refPrimario}
            type="button"
            className="btn-cta btn-press btn-glow cel-btn"
            onClick={onRegistrarOtro}
          >
            Registrar a otro →
          </button>
          <button
            ref={refSecundario}
            type="button"
            className="btn-ghost btn-press cel-btn"
            onClick={onCerrar}
          >
            Ver a mi invitado
          </button>
        </div>
      </section>

      <style>{`
        /* ── Velo + resplandor ── */
        .cel-velo {
          position: fixed; inset: 0; z-index: 90;
          display: flex; overflow-y: auto;
          padding: 28px 20px;
          background: rgba(5, 10, 8, 0.74);
          -webkit-backdrop-filter: blur(14px);
          backdrop-filter: blur(14px);
        }
        .cel-resplandor {
          position: fixed; inset: 0; pointer-events: none;
          background:
            radial-gradient(42% 38% at 50% 40%, rgba(25, 225, 109, 0.16), transparent 70%),
            radial-gradient(30% 26% at 50% 46%, rgba(217, 180, 91, 0.12), transparent 70%);
        }

        /* ── Campo de partículas (se desmonta al terminar) ── */
        .cel-particulas {
          position: fixed; inset: 0; overflow: hidden;
          pointer-events: none; perspective: 700px;
        }
        .cel-confeti {
          position: absolute; top: 0;
          width: 10px; height: 16px; border-radius: 2px;
          opacity: 0; will-change: transform, opacity;
        }
        .cel-confeti-fondo { width: 8px; height: 13px; filter: blur(2px); }
        .cel-moneda {
          position: absolute; top: 0;
          display: grid; place-items: center;
          width: 24px; height: 24px; border-radius: 50%;
          background: radial-gradient(circle at 35% 30%, #f0d9a0, #d9b45b 55%, #8f6f2e);
          color: #241a05; font-size: 14px; font-weight: 900;
          opacity: 0; will-change: transform, opacity;
        }
        .cel-anillo {
          position: absolute; left: 50%; top: 42%;
          width: 130px; height: 130px; margin: -65px 0 0 -65px;
          border-radius: 50%;
          border: 2px solid rgba(25, 225, 109, 0.55);
          opacity: 0; will-change: transform, opacity;
        }
        .cel-anillo-oro { border-color: rgba(217, 180, 91, 0.5); }
        /* El centinela vive FUERA del bloque de movimiento: con reduce, la regla
           global lo acorta a 0.01ms y las partículas se desmontan al instante. */
        .cel-centinela {
          position: absolute; width: 1px; height: 1px; opacity: 0;
          animation: cel-centinela 2.6s linear both;
        }
        @keyframes cel-centinela { from { opacity: 0; } to { opacity: 0; } }

        /* ── Caja del diálogo ── */
        .cel-caja {
          position: relative; z-index: 1;
          margin: auto; width: 100%; max-width: 560px;
          text-align: center;
        }

        /* ── Pase 3D ── */
        .cel-escena { perspective: 1100px; }
        .cel-pase-giro { transform-style: preserve-3d; }
        .cel-pase {
          position: relative; transform-style: preserve-3d;
          width: min(440px, 100%); margin: 0 auto;
        }
        .cel-pase-frente,
        .cel-pase-reverso {
          border-radius: 20px;
          border: 1px solid rgba(217, 180, 91, 0.45);
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          overflow: hidden;
        }
        .cel-pase-frente {
          position: relative;
          padding: 20px 24px 18px;
          text-align: left;
          background: linear-gradient(135deg, #17301f 0%, #101c15 55%, #182c1c 100%);
          box-shadow:
            0 30px 60px -22px rgba(0, 0, 0, 0.75),
            0 0 44px -8px rgba(25, 225, 109, 0.28),
            inset 0 1px 0 rgba(255, 255, 255, 0.10);
        }
        .cel-pase-reverso {
          position: absolute; inset: 0;
          transform: rotateY(180deg);
          display: grid; place-content: center; gap: 6px;
          background: linear-gradient(135deg, #2a2415 0%, #171208 55%, #2c2412 100%);
          box-shadow: 0 30px 60px -22px rgba(0, 0, 0, 0.75);
        }
        .cel-pase-cabecera {
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
        }
        .cel-pase-marca {
          font-size: 13px; font-weight: 800; letter-spacing: 0.2em; color: #fff;
        }
        .cel-pase-marca b { color: #19e16d; }
        .cel-check {
          display: grid; place-items: center; flex: none;
          width: 38px; height: 38px; border-radius: 50%;
          background: linear-gradient(180deg, #24f27c, #19e16d);
          color: #04140b; font-size: 20px; font-weight: 900;
          box-shadow: 0 0 18px -2px rgba(25, 225, 109, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.4);
        }
        .cel-pase-linea {
          margin: 14px 0 12px;
          border-top: 1.5px dashed rgba(217, 180, 91, 0.35);
        }
        .cel-pase-etiqueta {
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.22em; text-transform: uppercase;
          color: rgba(217, 180, 91, 0.9);
        }
        .cel-pase-nombre {
          margin-top: 6px;
          font-size: clamp(22px, 5vw, 30px); font-weight: 800; line-height: 1.15;
          color: #f4efe2; overflow-wrap: anywhere;
          text-shadow: 0 1px 1px rgba(255, 255, 255, 0.10), 0 -1px 1px rgba(0, 0, 0, 0.6);
        }
        .cel-pase-pie {
          margin-top: 16px;
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
        }
        .cel-chip-vip {
          display: inline-flex; align-items: center;
          padding: 6px 12px; border-radius: 999px;
          font-size: 12px; font-weight: 800; letter-spacing: 0.08em;
          color: #241a05;
          background: linear-gradient(180deg, #f0d9a0, #d9b45b);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.45);
        }
        .cel-pase-filosofia {
          font-size: 12px; font-weight: 700; letter-spacing: 0.14em;
          color: rgba(255, 255, 255, 0.45);
        }
        .cel-brillo {
          position: absolute; top: -30%; bottom: -30%; left: 0; width: 46%;
          background: linear-gradient(100deg, transparent, rgba(255, 255, 255, 0.28), transparent);
          transform: translateX(-160%) skewX(-18deg);
          pointer-events: none;
        }
        .cel-reverso-formula {
          font-size: 34px; font-weight: 800; letter-spacing: 0.06em;
          color: #d9b45b;
        }
        .cel-reverso-marca {
          font-size: 12px; font-weight: 800; letter-spacing: 0.24em;
          color: rgba(255, 255, 255, 0.55); text-align: center;
        }
        .cel-reverso-marca b { color: #19e16d; }

        /* ── Mensajes ── */
        .cel-titulo {
          margin-top: 30px;
          font-size: clamp(26px, 6vw, 42px); font-weight: 800; line-height: 1.1;
          color: #fff;
        }
        .cel-gancho {
          margin: 14px auto 0; max-width: 30ch;
          font-size: clamp(22px, 5.4vw, 36px); font-weight: 800; line-height: 1.18;
          color: var(--oro);
          text-shadow: 0 0 30px rgba(217, 180, 91, 0.35);
        }
        .cel-gancho strong {
          font-weight: 900; white-space: nowrap;
          background: linear-gradient(100deg, #f4dfa5, #d9b45b 45%, #f7e9c3 70%, #c39d43);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .cel-vamos {
          margin-top: 10px;
          font-size: 17px; font-weight: 600;
          color: rgba(255, 255, 255, 0.72);
        }

        /* ── CTAs ── */
        .cel-acciones {
          display: flex; flex-direction: column; align-items: stretch; gap: 14px;
          margin-top: 28px;
        }
        .cel-btn { min-height: 52px; font-size: 17px; padding: 15px 30px; }
        @media (min-width: 560px) {
          .cel-acciones { flex-direction: row; justify-content: center; }
        }

        /* ── Movimiento (solo si el usuario lo permite) ── */
        @media (prefers-reduced-motion: no-preference) {
          .cel-velo { animation: cel-aparece 0.35s ease-out both; }
          .cel-resplandor { animation: cel-respira 4.5s ease-in-out 0.4s infinite; }
          .cel-pase-giro { animation: cel-entra-pase 1.3s cubic-bezier(0.22, 1, 0.36, 1) both; }
          .cel-pase { animation: cel-flota 6s ease-in-out 1.5s infinite; }
          .cel-brillo { animation: cel-brillo 1s ease-in-out 0.45s 2 both; }
          .cel-check { animation: cel-pop-check 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) 1.3s both; }
          .cel-titulo { animation: cel-sube 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.75s both; }
          .cel-gancho { animation: cel-sube 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.95s both; }
          .cel-vamos { animation: cel-sube 0.7s cubic-bezier(0.16, 1, 0.3, 1) 1.1s both; }
          .cel-acciones { animation: cel-sube 0.7s cubic-bezier(0.16, 1, 0.3, 1) 1.25s both; }
          .cel-confeti {
            animation-name: cel-cae-confeti;
            animation-timing-function: linear;
            animation-fill-mode: both;
          }
          .cel-moneda {
            animation-name: cel-cae-moneda;
            animation-timing-function: linear;
            animation-fill-mode: both;
          }
          .cel-anillo { animation: cel-onda 1.4s cubic-bezier(0.16, 1, 0.3, 1) both; }

          @keyframes cel-aparece {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
          @keyframes cel-respira {
            0%, 100% { opacity: 0.55; transform: scale(1); }
            50%      { opacity: 0.95; transform: scale(1.14); }
          }
          @keyframes cel-entra-pase {
            0%   { opacity: 0; transform: translateY(70px) scale(0.55) rotateY(-540deg); }
            55%  { opacity: 1; }
            78%  { transform: translateY(-6px) scale(1.04) rotateY(12deg); }
            100% { opacity: 1; transform: translateY(0) scale(1) rotateY(0deg); }
          }
          @keyframes cel-flota {
            0%, 100% { transform: translateY(0) rotateX(0deg) rotateY(0deg); }
            33%      { transform: translateY(-8px) rotateX(4deg) rotateY(7deg); }
            66%      { transform: translateY(4px) rotateX(-3deg) rotateY(-6deg); }
          }
          @keyframes cel-brillo {
            from { transform: translateX(-160%) skewX(-18deg); }
            to   { transform: translateX(320%) skewX(-18deg); }
          }
          @keyframes cel-pop-check {
            0%   { opacity: 0; transform: scale(0.3); }
            60%  { opacity: 1; transform: scale(1.18); }
            100% { opacity: 1; transform: scale(1); }
          }
          @keyframes cel-sube {
            from { opacity: 0; transform: translateY(22px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes cel-cae-confeti {
            0%   { opacity: 0; transform: translate3d(0, -12vh, 0) rotate(0deg); }
            8%   { opacity: 1; }
            100% { opacity: 0; transform: translate3d(var(--cel-deriva, 0px), 108vh, 0) rotate(var(--cel-giro, 540deg)); }
          }
          @keyframes cel-cae-moneda {
            0%   { opacity: 0; transform: translate3d(0, -10vh, 0) rotateX(0deg); }
            10%  { opacity: 1; }
            100% { opacity: 0; transform: translate3d(var(--cel-deriva, 0px), 106vh, 0) rotateX(940deg); }
          }
          @keyframes cel-onda {
            0%   { opacity: 0.9; transform: scale(0.2); }
            100% { opacity: 0; transform: scale(6); }
          }
        }
      `}</style>
    </div>
  );
}
