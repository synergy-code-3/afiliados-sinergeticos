import Link from "next/link";
import { supabaseSession } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import TopeComision from "@/app/components/tope-comision";

const PASOS = [
  [
    "01",
    "Crea tu cuenta",
    "Solo tu nombre, correo y una contraseña. Toma un minuto.",
  ],
  [
    "02",
    "Invita a tus +1 al Seminario",
    "Inscribe a tus invitados al Seminario de Emprendedor a Empresario Digital: su Pase de Afiliado de cortesía les llega por WhatsApp al instante.",
  ],
  [
    "03",
    "Gana comisiones",
    "Cuando tus +1 se unen al Club Sinergético, tú ganas una comisión por cada uno.",
  ],
] as const;

export default async function Home() {
  const supabase = await supabaseSession();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/panel");

  return (
    <main className="relative">
      <div className="aurora">
        <span className="b1" />
        <span className="b2" />
      </div>

      <section className="wrap relative pb-16 pt-20 sm:pt-28">
        <p className="sec-tag a1 mb-5">
          <span className="pulse inline-block h-1.5 w-1.5 rounded-full bg-[#19e16d]" />
          Synergy +1 · Un programa del Club Sinergético
        </p>
        <h1 className="a1 max-w-2xl text-4xl font-extrabold leading-[1.08] sm:text-5xl">
          Sé el <span className="text-[#19e16d]">+1</span> de alguien más.
          <br />
          Gana con ello.
        </h1>
        <p className="a2 mt-5 max-w-xl text-lg leading-relaxed text-white/60">
          En Sinergéticos creemos que <span className="font-bold text-white">1 + 1 = 3</span>:
          cuando acompañas a alguien en su crecimiento, juntos logran algo más grande
          — y tú ganas con ello.
        </p>
        <div className="a3 mt-10 flex flex-wrap gap-4">
          <Link href="/crear-cuenta" className="btn-cta btn-glow btn-press">
            Crear mi cuenta →
          </Link>
          <Link href="/entrar" className="btn-ghost btn-press">
            Ya tengo cuenta
          </Link>
        </div>
      </section>

      <section className="wrap relative pb-20">
        <div className="neu a4 overflow-hidden p-2 sm:p-3">
          <div
            className="hero-foto"
            role="img"
            aria-label="La comunidad Sinergética reunida en un evento en vivo"
          />
        </div>
      </section>

      <section className="wrap relative pb-20">
        <div className="grid gap-5 sm:grid-cols-3">
          {PASOS.map(([n, t, d]) => (
            <div key={n} className="neu p-6">
              <p className="text-[11px] font-bold tracking-[0.2em] text-[#19e16d]">{n}</p>
              <p className="mt-2 text-lg font-bold">{t}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-white/60">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="wrap relative pb-24">
        <div className="neu p-8 text-center sm:p-10">
          <p className="sec-tag justify-center">
            <span className="pulse inline-block h-1.5 w-1.5 rounded-full bg-[#19e16d]" />
            Comisiones por cada +1
          </p>
          <p className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl">
            Gana hasta <TopeComision />
            <br className="hidden sm:block" /> por persona que se une al Club
          </p>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/60">
            La comisión depende del paquete que elija tu invitado y del país del
            evento. En tu panel ves cada venta y lo que ganas por ella.
          </p>
          <div className="mt-8 flex justify-center">
            <Link href="/crear-cuenta" className="btn-cta btn-press">
              Quiero ser un +1 →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
