"use client";

import { useState } from "react";
import { OVERRIDE_PCT, dinero, overrideCents } from "@/lib/comisiones";

export interface MiembroEquipo {
  nombre: string;
  apodo: string | null;
  fotoUrl: string | null;
  creadoEl: string;
  ventas: number;
  comisionCents: number;
  moneda: string;
}

export interface EquipoProps {
  /** ¿La migración 0082 (Synergy +1) ya está aplicada? Si no, el pitch se
   * muestra igual pero sin liga — nada de features rotas en pantalla. */
  dbListo: boolean;
  codigoRef: string | null;
  miembros: MiembroEquipo[];
  overridePorMoneda: Array<{ moneda: string; cents: number }>;
}

const BASE_LIGA = "https://afiliados.sinergeticos.com/crear-cuenta";
const PCT_TEXTO = `${Math.round(OVERRIDE_PCT * 100)}%`;

/** En la base la moneda viaja como string; aquí solo viven MXN o USD. */
const monedaSegura = (m: string): "MXN" | "USD" => (m === "USD" ? "USD" : "MXN");

const fechaLarga = (iso: string): string =>
  new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });

function Avatar({ miembro }: { miembro: MiembroEquipo }) {
  if (miembro.fotoUrl) {
    return (
      <img src={miembro.fotoUrl} alt="" className="eq-avatar object-cover" loading="lazy" />
    );
  }
  const inicial = (miembro.apodo ?? miembro.nombre).trim().charAt(0).toUpperCase() || "+";
  return (
    <span aria-hidden="true" className="eq-avatar grid place-items-center text-lg font-extrabold text-[#19e16d]">
      {inicial}
    </span>
  );
}

/** Escena decorativa: tú (verde) conectado a tu equipo, con monedas fluyendo.
 * Puramente ilustrativa — oculta para lectores de pantalla. */
function EscenaEquipo() {
  return (
    <svg viewBox="0 0 340 204" className="eq-escena" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="eq-nodo" cx="32%" cy="26%" r="95%">
          <stop offset="0%" stopColor="#1d2823" />
          <stop offset="100%" stopColor="#0c1210" />
        </radialGradient>
        <marker
          id="eq-punta"
          viewBox="0 0 8 8"
          refX="6.5"
          refY="4"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <path d="M0 0L8 4L0 8Z" fill="rgba(25,225,109,0.75)" />
        </marker>
      </defs>

      {/* Flechas: de ti hacia cada persona de tu equipo */}
      <path className="eq-flecha" d="M97 84 C 140 58 178 48 210 44" markerEnd="url(#eq-punta)" />
      <path className="eq-flecha" d="M101 100 C 146 100 182 100 216 100" markerEnd="url(#eq-punta)" />
      <path className="eq-flecha" d="M97 116 C 140 142 178 152 210 156" markerEnd="url(#eq-punta)" />

      {/* Tú */}
      <circle cx="62" cy="100" r="38" fill="url(#eq-nodo)" stroke="rgba(25,225,109,0.9)" strokeWidth="2" />
      <circle cx="62" cy="90" r="10" fill="#19e16d" />
      <path d="M44 126 a18 13 0 0 1 36 0 Z" fill="#19e16d" />
      <text
        x="62"
        y="158"
        textAnchor="middle"
        fontSize="11"
        fontWeight="700"
        letterSpacing="2"
        fill="rgba(255,255,255,0.65)"
      >
        TÚ
      </text>

      {/* Tu equipo */}
      {[44, 100, 156].map((cy, i) => {
        const cx = i === 1 ? 246 : 238;
        return (
          <g key={cy}>
            <circle cx={cx} cy={cy} r="24" fill="url(#eq-nodo)" stroke="rgba(255,255,255,0.14)" strokeWidth="1.5" />
            <circle cx={cx} cy={cy - 6.5} r="6.5" fill="rgba(255,255,255,0.75)" />
            <path d={`M${cx - 12} ${cy + 17} a12 8.5 0 0 1 24 0 Z`} fill="rgba(255,255,255,0.75)" />
          </g>
        );
      })}
      <text
        x="242"
        y="196"
        textAnchor="middle"
        fontSize="10"
        fontWeight="700"
        letterSpacing="1.5"
        fill="rgba(255,255,255,0.5)"
      >
        TU EQUIPO
      </text>

      {/* Monedas y +$ flotando sobre las flechas */}
      <g className="eq-moneda">
        <circle cx="150" cy="56" r="9" fill="#d9b45b" stroke="#f6e7b8" strokeWidth="1" />
        <text x="150" y="56" textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="800" fill="#0e1412">
          $
        </text>
      </g>
      <g className="eq-moneda eq-m2">
        <circle cx="170" cy="84" r="7" fill="#d9b45b" stroke="#f6e7b8" strokeWidth="1" />
        <text x="170" y="84" textAnchor="middle" dominantBaseline="central" fontSize="9" fontWeight="800" fill="#0e1412">
          $
        </text>
      </g>
      <g className="eq-moneda eq-m3">
        <circle cx="152" cy="140" r="9" fill="#d9b45b" stroke="#f6e7b8" strokeWidth="1" />
        <text x="152" y="140" textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="800" fill="#0e1412">
          $
        </text>
      </g>
      <text className="eq-mas" x="186" y="68" fontSize="13" fontWeight="800" fill="#d9b45b">
        +$
      </text>
      <text className="eq-mas eq-m2" x="190" y="134" fontSize="13" fontWeight="800" fill="#d9b45b">
        +$
      </text>
    </svg>
  );
}

