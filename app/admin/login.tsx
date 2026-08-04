"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [llave, setLlave] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setMsg(null);
    setLoading(true);
    const r = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ llave: llave.trim() }),
    });
    setLoading(false);
    if (!r.ok) return setMsg("Llave incorrecta.");
    router.refresh();
  }

  return (
    <main className="relative">
      <div className="aurora">
        <span className="b1" />
      </div>
      <div className="wrap relative flex justify-center pb-24 pt-16">
        <div className="glass a1 w-full max-w-md p-8">
          <p className="sec-tag mb-4">Administración</p>
          <h1 className="text-2xl font-extrabold">Acceso restringido</h1>
          <form onSubmit={entrar} className="mt-6 space-y-4">
            <div>
              <label className="label">Llave de administración</label>
              <input
                value={llave}
                onChange={(e) => setLlave(e.target.value)}
                type="password"
                autoComplete="off"
                className="field"
              />
            </div>
            {msg ? <p className="text-sm font-semibold text-[#ffb2b2]">{msg}</p> : null}
            <button disabled={loading} className="btn-cta btn-press !mt-6 w-full">
              {loading ? "Entrando…" : "Entrar →"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
