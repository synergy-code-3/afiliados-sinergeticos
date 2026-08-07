"use client";

import type { ReactNode } from "react";
import {
  PAQUETE_LABEL,
  comisionPaqueteCents,
  OVERRIDE_PCT,
  VALIDACION_HORAS,
  PAGO_DIAS_HABILES,
  type Paquete,
} from "@/lib/comisiones";
import { Palabras, ImagenPremio, dineroSala, estiloCascada } from "./piezas";
import { GiraDinamica, GiraCompacta } from "./gira";
import MapaGira from "./mapa-gira";

/* ── Tipos ──────────────────────────────────────────────────────────────── */

/** Repertorio de entradas del deck; cada slide declara la suya (por índice). */
export type Entrada =
  | "fade-up"
  | "escala"
  | "barrido"
  | "palabras"
  | "zoom-fondo"
  | "cascada"
  | "fade";

export interface Slide {
  /** Nombre corto, para lectores de pantalla y para orientarse en el código. */
  nombre: string;
  /** Imagen de fondo (16:9 cine) o null → degradado base del deck. */
  fondo: string | null;
  entrada: Entrada;
  /** "suave" deja respirar la foto en los descansos; default = velo fuerte. */
  velo?: "suave";
  /** "claro" = descanso visual con fondo claro y texto oscuro (pedido de Manuel). */
  tema?: "claro";
  contenido: ReactNode;
}

/* ── Datos fijos (fuente: docs/SYNERGY-PLUS-BRIEF.md + feedback de Manuel) ── */

const WA_AYUDA =
  "https://wa.me/12245870935?text=" +
  encodeURIComponent(
    "Hola, Daniel. Soy parte del Programa +1 de Sinergéticos, necesito tu apoyo.",
  );

const GRUPO_WA = "https://chat.whatsapp.com/Eg9V1E5JIEmDlTH9NKdlTU";
const GRUPO_WA_CORTA = "chat.whatsapp.com/Eg9V1E5JIEmDlTH9NKdlTU";

const PCT_EXTRA = Math.round(OVERRIDE_PCT * 100);

/** Escalera de premios por referidos que YA compraron (metas fijas).
 * `historia` es la línea que le da narrativa a cada escalón. */
const PREMIOS = [
  {
    meta: 10,
    historia: "Tu Club se paga solo",
    premio: "Renovación del Club Sinergético",
  },
  {
    meta: 20,
    historia: "El evento más grande del año, en primera fila",
    premio: "Pase Black a Synergy Unlimited",
  },
  {
    meta: 50,
    historia: "Te vas de viaje con Jorge",
    premio: "Nueva York con Jorge Serratos, todo pagado",
  },
  {
    meta: 100,
    historia: "Entras al círculo más cercano",
    premio: "Mastermind + 3 boletos VIP",
  },
] as const;

const PAQUETES: readonly Paquete[] = ["3m", "6m", "12m"];

/** Montos SIEMPRE desde lib/comisiones — referencia EE. UU. primero. */
const usDe = (p: Paquete): string => dineroSala(comisionPaqueteCents("US", p), "USD");
const mxDe = (p: Paquete): string => dineroSala(comisionPaqueteCents("MX", p), "MXN");

/** Casos ilustrativos — los montos se calculan con lib/comisiones.ts. */
interface Caso {
  nombre: string;
  invitados: number;
  unidos: number;
  paquete: Paquete;
}

const CASOS: readonly Caso[] = [
  { nombre: "Laura", invitados: 8, unidos: 3, paquete: "6m" },
  { nombre: "Marco", invitados: 15, unidos: 6, paquete: "3m" },
  { nombre: "Paty", invitados: 30, unidos: 12, paquete: "12m" },
];

/** Ganancias del copy — dictadas por Manuel, referencia EE. UU. La cifra MX
 * NO es una conversión: es la referencia propia del mercado mexicano. */
const GANANCIAS_US = "$2,500 – $5,000 USD";
const GANANCIAS_US_DETALLE = "al mes, extra · desde tu casa · solo con tus conocidos";
const GANANCIAS_MX = "$30,000 – $65,000 MXN al mes";

