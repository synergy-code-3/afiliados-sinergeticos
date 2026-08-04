"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase";
import { buildE164, validarTelefono } from "@/lib/phone";
import { ligaBoleto, estadoLegible } from "@/lib/boleto-ui";
import { construirCsv, descargarCsv } from "@/lib/csv";
import { PAGO_DIAS_HABILES, VALIDACION_HORAS } from "@/lib/comisiones";
import type { Metricas, MiembroEquipo, MisComisiones, TotalMoneda } from "./page";
import Proyector from "./secciones/proyector";
import Equipo from "./secciones/equipo";
import SeccionPremios from "./secciones/premios";
import SeccionTutoriales from "./secciones/tutoriales";
import SeccionPracticas from "./secciones/practicas";
import MapaComisiones from "./secciones/mapa-comisiones";

interface Evento {
  id: string;
  name: string;
  date: string;
  venue: string;
  /** "MX" | "US" — decide si el afiliado ve pesos o dólares */
  pais: string;
}

interface Inscripcion {
  id: string;
  event_name: string;
  nombre: string;
  email: string;
  telefono: string;
  status: string;
  ticket_id: string | null;
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
  metricas,
  esAdmin,
  perfil,
  dbListo,
  apodo,
  fotoUrl,
  codigoRef,
  equipo,
  overridePorMoneda,
  misComisiones,
}: {
  nombre: string;
  activo: boolean;
  sinPerfil: boolean;
  inscripciones: Inscripcion[];
  recursos: Recurso[];
  metricas: Metricas | null;
  esAdmin: boolean;
  perfil: { nombre: string; ciudad: string; telefono: string };
  dbListo: boolean;
  apodo: string | null;
  fotoUrl: string | null;
  codigoRef: string | null;
  equipo: MiembroEquipo[];
  overridePorMoneda: TotalMoneda[];
  misComisiones: MisComisiones | null;
}) {
  // los premios se ganan por referidos que YA COMPRARON, no por invitados
  // (la escalera visual con imágenes vive en secciones/premios.tsx)
  const cerrados = metricas?.cerrados ?? 0;
  const ingresos = metricas?.ingresos ?? [];
  const hayComisiones = Boolean(
    misComisiones &&
      (misComisiones.pendiente.length ||
        misComisiones.validada.length ||
        misComisiones.pagada.length ||
        overridePorMoneda.length),
  );
  const dinero = (cents: number, moneda: string) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: moneda }).format(cents / 100);
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
  const [copiado, setCopiado] = useState<string | null>(null);
  const [editando, setEditando] = useState<string | null>(null);
  const [edit, setEdit] = useState({ nombre: "", email: "", telefono: "" });
  const [editMsg, setEditMsg] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);
  const [editPerfil, setEditPerfil] = useState(false);
  const [perfilForm, setPerfilForm] = useState(perfil);
  const [perfilMsg, setPerfilMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);
  const [fotoActual, setFotoActual] = useState(fotoUrl);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [fotoMsg, setFotoMsg] = useState<string | null>(null);
  const fotoInputRef = useRef<HTMLInputElement>(null);

  /** Sube la foto (la promesa del onboarding: "ponla después desde tu panel").
   * /api/foto valida bytes y guarda por sesión; luego se fija en el perfil. */
  async function cambiarFoto(archivo: File) {
    if (subiendoFoto) return;
    setFotoMsg(null);
    setSubiendoFoto(true);
    try {
      const fd = new FormData();
      fd.append("foto", archivo);
      const r = await fetch("/api/foto", { method: "POST", body: fd });
      const d = (await r.json()) as { ok?: boolean; url?: string; error?: string };
      if (!d.ok || !d.url) {
        setFotoMsg(
          d.error === "pendiente"
            ? "Muy pronto podrás subir tu foto — estamos activando esta parte."
            : d.error ?? "No se pudo subir tu foto. Intenta de nuevo.",
        );
      } else {
        const p = await fetch("/api/perfil", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ foto_url: d.url }),
        });
        const pd = (await p.json()) as { ok?: boolean; error?: string };
        if (pd.ok) {
          setFotoActual(d.url);
          router.refresh();
        } else {
          setFotoMsg(pd.error ?? "No se pudo guardar tu foto. Intenta de nuevo.");
        }
      }
    } catch {
      setFotoMsg("Error de conexión. Intenta de nuevo.");
    }
    setSubiendoFoto(false);
  }

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

    // Atribución rescatada de /crear-cuenta?ref= (flujo con confirmación de
    // correo: el insert del perfil corre hasta aquí y el CÓDIGO viajó en
    // localStorage — patrón del embudo BGI). El servidor resuelve el código
    // (RPC): el navegador jamás decide quién cobra el override. Si la
    // migración 0082 no está aplicada, falla silencioso.
    let codigo: string | null = null;
    try {
      codigo = localStorage.getItem("synergy_ref");
    } catch {
      codigo = null;
    }
    if (codigo && /^[A-Z0-9]{6}$/.test(codigo)) {
      await supabase.rpc("af_vincular_referido", { p_codigo: codigo });
    }
    try {
      localStorage.removeItem("synergy_ref");
    } catch {
      // sin consecuencia
    }
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
          pais: evento.pais,
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

  async function guardarPerfil(e: React.FormEvent) {
    e.preventDefault();
    if (guardandoPerfil) return;
    setPerfilMsg(null);
    setGuardandoPerfil(true);
    try {
      const r = await fetch("/api/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(perfilForm),
      });
      const data = (await r.json()) as { ok?: boolean; error?: string };
      if (!r.ok || !data.ok) {
        setPerfilMsg({ ok: false, texto: data.error ?? "No se pudo guardar." });
      } else {
        setPerfilMsg({ ok: true, texto: "Perfil actualizado." });
        setEditPerfil(false);
        router.refresh();
      }
    } catch {
      setPerfilMsg({ ok: false, texto: "Error de conexión. Intenta de nuevo." });
    }
    setGuardandoPerfil(false);
  }

  async function salir() {
    await supabaseBrowser().auth.signOut();
    router.push("/");
  }

  async function copiarLiga(i: Inscripcion) {
    if (!i.ticket_id) return;
    const liga = ligaBoleto(i.ticket_id);
    try {
      await navigator.clipboard.writeText(liga);
    } catch {
      // navegadores sin permiso de portapapeles (o http): fallback manual
      const ta = document.createElement("textarea");
      ta.value = liga;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopiado(i.id);
    setTimeout(() => setCopiado((actual) => (actual === i.id ? null : actual)), 2000);
  }

  function abrirEdicion(i: Inscripcion) {
    setEditando(i.id);
    setEditMsg(null);
    setAviso(null);
    setEdit({ nombre: i.nombre, email: i.email, telefono: i.telefono });
  }

  async function guardarEdicion(i: Inscripcion) {
    if (ocupado) return;
    setEditMsg(null);
    const telErr = validarTelefono(edit.telefono.trim());
    if (telErr) return setEditMsg(telErr);
    setOcupado(i.id);
    try {
      const r = await fetch(`/api/inscripciones/${i.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(edit),
      });
      const data = (await r.json()) as { ok?: boolean; error?: string; boletoYaEmitido?: boolean };
      if (!r.ok || !data.ok) {
        setEditMsg(data.error ?? "No se pudo guardar.");
      } else {
        setEditando(null);
        setAviso({
          ok: true,
          texto: data.boletoYaEmitido
            ? "Datos corregidos. El boleto ya emitido conserva los datos anteriores, pero sigue siendo válido — mándaselo con “Copiar liga”."
            : "Datos corregidos.",
        });
        router.refresh();
      }
    } catch {
      setEditMsg("Error de conexión. Intenta de nuevo.");
    }
    setOcupado(null);
  }

  async function reintentar(i: Inscripcion) {
    if (ocupado) return;
    setAviso(null);
    setOcupado(i.id);
    try {
      const r = await fetch(`/api/inscripciones/${i.id}`, { method: "POST" });
      const data = (await r.json()) as { ok?: boolean; error?: string };
      setAviso(
        r.ok && data.ok
          ? { ok: true, texto: `Listo — el boleto de ${i.nombre} ya se emitió.` }
          : { ok: false, texto: data.error ?? "No se pudo emitir." },
      );
      if (r.ok && data.ok) router.refresh();
    } catch {
      setAviso({ ok: false, texto: "Error de conexión. Intenta de nuevo." });
    }
    setOcupado(null);
  }

  function exportar() {
    const csv = construirCsv(
      ["Invitado", "Correo", "WhatsApp", "Evento", "Estado", "Fecha", "Liga del boleto"],
      inscripciones.map((i) => [
        i.nombre,
        i.email,
        i.telefono,
        i.event_name,
        estadoLegible(i.status).texto,
        new Date(i.created_at).toLocaleDateString("es-MX", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
        i.ticket_id ? ligaBoleto(i.ticket_id) : "",
      ]),
    );
    descargarCsv("mis-inscritos", csv);
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
                <label className="label" htmlFor="activa-nombre">Tu nombre</label>
                <input id="activa-nombre" value={nombrePerfil} onChange={(e) => setNombrePerfil(e.target.value)} placeholder="Nombre completo" className="field" />
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
          <div className="flex items-center gap-4">
            {fotoActual ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={fotoActual}
                alt=""
                className="h-14 w-14 flex-none rounded-full border-2 border-[#19e16d]/40 object-cover"
              />
            ) : null}
            <div>
              <p className="sec-tag mb-3">
                <span className="pulse inline-block h-1.5 w-1.5 rounded-full bg-[#19e16d]" />
                Tu panel Synergy +1
              </p>
              <h1 className="text-3xl font-extrabold">Hola, {apodo || nombre.split(" ")[0]}</h1>
              <p className="mt-1.5 text-white/55">
                Inscribe a tus invitados y su pase VIP les llega por WhatsApp.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {esAdmin ? (
              <Link href="/admin" className="btn-ghost btn-press !px-4 !py-2 !text-sm">
                Administración
              </Link>
            ) : null}
            <button
              onClick={() => {
                setPerfilForm(perfil);
                setPerfilMsg(null);
                setEditPerfil((v) => !v);
              }}
              className="btn-ghost btn-press !px-4 !py-2 !text-sm"
            >
              Mi perfil
            </button>
            <button onClick={salir} className="btn-ghost btn-press !px-4 !py-2 !text-sm">
              Salir
            </button>
          </div>
        </div>

        {editPerfil ? (
          <form onSubmit={guardarPerfil} className="glass a2 mt-8 space-y-4 p-6 sm:p-7">
            <div>
              <p className="sec-tag mb-1">Tus datos</p>
              <h2 className="text-xl font-bold">Mi perfil</h2>
              <p className="mt-1 text-sm text-white/55">
                Así te ve el equipo de Sinergéticos.
              </p>
            </div>
            {dbListo ? (
              <div className="flex items-center gap-4">
                {fotoActual ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={fotoActual}
                    alt="Tu foto de perfil"
                    className="h-16 w-16 flex-none rounded-full border-2 border-[#19e16d]/40 object-cover"
                  />
                ) : (
                  <span className="grid h-16 w-16 flex-none place-items-center rounded-full border-2 border-white/15 text-xl font-extrabold text-[#19e16d]">
                    {(apodo || nombre).trim().charAt(0).toUpperCase()}
                  </span>
                )}
                <div>
                  <input
                    ref={fotoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void cambiarFoto(f);
                      e.target.value = "";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fotoInputRef.current?.click()}
                    disabled={subiendoFoto}
                    className="btn-ghost btn-press !px-4 !py-2.5 !text-sm"
                  >
                    {subiendoFoto ? "Subiendo…" : fotoActual ? "Cambiar mi foto" : "Subir mi foto"}
                  </button>
                  {fotoMsg ? <p className="mt-2 text-sm font-semibold text-[#ffb2b2]">{fotoMsg}</p> : null}
                </div>
              </div>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="label" htmlFor="perfil-nombre">Tu nombre</label>
                <input
                  id="perfil-nombre"
                  value={perfilForm.nombre}
                  onChange={(e) => setPerfilForm({ ...perfilForm, nombre: e.target.value })}
                  placeholder="Nombre completo"
                  className="field"
                />
              </div>
              <div>
                <label className="label" htmlFor="perfil-ciudad">Tu ciudad · opcional</label>
                <input
                  id="perfil-ciudad"
                  value={perfilForm.ciudad}
                  onChange={(e) => setPerfilForm({ ...perfilForm, ciudad: e.target.value })}
                  placeholder="¿De dónde eres?"
                  className="field"
                />
              </div>
              <div>
                <label className="label" htmlFor="perfil-whatsapp">Tu WhatsApp · opcional</label>
                <input
                  id="perfil-whatsapp"
                  value={perfilForm.telefono}
                  onChange={(e) => setPerfilForm({ ...perfilForm, telefono: e.target.value })}
                  inputMode="tel"
                  placeholder="+52..."
                  className="field"
                />
              </div>
            </div>
            {perfilMsg ? (
              <p
                className={`text-sm font-semibold ${
                  perfilMsg.ok ? "text-[#19e16d]" : "text-[#ffb2b2]"
                }`}
              >
                {perfilMsg.texto}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-3 !mt-6">
              <button disabled={guardandoPerfil} className="btn-cta btn-press !px-5 !py-2.5 !text-sm">
                {guardandoPerfil ? "Guardando…" : "Guardar cambios"}
              </button>
              <button
                type="button"
                onClick={() => setEditPerfil(false)}
                className="btn-ghost btn-press !px-5 !py-2.5 !text-sm"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : null}

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
              <label className="label" htmlFor="inv-evento">Evento</label>
              <select id="inv-evento" value={eventoId} onChange={(e) => setEventoId(e.target.value)} className="field">
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
                <label className="label" htmlFor="inv-nombre">Nombre del invitado</label>
                <input id="inv-nombre" value={invNombre} onChange={(e) => setInvNombre(e.target.value)} placeholder="Nombre completo" className="field" />
              </div>
              <div>
                <label className="label" htmlFor="inv-correo">Correo del invitado · opcional</label>
                <input id="inv-correo" value={invEmail} onChange={(e) => setInvEmail(e.target.value)} type="email" placeholder="correo@ejemplo.com" className="field" />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="inv-whatsapp">WhatsApp del invitado · obligatorio</label>
              <div className="flex gap-2">
                <select
                  value={dial}
                  onChange={(e) => setDial(e.target.value)}
                  className="field !w-28"
                  aria-label="Lada del país"
                >
                  <option value="52">🇲🇽 +52</option>
                  <option value="1">🇺🇸 +1</option>
                </select>
                <input id="inv-whatsapp" value={invTel} onChange={(e) => setInvTel(e.target.value)} inputMode="tel" placeholder="10 dígitos" className="field" />
              </div>
            </div>
            {msg ? (
              <p className={`text-sm font-semibold ${msg.ok ? "text-[#19e16d]" : "text-[#ffb2b2]"}`}>{msg.texto}</p>
            ) : null}
            <button disabled={loading} className="btn-cta btn-press !mt-6 w-full">
              {loading ? "Creando boleto…" : "Inscribir y crear boleto →"}
            </button>
          </form>
        )}

        {hayComisiones && misComisiones ? (
          <section className="a3 mt-12">
            <p className="sec-tag mb-1">Tu dinero</p>
            <h2 className="text-xl font-bold">Tus comisiones</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {(
                [
                  ["En validación", misComisiones.pendiente],
                  ["Validadas", misComisiones.validada],
                  ["Pagadas", misComisiones.pagada],
                ] as const
              ).map(([etiqueta, filas]) => (
                <div key={etiqueta} className="glass p-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">
                    {etiqueta}
                  </p>
                  {filas.length === 0 ? (
                    <p className="mt-1 text-2xl font-extrabold tabular text-white/30">—</p>
                  ) : (
                    filas.map((f) => (
                      <p key={f.moneda} className="mt-1 text-2xl font-extrabold tabular">
                        {dinero(f.cents, f.moneda)}
                      </p>
                    ))
                  )}
                </div>
              ))}
            </div>
            {overridePorMoneda.length > 0 ? (
              <p className="mt-3 text-sm text-white/55">
                Más tu bono de equipo:{" "}
                <span className="font-bold text-[#d9b45b]">
                  {overridePorMoneda.map((o) => dinero(o.cents, o.moneda)).join(" · ")}
                </span>{" "}
                por las ventas de tus +1.
              </p>
            ) : null}
            <p className="mt-2 text-xs text-white/40">
              Tras cada evento hay {VALIDACION_HORAS} horas para validar comisiones; después del
              corte, tu depósito llega en {PAGO_DIAS_HABILES} días hábiles.
            </p>
          </section>
        ) : null}

        {ingresos.length > 0 ? (
          <section className="a3 mt-12">
            <p className="sec-tag mb-1">Lo que has generado</p>
            <h2 className="text-xl font-bold">Ventas de tus referidos</h2>
            <p className="mt-1 text-sm text-white/55">
              Lo que compraron las personas que tú inscribiste, desde que las inscribiste.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {ingresos.map((ing) => (
                <div key={ing.moneda} className="glass p-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">
                    Histórico · {ing.moneda}
                  </p>
                  <p className="mt-1 text-2xl font-extrabold tabular">
                    {dinero(Number(ing.total_cents), ing.moneda)}
                  </p>
                  <p className="mt-3 text-sm text-white/55">
                    Este mes:{" "}
                    <span className="font-bold text-white/80">
                      {dinero(Number(ing.mes_cents ?? 0), ing.moneda)}
                    </span>
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-white/40">
              Son las ventas generadas, no tu comisión — el porcentaje se aplica aparte.
            </p>
          </section>
        ) : null}

        {activo ? (
          <>
            <SeccionPremios cerrados={cerrados} />
            <Proyector geografiaInicial="MX" />
            <MapaComisiones />
            <Equipo
              dbListo={dbListo}
              codigoRef={codigoRef}
              miembros={equipo}
              overridePorMoneda={overridePorMoneda}
            />
          </>
        ) : null}

        <SeccionTutoriales />
        <SeccionPracticas />

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
                  <div className="mt-5 flex flex-wrap gap-3">
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
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="sec-tag mb-1">Tu conteo</p>
              <h2 className="text-xl font-bold">Mis inscritos ({inscripciones.length})</h2>
            </div>
            {inscripciones.length > 0 ? (
              <button onClick={exportar} className="btn-ghost btn-press !px-4 !py-2 !text-sm">
                Descargar CSV
              </button>
            ) : null}
          </div>

          {inscripciones.length > 0 ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              {[
                ["Invitados", inscripciones.length],
                ["Con boleto", inscripciones.filter((i) => i.status === "emitido").length],
                ["Pendientes", inscripciones.filter((i) => i.status !== "emitido").length],
                ["Ya compraron", cerrados],
              ].map(([etiqueta, valor]) => (
                <div key={String(etiqueta)} className="glass px-5 py-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">
                    {etiqueta}
                  </p>
                  <p className="mt-1 text-2xl font-extrabold tabular">{valor}</p>
                </div>
              ))}
            </div>
          ) : null}
          {aviso ? (
            <p
              className={`mt-3 text-sm font-semibold ${aviso.ok ? "text-[#19e16d]" : "text-[#ffb2b2]"}`}
            >
              {aviso.texto}
            </p>
          ) : null}
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
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em]">Boleto</th>
                  </tr>
                </thead>
                <tbody>
                  {inscripciones.map((i) => {
                    const estado = estadoLegible(i.status);
                    if (editando === i.id) {
                      return (
                        <tr key={i.id} className="border-t border-white/[0.06] bg-white/[0.02]">
                          <td colSpan={5} className="px-4 py-5">
                            <p className="sec-tag mb-3">Corrigiendo a {i.nombre}</p>
                            <div className="grid gap-3 sm:grid-cols-3">
                              <div>
                                <label className="label" htmlFor="edit-nombre">Nombre</label>
                                <input
                                  id="edit-nombre"
                                  value={edit.nombre}
                                  onChange={(e) => setEdit({ ...edit, nombre: e.target.value })}
                                  className="field"
                                />
                              </div>
                              <div>
                                <label className="label" htmlFor="edit-correo">Correo</label>
                                <input
                                  id="edit-correo"
                                  value={edit.email}
                                  onChange={(e) => setEdit({ ...edit, email: e.target.value })}
                                  type="email"
                                  className="field"
                                />
                              </div>
                              <div>
                                <label className="label" htmlFor="edit-whatsapp">WhatsApp (con lada)</label>
                                <input
                                  id="edit-whatsapp"
                                  value={edit.telefono}
                                  onChange={(e) => setEdit({ ...edit, telefono: e.target.value })}
                                  inputMode="tel"
                                  placeholder="+52..."
                                  className="field"
                                />
                              </div>
                            </div>
                            {editMsg ? (
                              <p className="mt-3 text-sm font-semibold text-[#ffb2b2]">{editMsg}</p>
                            ) : null}
                            <div className="mt-4 flex flex-wrap gap-3">
                              <button
                                onClick={() => guardarEdicion(i)}
                                disabled={ocupado === i.id}
                                className="btn-cta btn-press !px-4 !py-2 !text-sm"
                              >
                                {ocupado === i.id ? "Guardando…" : "Guardar"}
                              </button>
                              <button
                                onClick={() => setEditando(null)}
                                className="btn-ghost btn-press !px-4 !py-2 !text-sm"
                              >
                                Cancelar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                    return (
                      <tr key={i.id} className="border-t border-white/[0.06]">
                        <td className="px-4 py-3 font-semibold">{i.nombre}</td>
                        <td className="px-4 py-3 text-white/60">{i.event_name}</td>
                        <td className="px-4 py-3 tabular text-white/60">{i.telefono}</td>
                        <td className="px-4 py-3">
                          <span
                            className={
                              estado.tono === "ok"
                                ? "font-semibold text-[#19e16d]"
                                : estado.tono === "espera"
                                  ? "text-[#ffd28a]"
                                  : "font-semibold text-[#ffb2b2]"
                            }
                          >
                            {estado.texto}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-2">
                            {i.ticket_id ? (
                              <>
                                <a
                                  href={ligaBoleto(i.ticket_id)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn-ghost btn-press !px-3 !py-1.5 !text-xs"
                                >
                                  Ver
                                </a>
                                <button
                                  onClick={() => copiarLiga(i)}
                                  className="btn-ghost btn-press !px-3 !py-1.5 !text-xs"
                                >
                                  {copiado === i.id ? "¡Copiada!" : "Copiar liga"}
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => reintentar(i)}
                                disabled={ocupado === i.id}
                                className="btn-cta btn-press !px-3 !py-1.5 !text-xs"
                              >
                                {ocupado === i.id ? "Emitiendo…" : "Reintentar boleto"}
                              </button>
                            )}
                            <button
                              onClick={() => abrirEdicion(i)}
                              className="btn-ghost btn-press !px-3 !py-1.5 !text-xs"
                            >
                              Editar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
