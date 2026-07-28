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

interface Recurso {
  id: string;
  titulo: string;
  descripcion: string;
  url: string;
  tipo: string;
}

const TIPO_LABEL: Record<string, string> = {
  imagen: "Imagen",
  video: "Video",
  archivo: "Archivo",
  link: "Enlace",
};

export default function PanelClient({
  nombre,
  activo,
  sinPerfil,
  inscripciones,
  recursos,
}: {
  nombre: string;
  activo: boolean;
  sinPerfil: boolean;
  inscripciones: Inscripcion[];
  recursos: Recurso[];
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

  function compartirWa(r: Recurso) {
    const texto = `${r.titulo} — te comparto esto de Sinergéticos: ${r.url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank");
  }

  if (sinPerfil) {
    return (
      <main className="relative">
        <div className="aurora"><span className="b1" /></div>
        <div className="wrap relative flex justify-center pb-24 pt-16">
          <div className="glass a1 w-full max-w-md p-8">
            <p className="sec-tag mb-4">Un último paso</p>
            <h1 className="text-2xl font-extrabold">Activa tu cuenta</h1>
            <p className="mt-2 text-white/55">Dinos tu nombre para activar tu cuenta de afiliado.</p>
            <form onSubmit={completarPerfil} className="mt-6 space-y-4">
              <div>
                <label className="label">Tu nombre</label>
                <input value={nombrePerfil} onChange={(e) => setNombrePerfil(e.target.value)} placeholder="Nombre completo" className="field" />
              </div>
              <button className="btn-cta btn-press w-full">Activar mi cuenta →</button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative">
      <div className="aurora"><span className="b1" /><span className="b2" /></div>
      <div className="wrap relative pb-24 pt-12">
        <div className="a1 flex items-start justify-between gap-4">
          <div>
            <p className="sec-tag mb-3">
              <span className="pulse inline-block h-1.5 w-1.5 rounded-full bg-[#19e16d]" />
              Tu panel de afiliado
            </p>
            <h1 className="text-3xl font-extrabold">Hola, {nombre.split(" ")[0]}</h1>
            <p className="mt-1.5 text-white/55">Inscribe a tus invitados y su boleto les llega por WhatsApp.</p>
          </div>
          <button onClick={salir} className="btn-ghost btn-press !px-4 !py-2 !text-sm">
            Salir
          </button>
        </div>

        {!activo ? (
          <div className="a2 mt-8 rounded-xl border border-[#ffb2b2]/40 bg-[#ffb2b2]/10 p-4 text-sm text-[#ffb2b2]">
            Tu cuenta está desactivada — contacta al equipo de Sinergéticos.
          </div>
        ) : (
          <form onSubmit={inscribir} className="glass a2 mt-8 space-y-4 p-6 sm:p-7">
            <div>
              <p className="sec-tag mb-1">Nuevo invitado</p>
              <h2 className="text-xl font-bold">Inscribir a alguien</h2>
            </div>
            <div>
              <label className="label">Evento</label>
              <select value={eventoId} onChange={(e) => setEventoId(e.target.value)} className="field">
                <option value="">Elige el evento…</option>
                {eventos.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name}
                    {ev.venue ? ` — ${ev.venue}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Nombre del invitado</label>
                <input value={invNombre} onChange={(e) => setInvNombre(e.target.value)} placeholder="Nombre completo" className="field" />
              </div>
              <div>
                <label className="label">Correo del invitado</label>
                <input value={invEmail} onChange={(e) => setInvEmail(e.target.value)} type="email" placeholder="correo@ejemplo.com" className="field" />
              </div>
            </div>
            <div>
              <label className="label">WhatsApp del invitado</label>
              <div className="flex gap-2">
                <select value={dial} onChange={(e) => setDial(e.target.value)} className="field !w-28">
                  <option value="52">🇲🇽 +52</option>
                  <option value="1">🇺🇸 +1</option>
                </select>
                <input value={invTel} onChange={(e) => setInvTel(e.target.value)} inputMode="tel" placeholder="10 dígitos" className="field" />
              </div>
            </div>
            {msg ? (
              <p className={`text-sm font-semibold ${msg.ok ? "text-[#19e16d]" : "text-[#ffb2b2]"}`}>{msg.texto}</p>
            ) : null}
            <button disabled={loading} className="btn-cta btn-press w-full">
              {loading ? "Creando boleto…" : "Inscribir y crear boleto →"}
            </button>
          </form>
        )}

        {recursos.length > 0 ? (
          <section className="a3 mt-12">
            <p className="sec-tag mb-1">Material para compartir</p>
            <h2 className="text-xl font-bold">Recursos</h2>
            <p className="mt-1 text-sm text-white/55">
              Descárgalos o mándalos directo por WhatsApp a tus contactos.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {recursos.map((r) => (
                <div key={r.id} className="glass flex flex-col p-5">
                  <span className="sec-tag">{TIPO_LABEL[r.tipo] ?? "Recurso"}</span>
                  <p className="mt-2 font-bold">{r.titulo}</p>
                  {r.descripcion ? (
                    <p className="mt-1 text-sm leading-relaxed text-white/55">{r.descripcion}</p>
                  ) : null}
                  <div className="mt-4 flex gap-2 pt-1">
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-ghost btn-press !px-4 !py-2 !text-sm"
                    >
                      {r.tipo === "link" ? "Abrir" : "Descargar"}
                    </a>
                    <button onClick={() => compartirWa(r)} className="btn-cta btn-press !px-4 !py-2 !text-sm">
                      Compartir por WhatsApp
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="a4 mt-12">
          <p className="sec-tag mb-1">Tu conteo</p>
          <h2 className="text-xl font-bold">Mis inscritos ({inscripciones.length})</h2>
          {inscripciones.length === 0 ? (
            <p className="mt-2 text-sm text-white/45">Aún no inscribes a nadie.</p>
          ) : (
            <div className="glass mt-4 overflow-x-auto !rounded-xl">
              <table className="w-full text-sm">
                <thead className="text-left text-white/45">
                  <tr className="border-b border-white/10">
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em]">Invitado</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em]">Evento</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em]">WhatsApp</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em]">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {inscripciones.map((i) => (
                    <tr key={i.id} className="border-t border-white/[0.06]">
                      <td className="px-4 py-3 font-semibold">{i.nombre}</td>
                      <td className="px-4 py-3 text-white/60">{i.event_name}</td>
                      <td className="px-4 py-3 tabular text-white/60">{i.telefono}</td>
                      <td className="px-4 py-3">
                        <span className={i.status === "emitido" ? "font-semibold text-[#19e16d]" : "text-[#ffd28a]"}>
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
      </div>
    </main>
  );
}
