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
        <div className="glass mt-6 p-6 sm:p-7">
          <p className="text-3xl font-extrabold text-[#d9b45b]">{PCT_TEXTO} extra</p>
          <p className="mt-2 leading-relaxed text-white/70">
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

      <button
        type="button"
        onClick={() => setAbierta((v) => !v)}
        aria-expanded={abierta}
        className="btn-cta btn-press mt-6 w-full sm:w-auto"
      >
        ➕ Añadir a alguien más al programa
      </button>

      {abierta ? (
        <div className="glass eq-abre mt-4 space-y-4 p-6 sm:p-7">
          <div>
            <p className="sec-tag mb-1">Tu liga personal</p>
            <p className="text-sm text-white/55">
              Quien cree su cuenta con esta liga queda registrado como parte de tu equipo.
            </p>
          </div>
          <input
            readOnly
            value={liga}
            onFocus={(e) => e.currentTarget.select()}
            aria-label="Tu liga personal de invitación"
            className="field !text-sm"
          />
          <div className="flex flex-wrap gap-3">
            <button onClick={copiarLiga} className="btn-cta btn-press !px-5 !py-3 !text-sm">
              {copiada ? "¡Copiada!" : "Copiar"}
            </button>
            <button onClick={invitarWa} className="btn-ghost btn-press !px-5 !py-3 !text-sm">
              Invitar por WhatsApp
            </button>
          </div>
          <p className="text-sm leading-relaxed text-white/70">
            Por cada comisión que genere alguien que{" "}
            <strong className="text-white">TÚ registraste</strong>, tú ganas un {PCT_TEXTO}{" "}
            extra. No se le descuenta a nadie: es un bono para ti.
          </p>
        </div>
      ) : null}

      {overridePorMoneda.length > 0 ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {overridePorMoneda.map((o) => (
            <div key={o.moneda} className="glass p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">
                Tu bono de equipo · {o.moneda}
              </p>
              <p className="mt-1 text-2xl font-extrabold tabular text-[#d9b45b]">
                {dinero(o.cents, monedaSegura(o.moneda))}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {miembros.length === 0 ? (
        <div className="glass mt-6 p-6 text-center sm:p-8">
          <p className="text-lg font-bold">Tu equipo empieza contigo</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/55">
            Aún no registras a nadie. Comparte tu liga con alguien que quiera ganar como tú —
            cuando cree su cuenta, aparece aquí y todo lo que genere te suma un bono.
          </p>
        </div>
      ) : (
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
                <p className="mt-0.5 text-sm font-bold text-[#d9b45b]">
                  Tu bono: {dinero(overrideCents(m.comisionCents), monedaSegura(m.moneda))}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* Estilos propios de la sección. Tokens neumórficos con respaldo para verse
 * bien aunque el re-skin global aún no haya aterrizado. Sombras por clase,
 * nunca inline (lección BGI). */
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

@media (prefers-reduced-motion: no-preference) {
  @keyframes eq-abre {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .eq-abre { animation: eq-abre 0.45s cubic-bezier(0.16, 1, 0.3, 1) both; }
}
`;