/** El héroe de la sección: el 20% extra, gigante y en dorado. */
function HeroVeinte() {
  return (
    <div className="glass eq-hero eq-marco-oro mt-6 p-6 sm:p-8">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="eq-hero-pct">{PCT_TEXTO} EXTRA</p>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
            de <strong className="text-white">TODO</strong> lo que genere cada persona que{" "}
            <strong className="text-white">tú registres</strong> —{" "}
            <strong className="oro">de por vida del programa</strong>, sin descontarle nada a
            nadie.
          </p>
        </div>
        <div className="w-full max-w-[300px] flex-none sm:w-[42%]">
          <EscenaEquipo />
        </div>
      </div>
    </div>
  );
}

interface TarjetaLigaProps {
  liga: string;
  codigo: string;
  copiada: boolean;
  onCopiar: () => void;
  onInvitarWa: () => void;
}

/** La liga personal como cupón: el código en grande + la liga completa. */
function TarjetaLiga({ liga, codigo, copiada, onCopiar, onInvitarWa }: TarjetaLigaProps) {
  return (
    <div className="glass eq-marco-oro eq-abre mt-4 space-y-4 p-6 sm:p-7">
      <div>
        <p className="sec-tag mb-1">Tu liga personal</p>
        <p className="text-sm text-white/55">
          Quien cree su cuenta con esta liga queda registrado como parte de tu equipo.
        </p>
      </div>

      <div className="neu-inset eq-cupon">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/55">
          Tu código de referido
        </p>
        <p className="eq-cupon-codigo">{codigo}</p>
      </div>

      <input
        readOnly
        value={liga}
        onFocus={(e) => e.currentTarget.select()}
        aria-label="Tu liga personal de invitación"
        className="field !text-sm"
      />
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={onCopiar} className="btn-cta btn-press !px-5 !py-3 !text-sm">
          {copiada ? "¡Copiada!" : "Copiar"}
        </button>
        <button type="button" onClick={onInvitarWa} className="btn-ghost btn-press !px-5 !py-3 !text-sm">
          Invitar por WhatsApp
        </button>
      </div>
      <p className="text-sm leading-relaxed text-white/70">
        Por cada comisión que genere alguien que{" "}
        <strong className="text-white">TÚ registraste</strong>, tú ganas un {PCT_TEXTO}{" "}
        extra. No se le descuenta a nadie: es un bono para ti.
      </p>
    </div>
  );
}

/** Lo acumulado por moneda — el marcador dorado del equipo. */
function BonosAcumulados({ porMoneda }: { porMoneda: EquipoProps["overridePorMoneda"] }) {
  if (porMoneda.length === 0) return null;
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      {porMoneda.map((o) => (
        <div key={o.moneda} className="glass eq-marco-oro p-5 sm:p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">
            Tu bono de equipo · {o.moneda}
          </p>
          <p className="mt-1 text-3xl font-extrabold tabular oro sm:text-4xl">
            {dinero(o.cents, monedaSegura(o.moneda))}
          </p>
        </div>
      ))}
    </div>
  );
}

