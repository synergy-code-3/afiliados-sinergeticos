"use client";

import { useState } from "react";

/** Sección "Tus premios" — la ruta de premios con imagen por nodo.
 * Evoluciona la escalera de panel-client (sesión 17): mismo carril `.ruta-*`
 * y mismo cálculo de avance, ahora cada premio es tarjeta con imagen 16:9.
 * Si la imagen no existe todavía, se ve el degradado de respaldo. */

const PREMIOS = [
  { meta: 10, premio: "Renovación del Club Sinergético", imagen: "/premios/premio-10.webp" },
  { meta: 20, premio: "Pase Black a Synergy Unlimited", imagen: "/premios/premio-20.webp" },
  { meta: 50, premio: "Viaje a Nueva York con Jorge Serratos", imagen: "/premios/premio-50.webp" },
  { meta: 100, premio: "Mastermind + 3 boletos VIP", imagen: "/premios/premio-100.webp" },
] as const;

export default function SeccionPremios({ cerrados }: { cerrados: number }) {
  const [sinImagen, setSinImagen] = useState<Record<number, boolean>>({});
  const siguientePremio = PREMIOS.find((p) => cerrados < p.meta);
  const faltanPara = siguientePremio ? siguientePremio.meta - cerrados : 0;

  /** Hasta dónde llega la barra de la ruta, en %.
   *
   * Los nodos caen en el centro de su columna, así que la barra tiene que
   * caminar DE NODO A NODO — no de cero. Si midiera cerrados/meta-final, con
   * 12 de 100 se vería casi vacía aunque ya se ganó el primer premio. */
  const avanceRuta = (() => {
    const n = PREMIOS.length;
    const centro = (i: number) => ((i + 0.5) / n) * 100;
    const idx = PREMIOS.findIndex((p) => cerrados < p.meta);
    if (idx === -1) return 100; // los ganó todos
    const metaAnterior = idx === 0 ? 0 : PREMIOS[idx - 1].meta;
    const desde = idx === 0 ? 0 : centro(idx - 1);
    const tramo = PREMIOS[idx].meta - metaAnterior;
    const recorrido = tramo > 0 ? (cerrados - metaAnterior) / tramo : 0;
    return desde + Math.max(0, Math.min(1, recorrido)) * (centro(idx) - desde);
  })();

  return (
    <section className="mt-12">
      <p className="sec-tag mb-1">Tus premios</p>
      <h2 className="text-xl font-bold">
        {siguientePremio ? `Vas por ${siguientePremio.premio}` : "Ganaste todos los premios"}
      </h2>
      <p className="mt-1 text-sm text-white/55">
        {siguientePremio ? (
          <>
            Te {faltanPara === 1 ? "falta" : "faltan"}{" "}
            <span className="font-bold text-[#19e16d]">
              {faltanPara} {faltanPara === 1 ? "persona" : "personas"}
            </span>{" "}
            que compren para ganártelo. Los premios se ganan por invitados que compran, no solo
            por inscribirlos.
          </>
        ) : (
          "Llegaste al último nivel de la escalera."
        )}
      </p>

      <div className="glass ruta mt-6 p-6 sm:p-8">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
          <p className="text-sm text-white/55">Tu avance por la escalera</p>
          <div className="text-right">
            <p className="text-3xl font-extrabold leading-none tabular">{cerrados}</p>
            <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white/35">
              ya compraron
            </p>
          </div>
        </div>

        <div className="relative pt-2">
          {/* el carril y el avance solo existen en horizontal; en móvil la
              escalera se lee como lista y sobran */}
          <div className="ruta-carril" aria-hidden="true" />
          <div className="ruta-avance" style={{ width: `${avanceRuta}%` }} aria-hidden="true" />

          <div className="relative grid gap-6 sm:grid-cols-4 sm:gap-4">
            {PREMIOS.map((p) => {
              const logrado = cerrados >= p.meta;
              const esActual = siguientePremio?.meta === p.meta;
              const estado = logrado ? "es-logrado" : esActual ? "es-actual" : "es-futuro";
              return (
                <div
                  key={p.meta}
                  className="flex items-start gap-4 sm:flex-col sm:items-center sm:gap-4"
                >
                  <div className={`ruta-nodo ${estado}`}>
                    {logrado ? (
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    ) : (
                      p.meta
                    )}
                  </div>

                  <article className={`prem-tarjeta ${estado} min-w-0 flex-1 sm:w-full sm:flex-none`}>
                    <div className="prem-imagen">
                      <span className="prem-fallback" aria-hidden="true">
                        {p.meta}
                      </span>
                      {!sinImagen[p.meta] ? (
                        <img
                          src={p.imagen}
                          alt={p.premio}
                          loading="lazy"
                          onError={() => setSinImagen((prev) => ({ ...prev, [p.meta]: true }))}
                        />
                      ) : null}
                    </div>
                    <div className="p-4 text-left sm:text-center">
                      <p
                        className={`text-[10.5px] font-bold uppercase tracking-[0.14em] tabular ${
                          logrado ? "text-[#19e16d]" : esActual ? "text-white/80" : "text-white/30"
                        }`}
                      >
                        {logrado
                          ? "Logrado ✓"
                          : esActual
                            ? `${cerrados} de ${p.meta}`
                            : `Meta · ${p.meta}`}
                      </p>
                      <p
                        className={`mt-1.5 text-sm font-bold leading-snug ${
                          logrado || esActual ? "text-white" : "text-white/45"
                        }`}
                      >
                        {p.premio}
                      </p>
                    </div>
                  </article>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        .prem-tarjeta {
          overflow: hidden;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.03);
        }
        .prem-tarjeta.es-logrado { border-color: rgba(25, 225, 109, 0.35); }
        .prem-tarjeta.es-actual {
          border-color: rgba(25, 225, 109, 0.6);
          box-shadow: 0 0 0 4px rgba(25, 225, 109, 0.1);
        }
        .prem-tarjeta.es-futuro { opacity: 0.55; }
        .prem-tarjeta.es-futuro .prem-imagen img { filter: grayscale(0.45) brightness(0.85); }
        .prem-imagen {
          position: relative;
          aspect-ratio: 16 / 9;
          display: grid; place-items: center;
          overflow: hidden;
          background: radial-gradient(120% 120% at 20% 0%, #14251c 0%, #0a120d 55%, #050a07 100%);
        }
        .prem-imagen img {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          object-fit: cover;
        }
        .prem-fallback {
          font-size: 56px; font-weight: 900; line-height: 1;
          font-variant-numeric: tabular-nums;
          color: rgba(217, 180, 91, 0.16);
          pointer-events: none; user-select: none;
        }
        @media (prefers-reduced-motion: no-preference) {
          @keyframes prem-anillo {
            0%, 100% { box-shadow: 0 0 0 4px rgba(25, 225, 109, 0.1); }
            50%      { box-shadow: 0 0 0 9px rgba(25, 225, 109, 0.04); }
          }
          .prem-tarjeta.es-actual { animation: prem-anillo 2.6s ease-in-out infinite; }
        }
      `}</style>
    </section>
  );
}
