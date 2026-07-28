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
    <main className="space-y-8">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-8">
        <h1 className="text-3xl font-extrabold leading-tight">
          Invita a tus conocidos a los eventos <span className="text-[#19e16d]">Sinergéticos</span>
        </h1>
        <p className="mt-3 text-white/70">
          Crea tu cuenta de afiliado, inscribe a las personas que quieres llevar al evento y su
          boleto les llega al instante por WhatsApp. Tú llevas el conteo de a quiénes has invitado.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/crear-cuenta"
            className="rounded-xl bg-[#19e16d] px-5 py-3 font-bold text-black transition hover:brightness-110"
          >
            Crear mi cuenta
          </Link>
          <Link
            href="/entrar"
            className="rounded-xl border border-white/20 px-5 py-3 font-semibold text-white/90 transition hover:bg-white/10"
          >
            Ya tengo cuenta
          </Link>
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ["1. Crea tu cuenta", "Solo tu nombre, correo y una contraseña."],
          ["2. Inscribe personas", "Nombre, correo y WhatsApp de tu invitado, y el evento al que va."],
          ["3. Su boleto llega solo", "La persona recibe su boleto por WhatsApp al instante."],
        ].map(([t, d]) => (
          <div key={t} className="rounded-xl border border-white/10 bg-white/5 p-5">
            <p className="font-bold text-[#19e16d]">{t}</p>
            <p className="mt-1 text-sm text-white/70">{d}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
