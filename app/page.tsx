import Link from "next/link";
import { supabaseSession } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

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

      <section className="wrap relative pb-24 pt-20 sm:pt-28">
        <p className="sec-tag a1 mb-5">
          <span className="pulse inline-block h-1.5 w-1.5 rounded-full bg-[#19e16d]" />
          Eventos presenciales · Entrada gratuita
        </p>
        <h1 className="a1 max-w-2xl text-4xl font-extrabold leading-[1.08] sm:text-5xl">
          Invita a tus conocidos a los eventos{" "}
          <span className="text-[#19e16d]">Sinergéticos</span> y regálales su boleto
        </h1>
        <p className="a2 mt-5 max-w-xl text-lg text-white/55">
          Crea tu cuenta de afiliado, inscribe a las personas que quieres llevar y su boleto les
          llega al instante por WhatsApp. Tú llevas el conteo de tus invitados.
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

      <section className="wrap relative pb-24">
        <div className="a4 grid gap-4 sm:grid-cols-3">
          {[
            ["01", "Crea tu cuenta", "Solo tu nombre, correo y una contraseña. Toma un minuto."],
            ["02", "Inscribe personas", "Nombre, correo y WhatsApp de tu invitado, y el evento al que va."],
            ["03", "Su boleto llega solo", "Tu invitado recibe su boleto por WhatsApp al instante, listo para el evento."],
          ].map(([n, t, d]) => (
            <div key={n} className="glass p-6">
              <p className="text-[11px] font-bold tracking-[0.2em] text-[#19e16d]">{n}</p>
              <p className="mt-2 text-lg font-bold">{t}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-white/55">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