function ListaMiembros({ miembros }: { miembros: MiembroEquipo[] }) {
  if (miembros.length === 0) {
    return (
      <div className="glass mt-6 p-6 text-center sm:p-8">
        <p className="text-lg font-bold">Tu equipo empieza contigo</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/55">
          Aún no registras a nadie. Comparte tu liga con alguien que quiera ganar como tú —
          cuando cree su cuenta, aparece aquí y todo lo que genere te suma un bono.
        </p>
      </div>
    );
  }
  return (
    <ul className="mt-6 space-y-3">
      {miembros.map((m) => (
        <li
          key={`${m.nombre}-${m.creadoEl}`}
          className="glass flex flex-wrap items-center gap-4 p-4 sm:p-5"
        >
          <Avatar miembro={m} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold">{m.apodo ?? m.nombre}</p>
            <p className="mt-0.5 text-xs text-white/45">
              {m.apodo ? `${m.nombre} · ` : ""}
              Se unió el {fechaLarga(m.creadoEl)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-white/55">
              {m.ventas} {m.ventas === 1 ? "venta" : "ventas"} ·{" "}
              <span className="font-bold text-white/80">
                {dinero(m.comisionCents, monedaSegura(m.moneda))}
              </span>
            </p>
            <p className="mt-0.5 text-base font-extrabold tabular oro">
              Tu bono: {dinero(overrideCents(m.comisionCents), monedaSegura(m.moneda))}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function Equipo({ dbListo, codigoRef, miembros, overridePorMoneda }: EquipoProps) {
  const [abierta, setAbierta] = useState(false);
  const [copiada, setCopiada] = useState(false);

  const listo = dbListo && codigoRef !== null;
  const liga = `${BASE_LIGA}?ref=${encodeURIComponent(codigoRef ?? "")}`;

  async function copiarLiga() {
    try {
      await navigator.clipboard.writeText(liga);
    } catch {
      // navegadores sin permiso de portapapeles (o http): fallback manual
      const ta = document.createElement("textarea");
      ta.value = liga;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopiada(true);
    setTimeout(() => setCopiada(false), 2000);
  }

  function invitarWa() {
    const texto =
      `Hola 👋 Te quiero compartir algo bueno. Estoy en Synergy +1, el programa de ` +
      `afiliados del Club Sinergético: invitas gente al seminario de Jorge Serratos y ` +
      `Manuel de León, y ganas una comisión por cada persona que se une al Club. ` +
      `Crea tu cuenta con mi liga y quedas en mi equipo: ${liga}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank");
  }

  const encabezado = (
    <>
      <p className="sec-tag mb-1">Crece acompañado</p>
      <h2 className="text-xl font-bold">Tu equipo +1</h2>
      <p className="mt-1 text-sm text-white/55">
        Trae a más personas al programa y gana un bono por todo lo que ellas generen.
      </p>
    </>
  );

  if (!listo) {
    return (
      <section>
        <style>{ESTILOS}</style>
        {encabezado}
        <HeroVeinte />
        <div className="glass mt-4 p-6 sm:p-7">
          <p className="leading-relaxed text-white/70">
            Por cada comisión que genere alguien que{" "}
            <strong className="text-white">TÚ registraste</strong>, tú ganas un {PCT_TEXTO}{" "}
            extra. No se le descuenta a nadie: es un bono para ti.
          </p>
          <p className="mt-4 text-sm font-semibold text-[#ffd28a]">
            Muy pronto podrás registrar a tu equipo desde aquí.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <style>{ESTILOS}</style>
      {encabezado}

      <HeroVeinte />

      <button
        type="button"
        onClick={() => setAbierta((v) => !v)}
        aria-expanded={abierta}
        className="btn-cta btn-glow btn-press eq-cta-hero mt-6 w-full sm:w-auto"
      >
        ➕ Añadir a alguien más al programa
      </button>

      {abierta ? (
        <TarjetaLiga
          liga={liga}
          codigo={codigoRef ?? ""}
          copiada={copiada}
          onCopiar={copiarLiga}
          onInvitarWa={invitarWa}
        />
      ) : null}

      <BonosAcumulados porMoneda={overridePorMoneda} />
      <ListaMiembros miembros={miembros} />
    </section>
  );
}

/* Estilos propios de la sección. Tokens neumórficos con respaldo para verse
 * bien aunque el re-skin global aún no haya aterrizado. Sombras por clase,
 * nunca inline (lección BGI). Animaciones solo bajo no-preference. */
const ESTILOS = `
.eq-avatar {
  flex: none;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(145deg, #1a2420, #0c1210);
  box-shadow:
    -3px -3px 8px var(--neu-luz, rgba(46, 66, 56, 0.45)),
    5px 5px 12px var(--neu-sombra, rgba(2, 6, 4, 0.75));
}

/* Marco dorado sutil sobre tarjeta extruida (momentos de premio) */
.eq-marco-oro {
  border: 1px solid rgba(var(--oro-rgb, 217, 180, 91), 0.30);
  box-shadow:
    -6px -6px 14px var(--neu-luz, rgba(46, 66, 56, 0.45)),
    8px 8px 18px var(--neu-sombra, rgba(2, 6, 4, 0.75)),
    0 0 26px -8px rgba(var(--oro-rgb, 217, 180, 91), 0.22);
}

/* Héroe del 20%: barrido de luz sutil sobre la superficie */
.eq-hero { position: relative; overflow: hidden; }
.eq-hero::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(115deg, rgba(255, 255, 255, 0.045), transparent 42%);
}
.eq-hero-pct {
  display: block;
  font-size: clamp(52px, 11vw, 92px);
  line-height: 0.95;
  font-weight: 800;
  letter-spacing: -0.015em;
  color: var(--oro, #d9b45b);
}
@supports ((-webkit-background-clip: text) or (background-clip: text)) {
  .eq-hero-pct {
    background: linear-gradient(
      105deg,
      #c9a34e 0%,
      #d9b45b 34%,
      #f6e7b8 50%,
      #d9b45b 66%,
      #c9a34e 100%
    );
    background-size: 230% 100%;
    background-position: 115% 0;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
}

/* Código de referido como cupón */
.eq-cupon {
  border: 1px dashed rgba(var(--oro-rgb, 217, 180, 91), 0.45);
  border-radius: 14px;
  padding: 16px 18px;
  text-align: center;
}
.eq-cupon-codigo {
  margin-top: 6px;
  font-size: clamp(26px, 7vw, 38px);
  font-weight: 800;
  letter-spacing: 0.18em;
  text-indent: 0.18em;
  font-variant-numeric: tabular-nums;
  color: var(--oro, #d9b45b);
  user-select: all;
  overflow-wrap: anywhere;
}

/* CTA protagonista */
.eq-cta-hero {
  min-height: 58px;
  padding: 18px 34px;
  font-size: 18px;
}

/* Escena decorativa tú → tu equipo */
.eq-escena {
  display: block;
  width: 100%;
  max-width: 300px;
  height: auto;
  margin-inline: auto;
}
.eq-flecha {
  fill: none;
  stroke: rgba(25, 225, 109, 0.55);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-dasharray: 5 7;
}
.eq-moneda,
.eq-mas {
  transform-box: fill-box;
  transform-origin: center;
}

@media (prefers-reduced-motion: no-preference) {
  @keyframes eq-abre {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .eq-abre { animation: eq-abre 0.45s cubic-bezier(0.16, 1, 0.3, 1) both; }

  /* Brillo que recorre el 20% EXTRA */
  @keyframes eq-brillo {
    0%, 100% { background-position: 115% 0; }
    50%      { background-position: -15% 0; }
  }
  .eq-hero-pct { animation: eq-brillo 5s ease-in-out infinite; }

  /* Las flechas fluyen de ti hacia tu equipo */
  @keyframes eq-fluye {
    to { stroke-dashoffset: -24; }
  }
  .eq-flecha { animation: eq-fluye 1.6s linear infinite; }

  /* Monedas flotando */
  @keyframes eq-flota {
    0%, 100% { transform: translateY(0); }
    50%      { transform: translateY(-5px); }
  }
  .eq-moneda, .eq-mas { animation: eq-flota 3.4s ease-in-out infinite; }
  .eq-m2 { animation-delay: 1.1s; }
  .eq-m3 { animation-delay: 2.2s; }
}
`;
