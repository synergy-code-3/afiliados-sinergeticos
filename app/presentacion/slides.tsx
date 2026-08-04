"use client";

import type { ReactNode } from "react";
import {
  PAQUETE_LABEL,
  comisionPaqueteCents,
  monedaDe,
  OVERRIDE_PCT,
  VALIDACION_HORAS,
  PAGO_DIAS_HABILES,
  type Geografia,
  type Paquete,
} from "@/lib/comisiones";
import { Palabras, ImagenPremio, dineroSala, estiloCascada } from "./piezas";

/* ── Tipos ──────────────────────────────────────────────────────────────── */

export type Mercado = "mx" | "us";

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
  contenido: ReactNode;
}

/* ── Datos fijos (fuente: docs/SYNERGY-PLUS-BRIEF.md) ───────────────────── */

const WA_AYUDA =
  "https://wa.me/12245870935?text=" +
  encodeURIComponent(
    "Hola, Daniel. Soy parte del programa Afiliado Sinergético, necesito tu apoyo.",
  );

const GRUPO_WA = "https://chat.whatsapp.com/Eg9V1E5JIEmDlTH9NKdlTU";
const GRUPO_WA_CORTA = "chat.whatsapp.com/Eg9V1E5JIEmDlTH9NKdlTU";

const PCT_EXTRA = Math.round(OVERRIDE_PCT * 100);

interface ReunionGira {
  ciudad: string;
  fecha: string;
  cdmx: string;
  local: string;
  pais: Geografia;
}

/** Gira de reuniones informativas — agosto 2026. */
const GIRA: readonly ReunionGira[] = [
  { ciudad: "Austin", fecha: "Martes 4", cdmx: "6:00 pm", local: "7:00 pm", pais: "US" },
  { ciudad: "Tijuana", fecha: "Martes 4", cdmx: "9:00 pm", local: "7:00 pm", pais: "MX" },
  { ciudad: "Ciudad Juárez", fecha: "Miércoles 5", cdmx: "5:00 pm", local: "6:00 pm", pais: "MX" },
  { ciudad: "San Antonio", fecha: "Miércoles 5", cdmx: "6:00 pm", local: "7:00 pm", pais: "US" },
  { ciudad: "Houston", fecha: "Jueves 6", cdmx: "6:00 pm", local: "7:00 pm", pais: "US" },
  { ciudad: "Dallas", fecha: "Jueves 6", cdmx: "8:00 pm", local: "9:00 pm", pais: "US" },
];

/** Escalera de premios por referidos que YA compraron (metas fijas). */
const PREMIOS = [
  { meta: 10, premio: "Renovación del Club Sinergético" },
  { meta: 20, premio: "Pase Black a Synergy Unlimited" },
  { meta: 50, premio: "Viaje a Nueva York con Jorge Serratos" },
  { meta: 100, premio: "Mastermind + 3 boletos VIP" },
] as const;

const PAQUETES: readonly Paquete[] = ["3m", "6m", "12m"];

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

interface ConfigMercado {
  geografia: Geografia;
  /** Rango de ganancias a comunicar (lenguaje de posibilidad, nunca garantía). */
  rango: string;
  rangoSufijo: string;
}

const CONFIG: Record<Mercado, ConfigMercado> = {
  mx: { geografia: "MX", rango: "$30,000 – $65,000", rangoSufijo: "MXN al mes" },
  us: { geografia: "US", rango: "$1,600 – $3,500", rangoSufijo: "USD al mes" },
};

/* ── Constructor de los 18 slides ───────────────────────────────────────── */

