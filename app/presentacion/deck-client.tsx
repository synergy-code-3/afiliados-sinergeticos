"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { slidesMX, slidesUS, type Mercado, type Slide } from "./slides";

/** Deck de la presentación Synergy +1.
 * Navegación: ← → · espacio · PageUp/PageDown (control remoto) · Home/End ·
 * swipe táctil · flechas en pantalla. F = pantalla completa.
 * El chrome inferior SIEMPRE lleva fondo sólido (lección del proyecto). */

const UMBRAL_SWIPE_PX = 48;

const CSS_DECK = `
.deck-raiz {
  position: fixed; inset: 0; overflow: hidden; color: #fff;
  background:
    radial-gradient(1200px 800px at 70% -10%, rgba(25,225,109,0.08), transparent 60%),
    radial-gradient(1000px 700px at 10% 110%, rgba(217,180,91,0.05), transparent 55%),
    #0e1412;
}
.deck-fondo {
  position: absolute; inset: 0;
  background-size: cover; background-position: center;
}
/* Velo oscuro obligatorio: el texto siempre gana sobre la foto */
.deck-velo {
  position: absolute; inset: 0;
  background: linear-gradient(180deg, rgba(6,10,8,0.74) 0%, rgba(6,10,8,0.80) 55%, rgba(6,10,8,0.90) 100%);
}
.deck-slide {
  position: absolute; inset: 0; overflow-y: auto;
  display: flex; flex-direction: column; justify-content: center;
  padding: clamp(20px, 5vw, 72px);
  padding-bottom: 118px;
}
.deck-centro { width: 100%; max-width: 1240px; margin: 0 auto; }

/* ── Tipografía escala de sala ── */
.deck-kicker {
  display: inline-flex; align-items: center; gap: 8px;
  font-size: clamp(12px, 1.3vw, 16px); font-weight: 700;
  letter-spacing: 0.18em; text-transform: uppercase; color: #19e16d;
}
.deck-kicker-oro { color: #d9b45b; }
.deck-titulo {
  font-size: clamp(2.1rem, 5.4vw, 4.5rem);
  font-weight: 800; line-height: 1.04; letter-spacing: -0.015em;
}
.deck-titulo-portada {
  font-size: clamp(3rem, 9.5vw, 7rem);
  font-weight: 800; line-height: 0.98; letter-spacing: -0.02em;
}
.deck-sub { font-size: clamp(1.05rem, 2vw, 1.5rem); color: rgba(255,255,255,0.72); }
.deck-cifra {
  font-size: clamp(2.6rem, 8.5vw, 7.5rem);
  font-weight: 800; line-height: 1; letter-spacing: -0.02em;
}
.deck-ecuacion {
  font-size: clamp(4rem, 15vw, 11rem);
  font-weight: 800; line-height: 1; letter-spacing: -0.03em;
}
.texto-verde { color: #19e16d; }
.texto-oro { color: #d9b45b; }

/* ── Piezas de los slides ── */
.palabra { display: inline-block; margin-right: 0.26em; }
.tarjeta-oro {
  box-shadow:
    inset 0 0 0 1px rgba(217,180,91,0.35),
    -6px -6px 14px rgba(46,66,56,0.55),
    8px 8px 18px rgba(2,6,4,0.85);
}
.tarjeta-3d { transform: perspective(1100px) rotateY(-9deg) rotateX(4deg); }
.deck-punto { display: inline-block; width: 9px; height: 9px; border-radius: 50%; background: #19e16d; }
.paso-marca {
  position: absolute; top: -28px; right: 6px;
  font-size: clamp(6rem, 9vw, 9rem); font-weight: 800; line-height: 1;
  color: rgba(25,225,109,0.12); font-variant-numeric: tabular-nums;
}
.paso-chip {
  display: inline-grid; place-items: center;
  width: 44px; height: 44px; border-radius: 50%;
  font-weight: 800; font-size: 18px; color: #04140b;
  background: linear-gradient(180deg, #24f27c, #19e16d);
}
.burbuja-wa {
  background: #12261b; border-radius: 14px 14px 14px 4px;
  padding: 12px 14px; font-size: 0.95rem; line-height: 1.45;
  color: rgba(255,255,255,0.9);
  box-shadow: inset 0 0 0 1px rgba(25,225,109,0.25);
}
.etiqueta-nota {
  display: inline-flex; align-items: center;
  border-radius: 999px; padding: 8px 16px;
  font-size: 13px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
  color: rgba(255,255,255,0.6); background: #0b110f;
  box-shadow: inset -3px -3px 8px rgba(46,66,56,0.3), inset 4px 4px 10px rgba(2,6,4,0.7);
}
.gira-destacada td { background: rgba(25,225,109,0.08); }
.gira-destacada td:first-child { color: #19e16d; box-shadow: inset 4px 0 0 #19e16d; }

/* QR sobre tarjeta blanca: contraste máximo para escanear desde la sala */
.qr-blanco {
  background: #fff; border-radius: 26px;
  padding: clamp(14px, 2vw, 26px);
  box-shadow: -6px -6px 14px rgba(46,66,56,0.55), 10px 12px 30px rgba(2,6,4,0.9);
}
.qr-imagen { display: block; width: min(46vh, 380px); height: auto; }
.qr-chico { padding: 12px; border-radius: 18px; }
.qr-imagen-chica { display: block; width: clamp(120px, 16vh, 170px); height: auto; }

.deck-boton-verde {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  min-height: 48px; border-radius: 12px; padding: 12px 28px;
  background: #19e16d; color: #000; font-weight: 800; font-size: 1.1rem;
}
.deck-boton-verde:hover { filter: brightness(1.1); }

.premio-img { display: block; width: 100%; aspect-ratio: 16/9; object-fit: cover; }
.premio-respaldo {
  display: grid; place-items: center; width: 100%; aspect-ratio: 16/9;
  background: linear-gradient(150deg, rgba(217,180,91,0.22), rgba(25,225,109,0.12) 60%, rgba(6,10,8,0.4));
}
.premio-respaldo span {
  font-size: clamp(2.5rem, 5vw, 4rem); font-weight: 800;
  color: rgba(255,255,255,0.85); font-variant-numeric: tabular-nums;
}

/* ── Chrome inferior — fondo SÓLIDO siempre ── */
.deck-chrome {
  position: fixed; left: 0; right: 0; bottom: 0; z-index: 20;
  background: #0a0f0d;
  border-top: 1px solid rgba(255,255,255,0.08);
}
.deck-progreso { height: 4px; background: rgba(255,255,255,0.08); }
.deck-progreso-avance {
  height: 100%;
  background: linear-gradient(90deg, #0d7a3c, #19e16d);
}
.deck-controles {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 8px clamp(12px, 3vw, 28px);
}
.deck-contador { font-size: 15px; font-weight: 700; color: rgba(255,255,255,0.7); }
.deck-pista { font-size: 13px; color: rgba(255,255,255,0.4); }
.deck-boton-chrome {
  min-width: 48px; min-height: 44px; padding: 0 14px;
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  border-radius: 12px; border: none; cursor: pointer;
  background: #121917; color: rgba(255,255,255,0.85);
  font-size: 18px; font-weight: 700; font-family: inherit;
  box-shadow: -3px -3px 8px rgba(46,66,56,0.45), 4px 4px 10px rgba(2,6,4,0.8);
}
.deck-boton-chrome:disabled { opacity: 0.35; cursor: default; }
.deck-boton-chrome:not(:disabled):active {
  box-shadow: inset -3px -3px 8px rgba(46,66,56,0.3), inset 4px 4px 10px rgba(2,6,4,0.75);
}

/* ── Entradas variadas (solo si el visitante acepta movimiento) ── */
@media (prefers-reduced-motion: no-preference) {
  .entrada-fade-up { animation: presFadeUp 0.8s cubic-bezier(0.16,1,0.3,1) both; }
  .entrada-fade { animation: presFade 0.7s ease both; }
  .entrada-escala { animation: presEscala 0.8s cubic-bezier(0.16,1,0.3,1) both; }
  .entrada-barrido { animation: presBarrido 0.75s cubic-bezier(0.16,1,0.3,1) both; }
  .entrada-palabras, .entrada-cascada, .entrada-zoom-fondo { animation: presFade 0.6s ease both; }
  .palabra { animation: presPalabra 0.7s cubic-bezier(0.16,1,0.3,1) both; }
  .cascada-item { animation: presItem 0.7s cubic-bezier(0.16,1,0.3,1) both; }
  .deck-fondo-zoom { animation: presZoomFondo 1.6s cubic-bezier(0.16,1,0.3,1) both; }
  .flota-3d { animation: presFlota 7s ease-in-out infinite; }
  .deck-punto { animation: presPulso 2s ease-in-out infinite; }
  .deck-progreso-avance { transition: width 0.45s cubic-bezier(0.22,1,0.36,1); }
}

@keyframes presFadeUp {
  from { opacity: 0; transform: translateY(36px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes presFade {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes presEscala {
  from { opacity: 0; transform: scale(0.82); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes presBarrido {
  from { opacity: 0; transform: translateX(clamp(40px, 8vw, 120px)); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes presPalabra {
  from { opacity: 0; transform: translateY(0.6em) rotate(2deg); }
  to   { opacity: 1; transform: translateY(0) rotate(0deg); }
}
@keyframes presItem {
  from { opacity: 0; transform: translateY(30px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes presZoomFondo {
  from { transform: scale(1.12); }
  to   { transform: scale(1); }
}
@keyframes presFlota {
  0%, 100% { transform: perspective(1100px) rotateY(-9deg) rotateX(4deg) translateY(0); }
  50%      { transform: perspective(1100px) rotateY(-9deg) rotateX(4deg) translateY(-12px); }
}
@keyframes presPulso {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%      { opacity: 0.4; transform: scale(0.85); }
}
`;

