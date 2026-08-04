"use client";

import type { ReactNode } from "react";

/** Sección "Mejores prácticas · maximiza tus resultados" — las prácticas que
 * dictó Manuel, en voz de compañero a compañero. Contenido estático. */

interface Practica {
  titulo: string;
  detalle: string;
  ejemplo: string;
  icono: ReactNode;
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

const PRACTICAS: Practica[] = [
  {
    titulo: "Platícale del tamaño del evento",
    detalle:
      "Este evento es GRANDE y transformador — que se note cuando lo cuentes. No lo cuentes chiquito: dile lo que se vive ahí.",
    ejemplo: "Ej: «Esto no es una plática más — es un evento en grande, de los que te cambian el chip.»",
    icono: (
      <Icono>
        <path d="m3 11 18-5v12L3 14v-3z" />
        <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
      </Icono>
    ),
  },
  {
    titulo: "Cuéntale TU historia",
    detalle:
      "Tú eres un caso de éxito real. Nadie puede contar tu historia como tú: dónde estabas antes y qué cambió después.",
    ejemplo: "Ej: «Yo llegué sin saber nada de esto, y hoy mi negocio es otro. Por eso te lo comparto.»",
    icono: (
      <Icono>
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </Icono>
    ),
  },
  {
    titulo: "Comparte lo que amas de la comunidad",
    detalle:
      "La comunidad es lo que hace diferente a Sinergéticos. Platícale de la gente, del ambiente, de cómo se siente pertenecer.",
    ejemplo:
      "Ej: «Lo que más me gusta es la gente — llegas solo y sales con amigos que van hacia el mismo lado.»",
    icono: (
      <Icono>
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </Icono>
    ),
  },
  {
    titulo: "Dile cuánto te ha servido a ti",
    detalle:
      "Lo que a ti te funcionó es tu mejor argumento. Sé concreto: qué aprendiste, qué aplicaste, qué cambió.",
    ejemplo:
      "Ej: «Este evento me cambió la forma de ver mi negocio — quiero que lo vivas tú también.»",
    icono: (
      <Icono>
        <path d="M22 7 13.5 15.5 8.5 10.5 2 17" />
        <path d="M16 7h6v6" />
      </Icono>
    ),
  },
  {
    titulo: "Compartes, no vendes",
    detalle:
      "Recuérdale (y recuérdate) que le estás compartiendo algo bueno, no vendiéndole nada. Su pase es un regalo de cortesía.",
    ejemplo: "Ej: «No te estoy vendiendo nada — tu pase va por mi cuenta. Solo quiero que lo vivas.»",
    icono: (
      <Icono>
        <rect x="3" y="8" width="18" height="4" rx="1" />
        <path d="M12 8v13" />
        <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
        <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
      </Icono>
    ),
  },
  {
    titulo: "Acompáñalo",
    detalle:
      "Confírmale un día antes y llega con él al evento. Llegar acompañado lo cambia todo: nadie se anima igual yendo solo.",
    ejemplo: "Ej: «Mañana es el día — paso por ti y nos vamos juntos, ¿va?»",
    icono: (
      <Icono>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <path d="M3 10h18" />
        <path d="m9 16 2 2 4-4" />
      </Icono>
    ),
  },
  {
    titulo: "Sé genuino SIEMPRE",
    detalle:
      "Si no lo sientes, no lo digas. La gente nota cuando hablas de verdad — y también cuando no.",
    ejemplo: "Ej: si algo no te consta, mejor: «Eso no me tocó vivirlo a mí, pero te presento a alguien que sí.»",
    icono: (
      <Icono>
        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1 1 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
        <path d="m9 12 2 2 4-4" />
      </Icono>
    ),
  },
];

const EVITA = [
  {
    titulo: "No presiones",
    detalle: "Si hoy no es su momento, está bien. Una invitación se disfruta; una insistencia se aguanta.",
  },
  {
    titulo: "No prometas resultados garantizados",
    detalle: "Comparte posibilidades, no garantías. Cada quien vive su propio proceso.",
  },
  {
    titulo: "No lo dejes solo el día del evento",
    detalle: "Tu invitado llegó por ti. Estar ahí con él es la mitad de la experiencia.",
  },
] as const;

export default function SeccionPracticas() {
  return (
    <section className="mt-12">
      <p className="sec-tag mb-1">Mejores prácticas</p>
      <h2 className="text-xl font-bold">Maximiza tus resultados</h2>
      <p className="mt-1 text-sm text-white/55">
        Lo que mejor les funciona a los afiliados que más invitados llevan — de compañero a
        compañero.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PRACTICAS.map((p, i) => (
          <article
            key={p.titulo}
            className="glass mp-tarjeta flex flex-col p-6"
            style={{ animationDelay: `${i * 0.07}s` }}
          >
            <span className="mp-icono">{p.icono}</span>
            <h3 className="mt-4 text-base font-bold">{p.titulo}</h3>
            <p className="mt-1.5 text-[15px] leading-relaxed text-white/60">{p.detalle}</p>
            <p className="mt-4 border-l-2 border-[#19e16d]/40 pl-3 text-sm italic leading-relaxed text-white/70">
              {p.ejemplo}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-10">
        <h3 className="text-base font-bold text-[#ffb2b2]">Evita esto</h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          {EVITA.map((e) => (
            <div key={e.titulo} className="mp-evita p-5">
              <span className="mp-evita-icono">
                <Icono>
                  <circle cx="12" cy="12" r="10" />
                  <path d="m15 9-6 6" />
                  <path d="m9 9 6 6" />
                </Icono>
              </span>
              <p className="mt-3 font-bold">{e.titulo}</p>
              <p className="mt-1 text-sm leading-relaxed text-white/55">{e.detalle}</p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .mp-icono {
          flex: none; display: grid; place-items: center;
          width: 44px; height: 44px; border-radius: 14px;
          color: #19e16d;
          background: rgba(25, 225, 109, 0.1);
          border: 1px solid rgba(25, 225, 109, 0.18);
        }
        .mp-evita {
          border-radius: 16px;
          border: 1px solid rgba(255, 178, 178, 0.22);
          background: rgba(255, 178, 178, 0.05);
        }
        .mp-evita-icono {
          display: grid; place-items: center;
          width: 44px; height: 44px; border-radius: 14px;
          color: #ffb2b2;
          background: rgba(255, 178, 178, 0.08);
          border: 1px solid rgba(255, 178, 178, 0.2);
        }
        @media (prefers-reduced-motion: no-preference) {
          @keyframes mp-entrada {
            from { opacity: 0; transform: translateY(18px); }
          }
          .mp-tarjeta {
            animation: mp-entrada 0.7s cubic-bezier(0.16, 1, 0.3, 1) backwards;
            transition: transform 0.3s ease;
          }
          @media (hover: hover) {
            .mp-tarjeta:hover { transform: translateY(-4px); }
          }
        }
      `}</style>
    </section>
  );
}
