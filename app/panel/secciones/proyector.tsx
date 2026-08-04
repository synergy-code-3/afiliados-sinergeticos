"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  COMISIONES_PAQUETE,
  PAQUETE_LABEL,
  dinero,
  monedaDe,
  type Geografia,
  type Paquete,
} from "@/lib/comisiones";

/** Rango real comunicado por Manuel (brief 4-ago-2026). Siempre en lenguaje
 * de posibilidad, nunca de garantía. */
const RANGO_VISTO: Record<Geografia, string> = {
  MX: "$30,000 y $65,000 MXN",
  US: "$1,600 y $3,500 USD",
};

const INVITADOS_INICIAL = 10;
const SE_UNEN_INICIAL = 3;
const PAQUETE_INICIAL: Paquete = "6m";
const PAQUETES: readonly Paquete[] = ["3m", "6m", "12m"];

/** Anima un número hacia su objetivo con requestAnimationFrame.
 * Si el sistema pide menos movimiento, salta directo al resultado. */
function useConteo(objetivo: number): number {
  const [valor, setValor] = useState(objetivo);
  const desdeRef = useRef(objetivo);

  useEffect(() => {
    const desde = desdeRef.current;
    desdeRef.current = objetivo;
    if (desde === objetivo) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValor(objetivo);
      return;
    }
    const inicio = performance.now();
    const duracion = 650;
    let raf = 0;
    const paso = (ahora: number) => {
      const t = Math.min(1, (ahora - inicio) / duracion);
      const suave = 1 - Math.pow(1 - t, 3);
      setValor(Math.round(desde + (objetivo - desde) * suave));
      if (t < 1) raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [objetivo]);

  return valor;
}

function Deslizador({
  id,
  etiqueta,
  valorTexto,
  min,
  max,
  valor,
  onCambio,
}: {
  id: string;
  etiqueta: string;
  valorTexto: string;
  min: number;
  max: number;
  valor: number;
  onCambio: (v: number) => void;
}) {
  const pct = ((valor - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <label htmlFor={id} className="label !mb-0">
          {etiqueta}
        </label>
        <p className="shrink-0 text-lg font-extrabold tabular text-[#19e16d]">{valorTexto}</p>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={1}
        value={valor}
        onChange={(e) => onCambio(Number(e.target.value))}
        className="proy-slider mt-2"
        style={{ "--pct": `${pct}%` } as CSSProperties}
      />
    </div>
  );
}

export default function Proyector({ geografiaInicial }: { geografiaInicial: Geografia }) {
  const [geografia, setGeografia] = useState<Geografia>(geografiaInicial);
  const [invitados, setInvitados] = useState(INVITADOS_INICIAL);
  const [seUnen, setSeUnen] = useState(SE_UNEN_INICIAL);
  const [paquete, setPaquete] = useState<Paquete>(PAQUETE_INICIAL);

  const moneda = monedaDe(geografia);
  const comision = COMISIONES_PAQUETE[geografia][paquete];
  const mensualCents = Math.round((comision * invitados * seUnen) / 10);
  const mensualAnimado = useConteo(mensualCents);
  const personas = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 1 }).format(
    (invitados * seUnen) / 10,
  );

  return (
    <section className="proy-anima">
      <style>{ESTILOS}</style>
      <p className="sec-tag mb-1">Haz cuentas</p>
      <h2 className="text-xl font-bold">Tu utilidad proyectada</h2>
      <p className="mt-1 text-sm text-white/55">
        Mueve las palancas y mira lo que tu esfuerzo puede pagar cada mes.
      </p>

      <div className="glass mt-6 space-y-8 p-6 sm:p-8">
        <div>
          <p className="label">¿Dónde es tu evento?</p>
          <div className="flex flex-wrap gap-3" role="group" aria-label="Dónde es tu evento">
            <button
              type="button"
              onClick={() => setGeografia("MX")}
              aria-pressed={geografia === "MX"}
              className={`proy-chip btn-press ${geografia === "MX" ? "es-activa" : ""}`}
            >
              🇲🇽 México · pesos
            </button>
            <button
              type="button"
              onClick={() => setGeografia("US")}
              aria-pressed={geografia === "US"}
              className={`proy-chip btn-press ${geografia === "US" ? "es-activa" : ""}`}
            >
              🇺🇸 USA · dólares
            </button>
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          <Deslizador
            id="proy-invitados"
            etiqueta="Personas que invitarás al mes"
            valorTexto={`${invitados} ${invitados === 1 ? "persona" : "personas"}`}
            min={1}
            max={50}
            valor={invitados}
            onCambio={setInvitados}
          />
          <Deslizador
            id="proy-se-unen"
            etiqueta="De cada 10, ¿cuántas se unen al Club?"
            valorTexto={`${seUnen} de cada 10`}
            min={1}
            max={10}
            valor={seUnen}
            onCambio={setSeUnen}
          />
        </div>

        <div>
          <p className="label">Paquete típico que compran</p>
          <div className="flex flex-wrap gap-3" role="group" aria-label="Paquete típico que compran">
            {PAQUETES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPaquete(p)}
                aria-pressed={paquete === p}
                className={`proy-chip btn-press ${paquete === p ? "es-activa" : ""}`}
              >
                <span className="block font-bold">{PAQUETE_LABEL[p]}</span>
                <span className="mt-0.5 block text-xs opacity-70">
                  {dinero(COMISIONES_PAQUETE[geografia][p], moneda)} para ti
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="proy-resultado p-6 text-center sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">
            Tu utilidad proyectada
          </p>
          <p className="mt-2 text-5xl font-extrabold leading-none tabular text-[#19e16d] sm:text-6xl">
            {dinero(mensualAnimado, moneda)}
          </p>
          <p className="mt-3 text-sm font-semibold text-white/70">
            al mes · ≈ {personas} {personas === "1" ? "persona uniéndose" : "personas uniéndose"} al Club
          </p>
          <p className="mt-4 text-lg text-white/70">
            Al año:{" "}
            <span className="font-extrabold tabular text-white">
              {dinero(mensualAnimado * 12, moneda)}
            </span>
          </p>
          <p className="mt-5 text-sm font-semibold text-[#d9b45b]">
            Hemos visto afiliados generando entre {RANGO_VISTO[geografia]} al mes.
          </p>
          <p className="mt-2 text-xs text-white/40">Proyección ilustrativa, no una garantía.</p>
        </div>
      </div>
    </section>
  );
}

