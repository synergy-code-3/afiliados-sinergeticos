"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase";
import { buildE164, validarTelefono } from "@/lib/phone";

interface Evento {
  id: string;
  name: string;
  date: string;
  venue: string;
}

interface Inscripcion {
  id: string;
  event_name: string;
  nombre: string;
  email: string;
  telefono: string;
  status: string;
  created_at: string;
}

const inputCls =
  "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-base outline-none focus:border-[#19e16d]";

export default function PanelClient({
  nombre,
  activo,
  sinPerfil,
  inscripciones,
}: {
  nombre: string;
  activo: boolean;
  sinPerfil: boolean;
  inscripciones: Inscripcion[];
}) {
  const router = useRouter();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [eventoId, setEventoId] = useState("");
  const [invNombre, setInvNombre] = useState("");
  const [invEmail, setInvEmail] = useState("");
  const [dial, setDial] = useState("52");
  const [invTel, setInvTel] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [nombrePerfil, setNombrePerfil] = useState("");

  useEffect(() => {
    fetch("/api/eventos")
      .then((r) => r.json())
      .then((d: { eventos: Evento[] }) => {
        setEventos(d.eventos);
        if (d.eventos.length === 1) setEventoId(d.eventos[0].id);
      })
      .catch(() => setEventos([]));
  }, []);

  async function completarPerfil(e: React.FormEvent) {
    e.preventDefault();
    if (!nombrePerfil.trim()) return;
    const supabase = supabaseBrowser();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return router.push("/entrar");
    await supabase.from("af_afiliados").insert({ id: user.id, nombre: nombrePerfil.trim() });
    router.refresh();
  }

  async function inscribir(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setMsg(null);
    const evento = eventos.find((ev) => ev.id === eventoId);
    if (!evento) return setMsg({ ok: false, texto: "Elige el evento." });
    if (!invNombre.trim()) return setMsg({ ok: false, texto: "Escribe el nombre de tu invitado." });
    const e164 = buildE164(dial, invTel);
    const telErr = validarTelefono(e164);
    if (telErr) return setMsg({ ok: false, texto: telErr });
    setLoading(true);
    try {
      const r = await fetch("/api/inscribir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_tk_id: evento.id,
          event_name: evento.name,
          nombre: invNombre.trim(),
          email: invEmail.trim(),
          telefono: e164,
        }),
      });
      const data = (await r.json()) as { ok?: boolean; error?: string };
      if (!r.ok || !data.ok) {
        setMsg({ ok: false, texto: data.error ?? "No se pudo inscribir. Intenta de nuevo." });
      } else {
        setMsg({
          ok: true,
          texto: `Listo — ${invNombre.trim()} ya tiene su boleto. Le llega por WhatsApp en un momento.`,
        });
        setInvNombre("");
        setInvEmail("");
        setInvTel("");
        router.refresh();
      }
    } catch {
      setMsg({ ok: false, texto: "Error de conexión. Intenta de nuevo." });
    }
    setLoading(false);
  }

  async function salir() {
    await supabaseBrowser().auth.signOut();
    router.push("/");
  }

  if (sinPerfil) {
    return (
      <main className="mx-auto max-w-md">
        <h1 className="text-2xl font-extrabold">Un último paso</h1>
        <p className="mt-2 text-white/70">Dinos tu nombre para activar tu cuenta de afiliado.</p>
        <form onSubmit={completarPerfil} className="mt-6 space-y-3">
          <input value={nombrePerfil} onChange={(e) => setNombrePerfil(e.target.value)} placeholder="Tu nombre completo" className={inputCls} />
          <button className="w-full rounded-xl bg-[#19e16d] px-5 py-3 font-bold text-black transition hover:brightness-110">
            Activar mi cuenta
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">Hola, {nombre.split(" ")[0]}</h1>
          <p className="text-sm text-white/60">Inscribe a tus invitados y su boleto les llega por WhatsApp.</p>
        </div>
        <button onClick={salir} className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-white/70 hover:border-white/40">
          Salir
        </button>
      </div>

      {!activo ? (
        <div className="mt-6 rounded-xl border border-[#ffb2b2]/40 bg-[#ffb2b2]/10 p-4 text-sm text-[#ffb2b2]">
          Tu cuenta está desactivada — contacta al equipo de Sinergéticos.
        </div>
      ) : (
        <form onSubmit={inscribir} className="mt-8 space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="font-bold">Inscribir invitado</h2>
          <select value={eventoId} onChange={(e) => setEventoId(e.target.value)} className={inputCls}>
            <option value="">Elige el evento…</option>
            {eventos.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.name}
                {ev.venue ? ` — ${ev.venue}` : ""}
              </option>
            ))}
          </select>
          <input value={invNombre} onChange={(e) => setInvNombre(e.target.value)} placeholder="Nombre completo del invitado" className={inputCls} />
          <input value={invEmail} onChange={(e) => setInvEmail(e.target.value)} type="email" placeholder="Correo del invitado" className={inputCls} />
          <div className="flex gap-2">
            <select value={dial} onChange={(e) => setDial(e.target.value)} className="w-28 rounded-xl border border-white/15 bg-white/5 px-3 py-3 text-base outline-none focus:border-[#19e16d]">
              <option value="52">🇲🇽 +52</option>
              <option value="1">🇺🇸 +1</option>
            </select>
            <input value={invTel} onChange={(e) => setInvTel(e.target.value)} inputMode="tel" placeholder="WhatsApp (10 dígitos)" className={inputCls} />
          </div>
          {msg ? (
            <p className={`text-sm font-semibold ${msg.ok ? "text-[#19e16d]" : "text-[#ffb2b2]"}`}>{msg.texto}</p>
          ) : null}
          <button disabled={loading} className="w-full rounded-xl bg-[#19e16d] px-5 py-3 font-bold text-black transition hover:brightness-110 disabled:opacity-50">
            {loading ? "Creando boleto…" : "Inscribir y crear boleto"}
          </button>
        </form>
      )}

      <section className="mt-10">
        <h2 className="font-bold">Mis inscritos ({inscripciones.length})</h2>
        {inscripciones.length === 0 ? (
          <p className="mt-2 text-sm text-white/50">Aún no inscribes a nadie.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-left text-white/60">
                <tr>
                  <th className="px-3 py-2 font-semibold">Invitado</th>
                  <th className="px-3 py-2 font-semibold">Evento</th>
                  <th className="px-3 py-2 font-semibold">WhatsApp</th>
                  <th className="px-3 py-2 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {inscripciones.map((i) => (
                  <tr key={i.id} className="border-t border-white/10">
                    <td className="px-3 py-2">{i.nombre}</td>
                    <td className="px-3 py-2 text-white/70">{i.event_name}</td>
                    <td className="px-3 py-2 text-white/70">{i.telefono}</td>
                    <td className="px-3 py-2">
                      <span className={i.status === "emitido" ? "text-[#19e16d]" : "text-[#ffd28a]"}>
                        {i.status === "emitido" ? "Boleto enviado" : i.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
