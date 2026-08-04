"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface Admin {
  email: string;
  agregado_por: string;
  created_at: string;
}

export default function AdminAdmins({
  admins,
  yo,
}: {
  admins: Admin[];
  yo: string | null;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function agregar(e: React.FormEvent) {
    e.preventDefault();
    if (ocupado) return;
    setMsg(null);
    setOcupado(true);
    try {
      const r = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const d = (await r.json()) as { ok?: boolean; error?: string };
      if (!r.ok || !d.ok) {
        setMsg({ ok: false, texto: d.error ?? "No se pudo agregar." });
      } else {
        setMsg({ ok: true, texto: `${email.trim().toLowerCase()} ya es administrador.` });
        setEmail("");
        router.refresh();
      }
    } catch {
      setMsg({ ok: false, texto: "Error de conexión." });
    }
    setOcupado(false);
  }

  async function quitar(correo: string) {
    if (ocupado) return;
    setMsg(null);
    setOcupado(true);
    try {
      const r = await fetch("/api/admin/admins", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: correo }),
      });
      const d = (await r.json()) as { ok?: boolean; error?: string };
      if (!r.ok || !d.ok) setMsg({ ok: false, texto: d.error ?? "No se pudo quitar." });
      else router.refresh();
    } catch {
      setMsg({ ok: false, texto: "Error de conexión." });
    }
    setOcupado(false);
  }

  return (
    <section className="mt-12">
      <p className="sec-tag mb-1">Accesos</p>
      <h2 className="text-xl font-bold">Administradores ({admins.length})</h2>
      <p className="mt-1 text-sm text-white/55">
        Quien esté aquí entra al panel con su propia cuenta. Se puede autorizar un correo
        aunque todavía no tenga cuenta: queda admin en cuanto se registre con él.
      </p>

      <div className="glass mt-4 overflow-x-auto !rounded-xl">
        <table className="w-full text-sm">
          <thead className="text-left text-white/45">
            <tr className="border-b border-white/10">
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em]">Correo</th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em]">Lo agregó</th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em]"></th>
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a.email} className="border-t border-white/[0.06]">
                <td className="px-4 py-3 font-semibold">
                  {a.email}
                  {yo === a.email ? (
                    <span className="ml-2 rounded bg-[#19e16d]/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#19e16d]">
                      tú
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-white/50">{a.agregado_por}</td>
                <td className="px-4 py-3 text-right">
                  {yo === a.email ? (
                    <span className="text-xs text-white/25">—</span>
                  ) : (
                    <button
                      onClick={() => quitar(a.email)}
                      disabled={ocupado}
                      className="rounded-lg bg-white/10 px-3 py-1 text-xs font-bold text-white/60 transition hover:bg-[#ffb2b2]/15 hover:text-[#ffb2b2] disabled:opacity-50"
                    >
                      Quitar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={agregar} className="mt-4 flex flex-wrap items-end gap-3">
        <div className="min-w-[260px] flex-1">
          <label className="label">Agregar administrador</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="correo@sinergeticos.com"
            className="field"
          />
        </div>
        <button disabled={ocupado} className="btn-cta btn-press !px-5 !py-2.5 !text-sm">
          {ocupado ? "Guardando…" : "Agregar"}
        </button>
      </form>
      {msg ? (
        <p className={`mt-3 text-sm font-semibold ${msg.ok ? "text-[#19e16d]" : "text-[#ffb2b2]"}`}>
          {msg.texto}
        </p>
      ) : null}
    </section>
  );
}