/* Estilos propios del proyector. Usan los tokens neumórficos de globals.css
 * con valores de respaldo, para verse bien aunque el re-skin global aún no
 * haya aterrizado. Sombras siempre por clase, nunca inline (lección BGI). */
const ESTILOS = `
.proy-resultado {
  border-radius: var(--radius, 18px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: var(--surface, rgba(255, 255, 255, 0.05));
  box-shadow:
    -6px -6px 14px var(--neu-luz, rgba(46, 66, 56, 0.55)),
    8px 8px 18px var(--neu-sombra, rgba(2, 6, 4, 0.85));
}

.proy-chip {
  min-height: 48px;
  padding: 10px 18px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: var(--surface, rgba(255, 255, 255, 0.05));
  color: rgba(255, 255, 255, 0.72);
  font-size: 15px;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  box-shadow:
    -4px -4px 10px var(--neu-luz, rgba(46, 66, 56, 0.45)),
    6px 6px 14px var(--neu-sombra, rgba(2, 6, 4, 0.75));
  transition: box-shadow 0.2s, color 0.2s, border-color 0.2s;
}
.proy-chip.es-activa {
  color: #19e16d;
  border-color: rgba(25, 225, 109, 0.45);
  box-shadow:
    inset 4px 4px 10px var(--neu-sombra, rgba(2, 6, 4, 0.75)),
    inset -3px -3px 8px var(--neu-luz, rgba(46, 66, 56, 0.45));
}

.proy-slider {
  -webkit-appearance: none;
  appearance: none;
  display: block;
  width: 100%;
  height: 52px;
  margin: 0;
  background: transparent;
  cursor: pointer;
}
.proy-slider:focus-visible { outline-offset: 6px; }
.proy-slider::-webkit-slider-runnable-track {
  height: 14px;
  border-radius: 99px;
  background: linear-gradient(
    90deg,
    #19e16d var(--pct, 50%),
    rgba(255, 255, 255, 0.06) var(--pct, 50%)
  );
  box-shadow:
    inset 3px 3px 7px var(--neu-sombra, rgba(2, 6, 4, 0.75)),
    inset -2px -2px 6px var(--neu-luz, rgba(46, 66, 56, 0.35));
}
.proy-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 44px;
  height: 44px;
  margin-top: -15px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background:
    radial-gradient(circle at 50% 50%, #19e16d 0 9px, transparent 10px),
    linear-gradient(145deg, #1a2420, #0c1210);
  box-shadow:
    -4px -4px 10px var(--neu-luz, rgba(46, 66, 56, 0.5)),
    6px 6px 14px var(--neu-sombra, rgba(2, 6, 4, 0.85));
}
.proy-slider::-moz-range-track {
  height: 14px;
  border-radius: 99px;
  background: rgba(255, 255, 255, 0.06);
  box-shadow:
    inset 3px 3px 7px var(--neu-sombra, rgba(2, 6, 4, 0.75)),
    inset -2px -2px 6px var(--neu-luz, rgba(46, 66, 56, 0.35));
}
.proy-slider::-moz-range-progress {
  height: 14px;
  border-radius: 99px;
  background: #19e16d;
}
.proy-slider::-moz-range-thumb {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background:
    radial-gradient(circle at 50% 50%, #19e16d 0 9px, transparent 10px),
    linear-gradient(145deg, #1a2420, #0c1210);
  box-shadow:
    -4px -4px 10px var(--neu-luz, rgba(46, 66, 56, 0.5)),
    6px 6px 14px var(--neu-sombra, rgba(2, 6, 4, 0.85));
}

@media (prefers-reduced-motion: no-preference) {
  @keyframes proy-entra {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .proy-anima { animation: proy-entra 0.7s cubic-bezier(0.16, 1, 0.3, 1) both; }
}
`;
