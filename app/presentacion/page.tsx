import Link from "next/link";

/** Selector de versión de la presentación Synergy +1.
 * Misma estructura en ambas; cambian montos, moneda y énfasis de ciudades. */

const VERSIONES = [
  {
    href: "/presentacion/mx",
    bandera: "🇲🇽",
    nombre: "México",
    detalle: "Montos en pesos · énfasis en Tijuana y Ciudad Juárez",
  },
  {
    href: "/presentacion/us",
    bandera: "🇺🇸",
    nombre: "Estados Unidos",
    detalle: "Montos en dólares · énfasis en Austin, San Antonio, Houston y Dallas",
  },
] as const;

export default function SelectorPresentacion() {
  return (
    <main className="pres-fondo-base flex min-h-dvh flex-col items-center justify-center px-6 py-16">
      <span className="sello-suma">1 + 1 = 3</span>
      <h1 className="mt-6 text-center text-5xl font-extrabold tracking-tight sm:text-6xl">
        Synergy <span className="text-[#19e16d]">+1</span>
      </h1>
      <p className="mt-3 max-w-xl text-center text-lg text-white/65">
        La presentación para anunciarlo a la comunidad. Elige tu versión:
      </p>

      <div className="mt-12 grid w-full max-w-3xl gap-6 sm:grid-cols-2">
        {VERSIONES.map((v) => (
          <Link key={v.href} href={v.href} className="sel-tarjeta p-8 text-center sm:p-10">
            <span className="block text-6xl sm:text-7xl" aria-hidden="true">
              {v.bandera}
            </span>
            <span className="mt-5 block text-2xl font-extrabold sm:text-3xl">{v.nombre}</span>
            <span className="mt-2 block text-base leading-relaxed text-white/60">
              {v.detalle}
            </span>
            <span className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#19e16d] px-6 font-extrabold text-black">
              Abrir presentación →
            </span>
          </Link>
        ))}
      </div>

      <p className="mt-10 text-sm text-white/40">
        Ambas versiones están en español · Con Jorge Serratos y Manuel de León
      </p>
    </main>
  );
}
