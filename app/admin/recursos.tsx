"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface Recurso {
  id: string;
  titulo: string;
  descripcion: string;
  url: string;
  tipo: string;
  activo: boolean;
}

export default function AdminRecursos({ recursos, k }: { recursos: Recurso[]; k: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function crear(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setMsg(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    fd.set("k", k);
    try {
      const r = await fetch("/api/admin/recursos", { method: "POST", body: fd });
      const data = (await r.json()) as { ok?: boolean; error?: string };
      if (!r.ok || !data.ok) {
        setMsg(data.error ?? "No se pudo crear el recurso.");
      } else {
        formRef.current?.reset();
        router.refresh();
      }
    } catch {
      setMsg("Error de conexión.");
    }
    setLoading(false);
  }

  async function borrar(id: string, titulo: string) {
    if (!confirm(`¿Borrar "${titulo}"?`)) return;
    await fetch("/api/admin/recursos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, k }),
    });
    router.refresh();
  }

  return (
    <section className="mt-12">
      <p className="sec-tag mb-1">Material compartible</p>
      <h2 className="text-xl font-bold">Recursos ({recursos.length})</h2>

      <form ref={formRef} onSubmit={crear} className="glass mt-4 space-y-4 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Título</label>
            <input name="titulo" placeholder="Ej. Flyer SEED agosto" className="field" />
          </div>
          <div>
            <label className="label">Descripción · opcional</label>
            <input name="descripcion" placeholder="Para qué sirve" className="field" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Archivo (imagen, video, PDF…)</label>
            <input name="archivo" type="file" className="field !p-3 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[#19e16d] file:px-3 file:py-1.5 file:font-bold file:text-black" />
          </div>
          <div>
            <label className="label">…o link externo</label>
            <input name="link" placeholder="https://…" className="field" />
          </div>
        </div>
        {msg ? <p className="text-sm font-semibold text-[#ffb2b2]">{msg}</p> : null}
        <button disabled={loading} className="btn-cta btn-press !mt-6">
          {loading ? "Subiendo…" : "Agregar recurso"}
        </button>
      </form>

      {recursos.length > 0 ? (
        <div className="glass mt-4 overflow-x-auto !rounded-xl">
          <table className="w-full text-sm">
            <thead className="text-left text-white/45">
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em]">Recurso</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em]">Tipo</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em]">URL</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {recursos.map((r) => (
                <tr key={r.id} className="border-t border-white/[0.06]">
                  <td className="px-4 py-3 font-semibold">{r.titulo}</td>
                  <td className="px-4 py-3 text-white/60">{r.tipo}</td>
                  <td className="max-w-[260px] truncate px-4 py-3">
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-[#19e16d] hover:underline">
                      {r.url}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => borrar(r.id, r.titulo)}
                      className="rounded-lg bg-[#ffb2b2]/15 px-3 py-1 text-xs font-bold text-[#ffb2b2] transition hover:bg-[#ffb2b2]/25"
                    >
                      Borrar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