/** El ecosistema que el público YA vive — la base de la invitación. */
const ECOSISTEMA = [
  ["📚", "Educación", "Las clases y certificaciones del Club, cada semana."],
  ["🎤", "Eventos", "Los seminarios donde has visto inscribirse a cientos de personas."],
  ["🤝", "Comunidad", "Más de 20,000 personas creciendo juntas."],
  ["💼", "Oportunidades", "Como la de hoy: el Programa +1."],
] as const;

/** Título de portada: la promesa entra palabra por palabra. */
const TITULO_PORTADA: readonly { palabra: string; verde?: true }[] = [
  { palabra: "Buscamos" },
  { palabra: "al" },
  { palabra: "siguiente" },
  { palabra: "representante", verde: true },
  { palabra: "de" },
  { palabra: "Sinergéticos" },
  { palabra: "en" },
  { palabra: "TU", verde: true },
  { palabra: "región", verde: true },
];

/* ── Los 23 slides (deck ÚNICO para México y Estados Unidos) ────────────── */

export const SLIDES: readonly Slide[] = [
  /* 1 · Portada — la promesa de la búsqueda */
  {
    nombre: "Portada",
    fondo: "/slides/bg-portada.webp",
    entrada: "palabras",
    contenido: (
      <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
        <div>
          <p className="cascada-item" style={estiloCascada(0)}>
            <span className="sello-suma">1 + 1 = 3</span>
          </p>
          <p className="deck-kicker cascada-item mt-6" style={estiloCascada(1)}>
            Programa +1 · Club Sinergético
          </p>
          <h1 className="deck-titulo mt-4">
            {TITULO_PORTADA.map((p, i) => (
              <span
                key={`${i}-${p.palabra}`}
                className={`palabra${p.verde ? " texto-verde" : ""}`}
                style={{ animationDelay: `${i * 0.09}s` }}
              >
                {p.palabra}
              </span>
            ))}
          </h1>
          <p className="deck-sub cascada-item mt-6 max-w-xl" style={estiloCascada(2)}>
            Con <strong className="text-white">Jorge Serratos</strong> y{" "}
            <strong className="text-white">Manuel de León</strong>
          </p>
        </div>
        <div className="cascada-item" style={estiloCascada(3)}>
          <div className="tarjeta-3d flota-3d pres-card p-6 sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">
                Tu panel · Programa +1
              </span>
              <span className="deck-punto" aria-hidden="true" />
            </div>
            <div className="pres-inset mt-5 p-4">
              <p className="text-sm text-white/60">Tu invitada</p>
              <p className="mt-1 text-lg font-bold">Laura · asistió al Seminario ✓</p>
            </div>
            <div className="pres-inset mt-3 p-4">
              <p className="text-sm text-white/60">Se unió al Club</p>
              <p className="tabular mt-1 text-3xl font-extrabold texto-oro sm:text-4xl">
                +{usDe("6m")}
              </p>
              <p className="mt-1 text-sm text-white/60">
                ({mxDe("6m")} si tu evento es en México) · lista para tu depósito
              </p>
            </div>
          </div>
        </div>
      </div>
    ),
  },

  /* 2 · Cuando algo es bueno, crece — la idea madre del programa */
  {
    nombre: "Cuando algo es bueno",
    fondo: null,
    entrada: "cascada",
    contenido: (
      <>
        <span className="deck-kicker">Por qué estamos aquí</span>
        <div className="mt-8 space-y-8">
          {[
            "Cuando algo es bueno, se comparte.",
            "Cuando se comparte, crece.",
            "Y cuando crece, ganan todos.",
          ].map((frase, i) => (
            <p
              key={frase}
              className={`cascada-item text-[clamp(1.7rem,4vw,3.2rem)] font-extrabold leading-tight ${
                i === 2 ? "texto-verde" : ""
              }`}
              style={estiloCascada(i)}
            >
              {frase}
            </p>
          ))}
        </div>
      </>
    ),
  },

  /* 3 · El ecosistema — lo que ya viven, con nombre */
  {
    nombre: "El ecosistema",
    fondo: null,
    entrada: "fade-up",
    contenido: (
      <>
        <span className="deck-kicker">El ecosistema</span>
        <h2 className="deck-titulo mt-3">Tú ya vives un ecosistema de negocios</h2>
        <p className="deck-sub mt-5 max-w-4xl">
          Un ecosistema de negocios es una comunidad donde todo se conecta para hacerte
          crecer. Suena elegante — pero tú ya sabes lo que es, porque ya estás adentro:
        </p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ECOSISTEMA.map(([icono, titulo, texto], i) => (
            <div key={titulo} className="pres-card cascada-item p-6" style={estiloCascada(i)}>
              <p className="text-4xl" aria-hidden="true">
                {icono}
              </p>
              <p className="mt-4 text-xl font-extrabold leading-snug lg:text-2xl">{titulo}</p>
              <p className="mt-2 text-base leading-relaxed text-white/70 lg:text-lg">{texto}</p>
            </div>
          ))}
        </div>
        <p className="cascada-item mt-7 text-xl font-bold text-white/90 lg:text-2xl" style={estiloCascada(4)}>
          Lo que sigue es natural: <span className="texto-verde">invitar a los tuyos</span> a lo
          que a ti ya te funcionó.
        </p>
      </>
    ),
  },

  /* 4 · Descanso visual I — claro */
  {
    nombre: "Descanso · Trae a los tuyos",
    fondo: null,
    entrada: "zoom-fondo",
    tema: "claro",
    contenido: (
      <div className="text-center">
        <p className="deck-frase-descanso">
          Tú ya estás adentro.
          <br />
          Ahora <span className="texto-verde">trae a los tuyos</span>.
        </p>
      </div>
    ),
  },

  /* 5 · La convocatoria — ¿de qué se trata? */
  {
    nombre: "La convocatoria",
    fondo: null,
    entrada: "fade-up",
    contenido: (
      <>
        <span className="deck-kicker">La convocatoria</span>
        <h2 className="deck-titulo mt-3">¿De qué se trata?</h2>
        <p className="deck-sub mt-5 max-w-4xl">
          Queremos encontrar al siguiente{" "}
          <strong className="text-white">representante de Sinergéticos en tu región</strong>.
          Desde hoy eres candidato — y el camino empieza con tus +1:
        </p>
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {[
            [
              "🤝",
              "Invitas a tus +1",
              "A la gente que quieres ver crecer contigo: familia, amigos, tu equipo.",
            ],
            [
              "🎟️",
              "Reciben un Pase de Invitado Especial de cortesía",
              "Su pase al Seminario de Emprendedor a Empresario Digital les llega por WhatsApp, sin costo.",
            ],
            [
              "💰",
              "Tú ganas cuando se unen al Club",
              "Si tu invitado se une al Club Sinergético, hay una comisión para ti.",
            ],
          ].map(([icono, titulo, texto], i) => (
            <div key={titulo} className="pres-card cascada-item p-7" style={estiloCascada(i)}>
              <p className="text-4xl" aria-hidden="true">
                {icono}
              </p>
              <p className="mt-4 text-2xl font-extrabold leading-snug">{titulo}</p>
              <p className="mt-3 text-lg leading-relaxed text-white/70">{texto}</p>
            </div>
          ))}
        </div>
      </>
    ),
  },

  /* 6 · La filosofía +1 */
  {
    nombre: "La filosofía +1",
    fondo: null,
    entrada: "fade",
    contenido: (
      <div className="text-center">
        <p className="deck-ecuacion tabular">
          1 + 1 = <span className="texto-verde">3</span>
        </p>
        <p className="deck-sub mx-auto mt-10 max-w-3xl text-[clamp(1.2rem,2.4vw,1.8rem)]">
          Sé el <strong className="text-white">+1</strong> de alguien más: juntos logran algo
          más grande — y tú ganas con ello.
        </p>
      </div>
    ),
  },

  /* 7 · ¿Cuánto podrías ganar? — referencia EE. UU., y la cifra de México junto */
  {
    nombre: "¿Cuánto podrías ganar?",
    fondo: "/slides/bg-ganancias.webp",
    entrada: "escala",
    contenido: (
      <div className="text-center">
        <p className="deck-cifra tabular texto-oro">{GANANCIAS_US}</p>
        <p className="mt-4 text-[clamp(1.3rem,2.8vw,2.2rem)] font-bold text-white/90">
          {GANANCIAS_US_DETALLE}
        </p>
        <p className="tabular mx-auto mt-8 inline-block rounded-full bg-white/10 px-7 py-3 text-[clamp(1.05rem,2vw,1.6rem)] font-bold text-white/90">
          🇲🇽 En eventos de México: {GANANCIAS_MX}
        </p>
        <p className="deck-sub mx-auto mt-8 max-w-3xl">
          Personas reales de la comunidad ya lo están generando. Es una posibilidad real — lo
          que tú generes depende de ti.
        </p>
      </div>
    ),
  },

  /* 8 · Descanso visual II — claro */
  {
    nombre: "Descanso · Tu +1",
    fondo: null,
    entrada: "zoom-fondo",
    tema: "claro",
    contenido: (
      <div className="text-center">
        <p className="deck-frase-descanso">
          Tu +1 te está <span className="texto-verde">esperando</span>.
        </p>
      </div>
    ),
  },

  /* 9 · Es fácil */
  {
    nombre: "Es fácil",
    fondo: null,
    entrada: "fade-up",
    contenido: (
      <>
        <span className="deck-kicker">Sin complicaciones</span>
        <h2 className="deck-titulo mt-3">Es fácil — cualquiera puede</h2>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {[
            [
              "No necesitas experiencia",
              "Aquí no se vende: se invita. Y eso ya lo haces todos los días.",
            ],
            [
              "El pase se manda solo",
              "Registras a tu invitado y el sistema le envía su Pase de Invitado Especial por WhatsApp, al instante.",
            ],
            [
              "Nosotros cerramos en el evento",
              "El equipo hace su parte en el Seminario. La tuya es que tu +1 llegue.",
            ],
          ].map(([titulo, texto], i) => (
            <div key={titulo} className="pres-card cascada-item p-7" style={estiloCascada(i)}>
              <p className="text-2xl font-extrabold leading-snug">{titulo}</p>
              <p className="mt-3 text-lg leading-relaxed text-white/70">{texto}</p>
            </div>
          ))}
        </div>
      </>
    ),
  },

  /* 10 · ¿Qué tienes que hacer? */
  {
    nombre: "¿Qué tienes que hacer?",
    fondo: null,
    entrada: "cascada",
    contenido: (
      <>
        <h2 className="deck-titulo">¿Qué tienes que hacer?</h2>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {[
            ["Invita a tu +1", "Al Seminario de Emprendedor a Empresario Digital."],
            [
              "Confirma que asista",
              "Su Pase de Invitado Especial de cortesía es GRATIS — se lo mandamos nosotros.",
            ],
            ["Cobra tu comisión", "Si tu invitado se une al Club, esa comisión es tuya."],
          ].map(([titulo, texto], i) => (
            <div
              key={titulo}
              className="pres-card cascada-item relative overflow-hidden p-7 pt-24"
              style={estiloCascada(i)}
            >
              <span aria-hidden="true" className="paso-marca">
                {i + 1}
              </span>
              <p className="relative text-2xl font-extrabold">{titulo}</p>
              <p className="relative mt-3 text-lg leading-relaxed text-white/70">{texto}</p>
            </div>
          ))}
        </div>
      </>
    ),
  },

  /* 11 · Tutorial del portal */
  {
    nombre: "Tutorial del portal",
    fondo: "/slides/bg-seminario.webp",
    entrada: "barrido",
    contenido: (
      <>
        <span className="deck-kicker">Tutorial</span>
        <h2 className="deck-titulo mt-3">Así se genera el pase de cortesía</h2>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          <div className="pres-card cascada-item p-6" style={estiloCascada(0)}>
            <p className="paso-chip">1</p>
            <p className="mt-4 text-xl font-bold">Entras al portal</p>
            <div className="pres-inset mt-4 flex items-center gap-2.5 px-4 py-3">
              <span className="h-2.5 w-2.5 flex-none rounded-full bg-[#19e16d]" aria-hidden="true" />
              <span className="truncate font-mono text-sm text-white/80">
                afiliados.sinergeticos.com
              </span>
            </div>
          </div>
          <div className="pres-card cascada-item p-6" style={estiloCascada(1)}>
            <p className="paso-chip">2</p>
            <p className="mt-4 text-xl font-bold">Llenas los datos de tu invitado</p>
            <div className="mt-4 space-y-2.5">
              <div className="pres-inset px-4 py-2.5 text-sm text-white/60">Nombre</div>
              <div className="pres-inset px-4 py-2.5 text-sm text-white/60">WhatsApp</div>
              <div className="pres-inset px-4 py-2.5 text-sm text-white/40">Correo · opcional</div>
              <div className="rounded-xl bg-[#19e16d] px-4 py-2.5 text-center text-sm font-extrabold text-black">
                Enviar Pase de Invitado Especial →
              </div>
            </div>
          </div>
          <div className="pres-card cascada-item p-6" style={estiloCascada(2)}>
            <p className="paso-chip">3</p>
            <p className="mt-4 text-xl font-bold">Su pase llega por WhatsApp</p>
            <div className="mt-4">
              <div className="burbuja-wa">
                🎟️ ¡Tu Pase de Invitado Especial está listo! Te esperamos en el Seminario.
              </div>
              <p className="mt-2 text-right text-xs text-white/45">al instante ✓✓</p>
            </div>
          </div>
        </div>
      </>
    ),
  },

  /* 12 · Descanso visual III — claro */
  {
    nombre: "Descanso · 1+1=3",
    fondo: null,
    entrada: "zoom-fondo",
    tema: "claro",
    contenido: (
      <div className="text-center">
        <p className="deck-frase-descanso tabular">
          1 + 1 = <span className="texto-verde">3</span>
        </p>
      </div>
    ),
  },

  /* 13 · Proyecciones — en las DOS monedas, referencia EE. UU. */
  {
    nombre: "Proyecciones",
    fondo: null,
    entrada: "fade",
    contenido: (
      <>
        <div className="flex flex-wrap items-center gap-4">
          <h2 className="deck-titulo">Proyecciones reales</h2>
          <span className="etiqueta-nota">Ejemplos ilustrativos</span>
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {CASOS.map((c, i) => (
            <div key={c.nombre} className="pres-card cascada-item p-7" style={estiloCascada(i)}>
              <p className="text-xl font-extrabold">{c.nombre}</p>
              <p className="mt-2 text-lg text-white/70">
                Llevó {c.invitados} invitados · {c.unidos} se unieron al Club
              </p>
              <p className="tabular mt-5 text-3xl font-extrabold texto-verde lg:text-4xl">
                🇺🇸 {dineroSala(c.unidos * comisionPaqueteCents("US", c.paquete), "USD")}
              </p>
              <p className="tabular mt-2 text-xl font-bold text-white/80 lg:text-2xl">
                🇲🇽 {dineroSala(c.unidos * comisionPaqueteCents("MX", c.paquete), "MXN")}
              </p>
              <p className="mt-2 text-sm text-white/50">
                {c.unidos} × {PAQUETE_LABEL[c.paquete]}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-lg text-white/60">
          La moneda la define el evento: en Estados Unidos ganas en dólares, en México en
          pesos. Cada historia es distinta — esto muestra cómo suma, no cuánto te toca.
        </p>
      </>
    ),
  },

  /* 14 · El esquema de comisiones — SIEMPRE antes de los premios */
  {
    nombre: "El esquema de comisiones",
    fondo: null,
    entrada: "barrido",
    contenido: (
      <>
        <span className="deck-kicker deck-kicker-oro">Dinero claro</span>
        <h2 className="deck-titulo mt-3">El esquema de comisiones</h2>
        <div className="pres-card mt-8 overflow-x-auto p-4 sm:p-6">
          <table className="w-full min-w-[560px] text-left text-lg lg:text-2xl">
            <thead>
              <tr className="text-sm uppercase tracking-[0.14em] text-white/50 lg:text-base">
                <th className="px-4 py-3 font-bold">Si tu invitado se une a…</th>
                <th className="px-4 py-3 text-right font-bold">🇺🇸 Evento en EE. UU.</th>
                <th className="px-4 py-3 text-right font-bold">🇲🇽 Evento en México</th>
              </tr>
            </thead>
            <tbody>
              {PAQUETES.map((p) => (
                <tr key={p} className="border-t border-white/10">
                  <td className="px-4 py-4 font-bold">{PAQUETE_LABEL[p]}</td>
                  <td className="tabular px-4 py-4 text-right font-extrabold texto-oro">
                    {usDe(p)}
                  </td>
                  <td className="tabular px-4 py-4 text-right font-extrabold text-white/85">
                    {mxDe(p)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="pres-card tarjeta-oro p-6 sm:p-7">
            <p className="text-xl font-bold lg:text-2xl">
              ¿Registras a alguien más al programa?{" "}
              <span className="texto-oro">{PCT_EXTRA}% extra</span> de todo lo que esa persona
              genere.
            </p>
          </div>
          <div className="pres-card p-6 sm:p-7">
            <p className="text-lg font-bold text-white/85 lg:text-xl">
              La moneda la define <span className="texto-verde">el evento</span>, no tu país.
            </p>
          </div>
        </div>
      </>
    ),
  },

  /* 15 · El pago */
  {
    nombre: "El pago",
    fondo: null,
    entrada: "cascada",
    contenido: (
      <>
        <span className="deck-kicker deck-kicker-oro">Sin letras chiquitas</span>
        <h2 className="deck-titulo mt-3">
          El pago, <span className="texto-oro">claro</span> y sin letras chiquitas
        </h2>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {[
            ["Al cierre del evento", "Se hace el corte de todas las comisiones."],
            [
              `${VALIDACION_HORAS} horas`,
              "Para validar que cada comisión esté bien contada.",
            ],
            [
              `${PAGO_DIAS_HABILES} días hábiles`,
              "Y el depósito llega directo a tu cuenta, en la moneda de tu evento.",
            ],
          ].map(([titulo, texto], i) => (
            <div
              key={titulo}
              className="pres-card tarjeta-oro cascada-item p-7"
              style={estiloCascada(i)}
            >
              <p className="text-3xl font-extrabold texto-oro">{titulo}</p>
              <p className="mt-3 text-lg leading-relaxed text-white/70">{texto}</p>
            </div>
          ))}
        </div>
      </>
    ),
  },

  /* 16 · Los premios — la escalera, contada como historia */
  {
    nombre: "Premios por referidos",
    fondo: "/slides/bg-premios.webp",
    entrada: "cascada",
    contenido: (
      <>
        <span className="deck-kicker deck-kicker-oro">La escalera</span>
        <h2 className="deck-titulo mt-3">Esto va más allá de las comisiones</h2>
        <p className="deck-sub mt-4 max-w-4xl">
          Cada persona que se une al Club te sube un escalón — y cada escalón tiene nombre:
        </p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PREMIOS.map((p, i) => (
            <div
              key={p.meta}
              className="pres-card premio-escalon cascada-item overflow-hidden"
              style={{ ...estiloCascada(i), "--sube": `${(PREMIOS.length - 1 - i) * 18}px` } as React.CSSProperties}
            >
              <ImagenPremio src={`/premios/premio-${p.meta}.webp`} alt={p.premio} numero={p.meta} />
              <div className="p-5">
                <p className="text-sm font-bold uppercase tracking-[0.14em] texto-oro">
                  {p.meta} referidos
                </p>
                <p className="mt-2 text-lg font-extrabold leading-snug">{p.historia}</p>
                <p className="mt-1.5 text-base leading-snug text-white/70">{p.premio}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-6 text-lg text-white/60">Cuentan los referidos que ya compraron.</p>
      </>
    ),
  },

  /* 17 · Descanso visual IV — claro */
  {
    nombre: "Descanso · El siguiente",
    fondo: null,
    entrada: "zoom-fondo",
    tema: "claro",
    contenido: (
      <div className="text-center">
        <p className="deck-frase-descanso">
          El siguiente podrías ser <span className="texto-verde">tú</span>.
        </p>
      </div>
    ),
  },

  /* 18 · El mapa — los próximos eventos, en vivo */
  {
    nombre: "El mapa de los próximos eventos",
    fondo: null,
    entrada: "fade-up",
    contenido: (
      <>
        <div className="text-center">
          <span className="deck-kicker">Los próximos eventos</span>
          <h2 className="deck-titulo mt-3">Nos vemos donde estés</h2>
        </div>
        <MapaGira />
      </>
    ),
  },

  /* 19 · Las fechas — REALES desde la boletera, con bandera por evento */
  {
    nombre: "Las próximas fechas",
    fondo: "/slides/bg-gira.webp",
    entrada: "barrido",
    contenido: (
      <>
        <span className="deck-kicker">La gira · reuniones y seminarios</span>
        <h2 className="deck-titulo mt-3">Las próximas fechas</h2>
        <GiraDinamica />
      </>
    ),
  },

  /* 20 · ¿A quién le interesa? — claro: luces arriba, manos arriba */
  {
    nombre: "¿A quién le interesa?",
    fondo: null,
    entrada: "palabras",
    tema: "claro",
    contenido: (
      <div className="text-center">
        <h2 className="deck-titulo-portada">
          <Palabras texto="¿A quién le interesa?" />
        </h2>
        <p className="mt-10 text-[clamp(1.4rem,3vw,2.4rem)] font-bold">
          Levanta la mano 🙋 — o escanea y entra.
        </p>
      </div>
    ),
  },

  /* 21 · Grupo de WhatsApp */
  {
    nombre: "Grupo de WhatsApp",
    fondo: null,
    entrada: "escala",
    contenido: (
      <div className="flex flex-col items-center text-center">
        <span className="deck-kicker">El grupo de WhatsApp</span>
        <h2 className="deck-titulo mt-3">Aquí va TODO del programa</h2>
        <div className="qr-blanco mt-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/qr-grupo-wa.png"
            alt="Código QR del grupo de WhatsApp del Programa +1"
            className="qr-imagen"
          />
        </div>
        <a href={GRUPO_WA} target="_blank" rel="noreferrer" className="deck-boton-verde mt-8">
          Unirme al grupo
        </a>
        <p className="mt-4 font-mono text-base text-white/60">{GRUPO_WA_CORTA}</p>
      </div>
    ),
  },

  /* 22 · ¿Eres tú? — el cierre de la búsqueda */
  {
    nombre: "¿Eres tú?",
    fondo: null,
    entrada: "fade-up",
    contenido: (
      <div className="flex flex-col items-center text-center">
        <h2 className="deck-titulo-portada">
          ¿Eres <span className="texto-verde">tú</span>?
        </h2>
        <p className="mt-5 text-[clamp(1.3rem,2.6vw,2rem)] font-bold text-white/90">
          Nos vemos en los próximos eventos:
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-8 sm:flex-row sm:gap-12">
          <div className="qr-blanco qr-chico">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/qr-grupo-wa.png"
              alt="Código QR del grupo de WhatsApp del Programa +1"
              className="qr-imagen-chica"
            />
          </div>
          <GiraCompacta />
        </div>
      </div>
    ),
  },

  /* 23 · Preguntas */
  {
    nombre: "Preguntas",
    fondo: null,
    entrada: "fade",
    contenido: (
      <div className="text-center">
        <h2 className="deck-titulo">
          Preguntas — <span className="texto-verde">estamos aquí</span>
        </h2>
        <a
          href={WA_AYUDA}
          target="_blank"
          rel="noreferrer"
          className="pres-card mx-auto mt-12 flex max-w-xl items-center gap-5 p-6 text-left"
        >
          <span
            className="grid h-14 w-14 flex-none place-items-center rounded-full bg-[#19e16d] text-3xl"
            aria-hidden="true"
          >
            💬
          </span>
          <span>
            <span className="block text-xl font-extrabold">
              ¿Necesitas ayuda? Escríbele a Daniel
            </span>
            <span className="tabular mt-1 block text-lg text-white/70">
              +1 224 587 0935 · WhatsApp
            </span>
          </span>
        </a>
      </div>
    ),
  },
];
