"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase";

export default function Entrar() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setMsg(null);
    setLoading(true);
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setLoading(false);
    if (error) return setMsg("Correo o contraseña incorrectos.");
    router.push("/panel");
  }

  return (
    <main className="mx-auto max-w-md">
      <h1 className="text-2xl font-extrabold">Entrar</h1>
      <form onSubmit={entrar} className="mt-6 space-y-3">
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Tu correo" autoComplete="email" className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-base outline-none focus:border-[#19e16d]" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Tu contraseña" autoComplete="current-password" className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-base outline-none focus:border-[#19e16d]" />
        {msg ? <p className="text-sm font-semibold text-[#ffb2b2]">{msg}</p> : null}
        <button disabled={loading} className="w-full rounded-xl bg-[#19e16d] px-5 py-3 font-bold text-black transition hover:brightness-110 disabled:opacity-50">
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
      <p className="mt-4 text-sm text-white/60">
        ¿No tienes cuenta?{" "}
        <Link href="/crear-cuenta" className="text-[#19e16d] hover:underline">Créala aquí</Link>
      </p>
    </main>
  );
}
