"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase";

type Estado = "verificando" | "listo" | "invalido";

export default function NuevaContrasena() {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>("verificando");
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = supabaseBrowser();
    // La liga del correo trae `?token_hash=`. Se canjea con verifyOtp, que NO
    // necesita nada guardado en este navegador: por eso funciona aunque la
    // persona pida la liga en la compu y abra el correo en el celular, o desde
    // el navegador interno de Yahoo/Gmail.
    //
    // ⚠️ No volver a PKCE (`?code=` + exchangeCodeForSession). PKCE exige el
    // `code_verifier` que quedó en el navegador que PIDIÓ la liga; en cualquier
    // otro sale "liga vencida" con una liga recién hecha. Eso tuvo bloqueados a
    // los afiliados hasta el 6-ago-2026 — se atendía como si fuera el correo.
    //
    // `?code=` y `#access_token=` siguen aquí solo por las ligas viejas que
    // todavía anden en bandejas de entrada.
    async function abrirSesion() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) return setEstado("listo");

      const params = new URLSearchParams(window.location.search);

      const tokenHash = params.get("token_hash");
      if (tokenHash) {
        const { error } = await supabase.auth.verifyOtp({
          type: "recovery",
          token_hash: tokenHash,
        });
        return setEstado(error ? "invalido" : "listo");
      }

      const code = params.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        return setEstado(error ? "invalido" : "listo");
      }
      setEstado("invalido");
    }
    // el evento llega cuando el SDK procesa la liga por su cuenta
    const { data: sub } = supabase.auth.onAuthStateChange((_evento, session) => {
      if (session) setEstado("listo");
    });
    void abrirSesion();
    return () => sub.subscription.unsubscribe();
  }, []);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setMsg(null);
    if (password.length < 8) return setMsg("La contraseña debe tener al menos 8 caracteres.");
    if (password !== confirmar) return setMsg("Las dos contraseñas no coinciden.");
    setLoading(true);
    const { error } = await supabaseBrowser().auth.updateUser({ password });
    setLoading(false);
    if (error) return setMsg("No se pudo guardar. Pide una liga nueva e intenta otra vez.");
    router.push("/panel");
  }

  return (
    <main className="relative">
      <div className="aurora">
        <span className="b1" />
      </div>
      <div className="wrap relative flex justify-center pb-24 pt-16">
        <div className="glass a1 w-full max-w-md p-8">
          {estado === "verificando" ? (
            <>
              <p className="sec-tag mb-4">Un momento</p>
              <h1 className="text-2xl font-extrabold">Validando tu liga…</h1>
            </>
          ) : estado === "invalido" ? (
            <>
              <p className="sec-tag mb-4">Liga vencida</p>
              <h1 className="text-2xl font-extrabold">Esta liga ya no sirve</h1>
              <p className="mt-3 leading-relaxed text-white/55">
                Las ligas para cambiar contraseña caducan y solo se pueden usar una vez. Pide una
                nueva y vuelve a intentarlo.
              </p>
              <Link href="/recuperar" className="btn-cta btn-press !mt-8 inline-block">
                Pedir liga nueva →
              </Link>
            </>
          ) : (
            <>
              <p className="sec-tag mb-4">Último paso</p>
              <h1 className="text-2xl font-extrabold">Crea tu contraseña nueva</h1>
              <form onSubmit={guardar} className="mt-6 space-y-4">
                <div>
                  <label className="label">Contraseña nueva</label>
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    autoComplete="new-password"
                    className="field"
                  />
                </div>
                <div>
                  <label className="label">Repítela</label>
                  <input
                    value={confirmar}
                    onChange={(e) => setConfirmar(e.target.value)}
                    type="password"
                    placeholder="La misma de arriba"
                    autoComplete="new-password"
                    className="field"
                  />
                </div>
                {msg ? <p className="text-sm font-semibold text-[#ffb2b2]">{msg}</p> : null}
                <button disabled={loading} className="btn-cta btn-press !mt-6 w-full">
                  {loading ? "Guardando…" : "Guardar y entrar →"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