export default function DeckClient({ mercado }: { mercado: Mercado }) {
  const slides: readonly Slide[] = mercado === "mx" ? slidesMX : slidesUS;
  const total = slides.length;
  const [indice, setIndice] = useState(0);
  const [enPantallaCompleta, setEnPantallaCompleta] = useState(false);
  const toqueX = useRef<number | null>(null);

  const avanzar = useCallback(
    () => setIndice((i) => Math.min(total - 1, i + 1)),
    [total],
  );
  const retroceder = useCallback(() => setIndice((i) => Math.max(0, i - 1)), []);

  const alternarPantalla = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
    } else {
      void document.documentElement.requestFullscreen().catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        avanzar();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        retroceder();
      } else if (e.key === "Home") {
        e.preventDefault();
        setIndice(0);
      } else if (e.key === "End") {
        e.preventDefault();
        setIndice(total - 1);
      } else if (e.key === "f" || e.key === "F") {
        alternarPantalla();
      }
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [avanzar, retroceder, alternarPantalla, total]);

  useEffect(() => {
    const alCambiar = () => setEnPantallaCompleta(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", alCambiar);
    return () => document.removeEventListener("fullscreenchange", alCambiar);
  }, []);

  /* Precarga de fondos: al cambiar de slide la foto ya está en caché. */
  useEffect(() => {
    const fondos = slides
      .map((s) => s.fondo)
      .filter((f): f is string => f !== null);
    Array.from(new Set(fondos)).forEach((src) => {
      const img = new window.Image();
      img.src = src;
    });
  }, [slides]);

  const alTocar = (e: React.TouchEvent) => {
    toqueX.current = e.touches[0]?.clientX ?? null;
  };
  const alSoltar = (e: React.TouchEvent) => {
    const inicio = toqueX.current;
    toqueX.current = null;
    const fin = e.changedTouches[0]?.clientX;
    if (inicio === null || fin === undefined) return;
    const delta = fin - inicio;
    if (Math.abs(delta) < UMBRAL_SWIPE_PX) return;
    if (delta < 0) {
      avanzar();
    } else {
      retroceder();
    }
  };

  const slide = slides[Math.min(indice, total - 1)];

  return (
    <main className="deck-raiz" onTouchStart={alTocar} onTouchEnd={alSoltar}>
      <style>{CSS_DECK}</style>

      <div
        key={`fondo-${indice}`}
        aria-hidden="true"
        className={`deck-fondo${slide.entrada === "zoom-fondo" ? " deck-fondo-zoom" : ""}`}
        style={slide.fondo ? { backgroundImage: `url(${slide.fondo})` } : undefined}
      />
      <div aria-hidden="true" className="deck-velo" />

      <section
        key={`slide-${indice}`}
        className={`deck-slide entrada-${slide.entrada}`}
        aria-label={`${slide.nombre} — diapositiva ${indice + 1} de ${total}`}
      >
        <div className="deck-centro">{slide.contenido}</div>
      </section>

      <nav className="deck-chrome" aria-label="Controles de la presentación">
        <div className="deck-progreso">
          <div
            className="deck-progreso-avance"
            style={{ width: `${((indice + 1) / total) * 100}%` }}
          />
        </div>
        <div className="deck-controles">
          <span className="deck-contador tabular">
            {indice + 1} / {total}
          </span>
          <span className="deck-pista hidden sm:inline">
            ← → para navegar · F pantalla completa
          </span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              className="deck-boton-chrome"
              onClick={alternarPantalla}
              aria-label={
                enPantallaCompleta ? "Salir de pantalla completa" : "Pantalla completa"
              }
            >
              ⛶
              <span className="hidden text-sm sm:inline">
                {enPantallaCompleta ? "Salir" : "Pantalla completa"}
              </span>
            </button>
            <button
              type="button"
              className="deck-boton-chrome"
              onClick={retroceder}
              disabled={indice === 0}
              aria-label="Diapositiva anterior"
            >
              ←
            </button>
            <button
              type="button"
              className="deck-boton-chrome"
              onClick={avanzar}
              disabled={indice === total - 1}
              aria-label="Diapositiva siguiente"
            >
              →
            </button>
          </div>
        </div>
      </nav>
    </main>
  );
}
