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
    <main className="relative">
      <div className="aurora">
        <span className="b1" />
      </div>
      <div className="wrap relative flex justify-center pb-24 pt-16">
        <div className="glass a1 w-full max-w-md p-8">
          <p className="sec-tag mb-4">Bienvenido de vuelta</p>
          <h1 className="text-2xl font-extrabold">Entrar a tu panel</h1>
          <form onSubmit={entrar} className="mt-6 space-y-4">
            <div>
              <label className="label">Correo</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="tucorreo@ejemplo.com" autoComplete="email" className="field" />
            </div>
            <div>
              <label className="label">Contraseña</label>
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Tu contraseña" autoComplete="current-password" className="field" />
            </div>
            {msg ? <p className="text-sm font-semibold text-[#ffb2b2]">{msg}</p> : null}
            <button disabled={loading} className="btn-cta btn-press w-full">
              {loading ? "Entrando…" : "Entrar →"}
            </button>
          </form>
          <p className="mt-5 text-sm text-white/50">
            ¿No tienes cuenta?{" "}
            <Link href="/crear-cuenta" className="font-semibold text-[#19e16d] hover:underline">Créala aquí</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