const construirSlides = (mercado: Mercado): readonly Slide[] => {
  const cfg = CONFIG[mercado];
  const g = cfg.geografia;
  const moneda = monedaDe(g);
  const comisionEjemplo = dineroSala(comisionPaqueteCents(g, "6m"), moneda);

  return [
    /* 1 · Portada */
    {
      nombre: "Portada",
      fondo: "/slides/bg-portada.webp",
      entrada: "palabras",
      contenido: (
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div>
            <p className="cascada-item" style={estiloCascada(0)}>
              <span className="sello-suma">1 + 1 = 3</span>
            </p>
            <h1 className="deck-titulo-portada mt-6">
              <span className="palabra">Synergy</span>{" "}
              <span className="palabra texto-verde" style={{ animationDelay: "0.12s" }}>
                +1
              </span>
            </h1>
            <p className="deck-sub cascada-item mt-5 max-w-xl" style={estiloCascada(1)}>
              El programa de afiliados del Club Sinergético
            </p>
            <p className="cascada-item mt-8 text-lg text-white/70" style={estiloCascada(2)}>
              Con <strong className="text-white">Jorge Serratos</strong> y{" "}
              <strong className="text-white">Manuel de León</strong>
            </p>
          </div>
          <div className="cascada-item" style={estiloCascada(3)}>
            <div className="tarjeta-3d flota-3d pres-card p-6 sm:p-8">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">
                  Tu panel · Synergy +1
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
                  +{comisionEjemplo}
                </p>
                <p className="mt-1 text-sm text-white/60">Comisión lista para tu depósito</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    /* 2 · ¿De qué se trata? */
    {
      nombre: "¿De qué se trata?",
      fondo: null,
      entrada: "fade-up",
      contenido: (
        <>
          <span className="deck-kicker">El programa</span>
          <h2 className="deck-titulo mt-3">¿De qué se trata?</h2>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {[
              [
                "🤝",
                "Invitas a tus +1",
                "A la gente que quieres ver crecer contigo: familia, amigos, tu equipo.",
              ],
              [
                "🎟️",
                "Reciben un pase VIP de cortesía",
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

    /* 3 · La gira */
    {
      nombre: "La gira",
      fondo: "/slides/bg-gira.webp",
      entrada: "barrido",
      contenido: (
        <>
          <span className="deck-kicker">Reuniones informativas · agosto 2026</span>
          <h2 className="deck-titulo mt-3">Corre la voz: estas son las fechas</h2>
          <div className="pres-card mt-10 overflow-x-auto p-4 sm:p-6">
            <table className="w-full min-w-[560px] text-left text-lg lg:text-2xl">
              <thead>
                <tr className="text-sm uppercase tracking-[0.14em] text-white/50 lg:text-base">
                  <th className="px-4 py-3 font-bold">Ciudad</th>
                  <th className="px-4 py-3 font-bold">Fecha</th>
                  <th className="px-4 py-3 font-bold">Hora CDMX</th>
                  <th className="px-4 py-3 font-bold">Hora local</th>
                </tr>
              </thead>
              <tbody>
                {GIRA.map((r) => (
                  <tr
                    key={r.ciudad}
                    className={`border-t border-white/10 ${r.pais === g ? "gira-destacada" : ""}`}
                  >
                    <td className="px-4 py-3 font-extrabold">{r.ciudad}</td>
                    <td className="px-4 py-3">{r.fecha}</td>
                    <td className="tabular px-4 py-3 text-white/75">{r.cdmx}</td>
                    <td className="tabular px-4 py-3 text-white/75">{r.local}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ),
    },

    /* 4 · ¿Por qué lo hacemos? */
    {
      nombre: "¿Por qué lo hacemos?",
      fondo: "/slides/bg-filosofia.webp",
      entrada: "zoom-fondo",
      contenido: (
        <>
          <span className="deck-kicker">¿Por qué lo hacemos?</span>
          <div className="mt-8 space-y-8">
            {[
              "El crecimiento del Club viene de su gente.",
              "Nadie recomienda mejor que quien ya lo vive.",
              "Queremos premiar a quien comparte.",
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

    /* 5 · La filosofía +1 */
    {
      nombre: "La filosofía +1",
      fondo: null,
      entrada: "escala",
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

    /* 6 · ¿Cuánto podrías ganar? */
    {
      nombre: "¿Cuánto podrías ganar?",
      fondo: "/slides/bg-ganancias.webp",
      entrada: "zoom-fondo",
      contenido: (
        <div className="text-center">
          <span className="deck-kicker deck-kicker-oro">¿Cuánto podrías ganar?</span>
          <p className="deck-cifra tabular mt-8 texto-oro">{cfg.rango}</p>
          <p className="mt-3 text-[clamp(1.4rem,3vw,2.4rem)] font-bold text-white/90">
            {cfg.rangoSufijo}
          </p>
          <p className="deck-sub mx-auto mt-10 max-w-3xl">
            Personas reales de la comunidad ya lo están generando. Es una posibilidad real — lo
            que tú generes depende de ti.
          </p>
        </div>
      ),
    },

    /* 7 · Comisiones claras */
    {
      nombre: "Comisiones claras",
      fondo: null,
      entrada: "barrido",
      contenido: (
        <>
          <span className="deck-kicker deck-kicker-oro">Dinero claro</span>
          <h2 className="deck-titulo mt-3">Comisiones claras</h2>
          <div className="pres-card mt-10 overflow-x-auto p-4 sm:p-6">
            <table className="w-full min-w-[480px] text-left text-xl lg:text-3xl">
              <thead>
                <tr className="text-sm uppercase tracking-[0.14em] text-white/50 lg:text-base">
                  <th className="px-4 py-3 font-bold">Si tu invitado se une a…</th>
                  <th className="px-4 py-3 text-right font-bold">Tu comisión</th>
                </tr>
              </thead>
              <tbody>
                {PAQUETES.map((p) => (
                  <tr key={p} className="border-t border-white/10">
                    <td className="px-4 py-4 font-bold">{PAQUETE_LABEL[p]}</td>
                    <td className="tabular px-4 py-4 text-right font-extrabold texto-oro">
                      {dineroSala(comisionPaqueteCents(g, p), moneda)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pres-card tarjeta-oro mt-6 p-6 sm:p-7">
            <p className="text-xl font-bold lg:text-2xl">
              ¿Registras a alguien más al programa?{" "}
              <span className="texto-oro">{PCT_EXTRA}% extra</span> de todo lo que esa persona
              genere.
            </p>
          </div>
        </>
      ),
    },

    /* 8 · Es fácil */
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
                "Registras a tu invitado y el sistema le envía su pase VIP por WhatsApp, al instante.",
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

    /* 9 · ¿Qué tienes que hacer? */
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
                "Su pase VIP de cortesía es GRATIS — se lo mandamos nosotros.",
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

    /* 10 · Tutorial del portal */
    {
      nombre: "Tutorial del portal",
      fondo: "/slides/bg-seminario.webp",
      entrada: "zoom-fondo",
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
                  Enviar pase VIP →
                </div>
              </div>
            </div>
            <div className="pres-card cascada-item p-6" style={estiloCascada(2)}>
              <p className="paso-chip">3</p>
              <p className="mt-4 text-xl font-bold">Su pase llega por WhatsApp</p>
              <div className="mt-4">
                <div className="burbuja-wa">
                  🎟️ ¡Tu pase VIP está listo! Te esperamos en el Seminario.
                </div>
                <p className="mt-2 text-right text-xs text-white/45">al instante ✓✓</p>
              </div>
            </div>
          </div>
        </>
      ),
    },

    /* 11 · Proyecciones */
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
                  {dineroSala(c.unidos * comisionPaqueteCents(g, c.paquete), moneda)}
                </p>
                <p className="mt-1 text-sm text-white/50">
                  {c.unidos} × {PAQUETE_LABEL[c.paquete]}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-lg text-white/60">
            Cada historia es distinta: esto muestra cómo suma, no cuánto te toca.
          </p>
        </>
      ),
    },

    /* 12 · Mejores prácticas */
    {
      nombre: "Mejores prácticas",
      fondo: "/slides/bg-practicas.webp",
      entrada: "fade-up",
      contenido: (
        <>
          <span className="deck-kicker">Lo que mejor funciona</span>
          <h2 className="deck-titulo mt-3">Mejores prácticas</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {[
              ["📣", "Cuéntales que es un GRAN evento"],
              ["🌱", "Comparte tu historia: tú eres el caso de éxito"],
              ["💚", "Di lo que amas de la comunidad y cuánto te ha servido"],
              ["🎁", "Recuérdales que les estás compartiendo algo bueno"],
            ].map(([icono, texto], i) => (
              <div
                key={texto}
                className="pres-card cascada-item flex items-start gap-4 p-7"
                style={estiloCascada(i)}
              >
                <span className="text-3xl" aria-hidden="true">
                  {icono}
                </span>
                <p className="text-2xl font-extrabold leading-snug lg:text-3xl">{texto}</p>
              </div>
            ))}
          </div>
        </>
      ),
    },

    /* 13 · ¿A quién le interesa? */
    {
      nombre: "¿A quién le interesa?",
      fondo: null,
      entrada: "palabras",
      contenido: (
        <div className="text-center">
          <h2 className="deck-titulo-portada">
            <Palabras texto="¿A quién le interesa?" />
          </h2>
          <p className="mt-10 text-[clamp(1.4rem,3vw,2.4rem)] font-bold text-white/90">
            Levanta la mano 🙋 — o escanea y entra.
          </p>
        </div>
      ),
    },

    /* 14 · Grupo de WhatsApp */
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
              alt="Código QR del grupo de WhatsApp de Synergy +1"
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

    /* 15 · Premios por referidos */
    {
      nombre: "Premios por referidos",
      fondo: "/slides/bg-premios.webp",
      entrada: "barrido",
      contenido: (
        <>
          <span className="deck-kicker deck-kicker-oro">La escalera de premios</span>
          <h2 className="deck-titulo mt-3">Premios por referidos</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PREMIOS.map((p, i) => (
              <div
                key={p.meta}
                className="pres-card cascada-item overflow-hidden"
                style={estiloCascada(i)}
              >
                <ImagenPremio src={`/premios/premio-${p.meta}.webp`} alt={p.premio} numero={p.meta} />
                <div className="p-5">
                  <p className="text-sm font-bold uppercase tracking-[0.14em] texto-oro">
                    {p.meta} referidos
                  </p>
                  <p className="mt-2 text-lg font-extrabold leading-snug">{p.premio}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-lg text-white/60">Cuentan los referidos que ya compraron.</p>
        </>
      ),
    },

    /* 16 · El pago */
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
                "Y el depósito llega directo a tu cuenta.",
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

    /* 17 · Toma acción */
    {
      nombre: "Toma acción",
      fondo: "/slides/bg-cierre.webp",
      entrada: "zoom-fondo",
      contenido: (
        <div className="text-center">
          <h2 className="deck-titulo-portada">
            Tu +1 te está <span className="texto-verde">esperando</span>.
          </h2>
          <p className="mt-5 text-[clamp(1.3rem,2.6vw,2rem)] font-bold text-white/90">
            Nos vemos en la gira.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-8 sm:flex-row">
            <div className="qr-blanco qr-chico">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/qr-grupo-wa.png"
                alt="Código QR del grupo de WhatsApp de Synergy +1"
                className="qr-imagen-chica"
              />
            </div>
            <ul className="space-y-2 text-left text-lg text-white/80 lg:text-xl">
              {GIRA.map((r) => (
                <li key={r.ciudad}>
                  <strong className={r.pais === g ? "texto-verde" : "text-white"}>
                    {r.ciudad}
                  </strong>{" "}
                  · {r.fecha} · {r.local} hora local
                </li>
              ))}
            </ul>
          </div>
        </div>
      ),
    },

    /* 18 · Preguntas */
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
};

export const slidesMX: readonly Slide[] = construirSlides("mx");
export const slidesUS: readonly Slide[] = construirSlides("us");
