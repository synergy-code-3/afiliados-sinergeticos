"use client";

import { useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase";

export default function Recuperar() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function pedirLiga(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setMsg(null);
    const correo = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      return setMsg("Escribe un correo válido.");
    }
    setLoading(true);
    const { error } = await supabaseBrowser().auth.resetPasswordForEmail(correo, {
      redirectTo: `${window.location.origin}/nueva-contrasena`,
    });
    setLoading(false);
    // no revelamos si el correo existe o no
    if (error && !error.message.toLowerCase().includes("not found")) {
      return setMsg("No se pudo enviar el correo. Intenta de nuevo en un momento.");
    }
    setEnviado(true);
  }

  return (
    <main className="relative">
      <div className="aurora">
        <span className="b1" />
      </div>
      <div className="wrap relative flex justify-center pb-24 pt-16">
        <div className="glass a1 w-full max-w-md p-8">
          {enviado ? (
            <>
              <p className="sec-tag mb-4">Listo</p>
              <h1 className="text-2xl font-extrabold">Revisa tu correo</h1>
              <p className="mt-3 leading-relaxed text-white/55">
                Si <span className="font-semibold text-white/80">{email.trim().toLowerCase()}</span>{" "}
                tiene cuenta, le mandamos una liga para crear una contraseña nueva. Puede tardar un
                par de minutos — revisa también la carpeta de spam.
              </p>
              <Link href="/entrar" className="btn-cta btn-press !mt-8 inline-block">
                Volver a entrar →
              </Link>
            </>
          ) : (
            <>
              <p className="sec-tag mb-4">Recuperar acceso</p>
              <h1 className="text-2xl font-extrabold">¿Olvidaste tu contraseña?</h1>
              <p className="mt-2 text-white/55">
                Escribe tu correo y te mandamos una liga para crear una nueva.
              </p>
              <form onSubmit={pedirLiga} className="mt-6 space-y-4">
                <div>
                  <label className="label">Tu correo</label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    placeholder="tucorreo@ejemplo.com"
                    autoComplete="email"
                    className="field"
                  />
                </div>
                {msg ? <p className="text-sm font-semibold text-[#ffb2b2]">{msg}</p> : null}
                <button disabled={loading} className="btn-cta btn-press !mt-6 w-full">
                  {loading ? "Enviando…" : "Mandarme la liga →"}
                </button>
              </form>
              <p className="mt-5 text-sm text-white/50">
                ¿Ya la recordaste?{" "}
                <Link href="/entrar" className="font-semibold text-[#19e16d] hover:underline">
                  Entra aquí
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
