"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Sección "Recursos" del admin: subir videos, imágenes y archivos que los
 * afiliados comparten, o registrar ligas externas.
 *
 * La subida de archivos va DIRECTO del navegador a Supabase Storage con una
 * URL firmada (los videos no caben por la API de Vercel):
 *   1. POST /api/admin/recursos/subir { nombre, mime, bytes } → { signedUrl, urlPublica, tipo }
 *   2. PUT al signedUrl con XMLHttpRequest — mismos headers que usa
 *      storage-js en uploadToSignedUrl, pero con onprogress para la barra real.
 *   3. POST /api/admin/recursos { titulo, descripcion, url, tipo } registra la fila.
 */

interface Recurso {
  id: string;
  titulo: string;
  descripcion: string;
  url: string;
  tipo: string;
  activo: boolean;
}

const MAX_MB = 200;

/** Espejo de la allowlist del servidor — para avisar ANTES de intentar subir. */
const MIMES_OK = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
]);

const ACEPTA = [...MIMES_OK].join(",");

const MSG_TIPO =
  "Ese tipo de archivo no se puede subir. Acepto imágenes (JPG, PNG, WebP o GIF), videos (MP4, MOV o WebM), PDF y ZIP.";
const MSG_LIMITE_SERVIDOR =
  "El archivo pasa del límite del servidor (~50 MB) — compártelo como liga (Drive/YouTube) o pide a David subir el límite.";

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

/** "flyer_seed-agosto v2.pdf" → "flyer seed agosto v2" (para precargar el título). */
function limpiarNombre(nombre: string): string {
  return nombre
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatoPeso(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function validarArchivo(archivo: File): string | null {
  if (!MIMES_OK.has(archivo.type.toLowerCase())) return MSG_TIPO;
  if (archivo.size > MAX_MB * 1024 * 1024) {
    return `El archivo pesa más de ${MAX_MB} MB. Compártelo mejor como liga (Drive/YouTube).`;
  }
  return null;
}

class ErrorSubida extends Error {
  constructor(
    public readonly estado: number,
    public readonly cuerpo: string,
  ) {
    super(`Subida falló (${estado})`);
  }
}

/**
 * PUT directo al signed URL de Supabase Storage con progreso real.
 * Replica los headers del cuerpo-crudo de uploadToSignedUrl (storage-js):
 * el token ya viene en el query string del signedUrl.
 */
function subirConProgreso(
  signedUrl: string,
  archivo: File,
  onProgreso: (pct: number) => void,
): Promise<void> {
  return new Promise((resolver, rechazar) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", signedUrl);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.setRequestHeader("content-type", archivo.type || "application/octet-stream");
    xhr.setRequestHeader("cache-control", "max-age=3600");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgreso(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolver();
      else rechazar(new ErrorSubida(xhr.status, xhr.responseText));
    };
    xhr.onerror = () => rechazar(new ErrorSubida(0, ""));
    xhr.send(archivo);
  });
}

function mensajeDeError(e: unknown): string {
  if (e instanceof ErrorSubida) {
    if (e.estado === 413 || /payload too large|maximum allowed size|exceeded/i.test(e.cuerpo)) {
      return MSG_LIMITE_SERVIDOR;
    }
    if (e.estado === 0) {
      return "Se cortó la conexión durante la subida. Revisa tu internet e intenta de nuevo.";
    }
    return "No se pudo subir el archivo. Intenta de nuevo en un momento.";
  }
  return "Error de conexión. Intenta de nuevo.";
}

/* ------------------------------------------------------------------ */
/* Sección principal                                                   */
/* ------------------------------------------------------------------ */

export default function AdminRecursos({ recursos }: { recursos: Recurso[] }) {
  const [pestana, setPestana] = useState<"archivo" | "liga">("archivo");

  const tabBase =
    "min-h-[44px] rounded-xl px-5 text-sm font-bold transition";
  const tabOn = `${tabBase} bg-[#19e16d] text-black`;
  const tabOff = `${tabBase} bg-white/[0.06] text-white/70 hover:text-white`;

  return (
    <section className="mt-12">
      <p className="sec-tag mb-1">Material compartible</p>
      <h2 className="text-xl font-bold">Recursos ({recursos.length})</h2>
      <p className="mt-1 text-sm text-white/60">
        Videos, imágenes y archivos que los afiliados comparten.
      </p>

      <div className="mt-4 flex gap-2" role="tablist" aria-label="Cómo agregar el recurso">
        <button
          type="button"
          role="tab"
          aria-selected={pestana === "archivo"}
          className={pestana === "archivo" ? tabOn : tabOff}
          onClick={() => setPestana("archivo")}
        >
          Subir archivo
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={pestana === "liga"}
          className={pestana === "liga" ? tabOn : tabOff}
          onClick={() => setPestana("liga")}
        >
          Agregar liga
        </button>
      </div>

      {pestana === "archivo" ? <ZonaSubida /> : <FormLiga />}

      <ListaRecursos recursos={recursos} />
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Subida de archivos                                                  */
/* ------------------------------------------------------------------ */

type Fase = "reposo" | "preparando" | "subiendo" | "registrando";

function ZonaSubida() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fase, setFase] = useState<Fase>("reposo");
  const [progreso, setProgreso] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [arrastrando, setArrastrando] = useState(false);

  const ocupado = fase !== "reposo";

  function elegir(f: File) {
    const problema = validarArchivo(f);
    if (problema) {
      setMsg(problema);
      return;
    }
    setMsg(null);
    setExito(null);
    setArchivo(f);
    setTitulo(limpiarNombre(f.name));
  }

  function quitar() {
    if (ocupado) return;
    setArchivo(null);
    setTitulo("");
    setDescripcion("");
    setMsg(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function subir() {
    if (!archivo || ocupado) return;
    const t = titulo.trim();
    if (!t) {
      setMsg("Ponle un título al recurso para que los afiliados sepan qué es.");
      return;
    }
    setMsg(null);
    setExito(null);
    setProgreso(0);
    setFase("preparando");
    try {
      // 1. El servidor valida, asegura el bucket y firma la URL de subida.
      const r = await fetch("/api/admin/recursos/subir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: archivo.name, mime: archivo.type, bytes: archivo.size }),
      });
      const data = (await r.json()) as {
        ok?: boolean;
        error?: string;
        signedUrl?: string;
        urlPublica?: string;
        tipo?: string;
      };
      if (!r.ok || !data.ok || !data.signedUrl || !data.urlPublica) {
        setMsg(data.error ?? "No se pudo preparar la subida. Intenta de nuevo en un momento.");
        setFase("reposo");
        return;
      }

      // 2. El navegador sube DIRECTO al bucket (con barra de progreso real).
      setFase("subiendo");
      await subirConProgreso(data.signedUrl, archivo, setProgreso);

      // 3. Se registra el recurso en la tabla.
      setFase("registrando");
      const reg = await fetch("/api/admin/recursos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: t,
          descripcion: descripcion.trim(),
          url: data.urlPublica,
          tipo: data.tipo,
        }),
      });
      const regData = (await reg.json()) as { ok?: boolean; error?: string };
      if (!reg.ok || !regData.ok) {
        setMsg(regData.error ?? "El archivo subió, pero no se pudo registrar. Intenta de nuevo.");
        setFase("reposo");
        return;
      }

      setArchivo(null);
      setTitulo("");
      setDescripcion("");
      if (inputRef.current) inputRef.current.value = "";
      setExito("Listo — el recurso ya está disponible para los afiliados.");
      setFase("reposo");
      router.refresh();
    } catch (e: unknown) {
      setMsg(mensajeDeError(e));
      setFase("reposo");
    }
  }

  return (
    <div className="glass mt-4 p-6">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!ocupado) setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastrando(false);
          if (ocupado) return;
          const f = e.dataTransfer.files?.[0];
          if (f) elegir(f);
        }}
        className={`rounded-2xl border-2 border-dashed p-6 text-center transition ${
          arrastrando ? "border-[#19e16d] bg-[#19e16d]/5" : "border-white/15"
        }`}
      >
        <input
          ref={inputRef}
          id="af-recurso-archivo"
          type="file"
          accept={ACEPTA}
          className="sr-only"
          disabled={ocupado}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) elegir(f);
          }}
        />

        {!archivo ? (
          <>
            <label
              htmlFor="af-recurso-archivo"
              className="btn-cta btn-press inline-flex min-h-[48px] cursor-pointer items-center"
            >
              Subir archivo
            </label>
            <p className="mt-3 text-sm text-white/60">…o arrastra y suelta el archivo aquí.</p>
            <p className="mt-1 text-xs text-white/40">
              Imágenes, videos, PDF o ZIP · hasta {MAX_MB} MB
            </p>
          </>
        ) : (
          <div className="text-left">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">
                {archivo.name}{" "}
                <span className="font-normal text-white/50">· {formatoPeso(archivo.size)}</span>
              </p>
              {!ocupado ? (
                <button
                  type="button"
                  onClick={quitar}
                  className="btn-ghost min-h-[44px] !px-4 text-sm"
                >
                  Elegir otro
                </button>
              ) : null}
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="af-recurso-titulo">
                  Título
                </label>
                <input
                  id="af-recurso-titulo"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej. Flyer SEED agosto"
                  className="field"
                  disabled={ocupado}
                />
              </div>
              <div>
                <label className="label" htmlFor="af-recurso-descripcion">
                  Descripción · opcional
                </label>
                <input
                  id="af-recurso-descripcion"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Para qué sirve"
                  className="field"
                  disabled={ocupado}
                />
              </div>
            </div>

            {ocupado ? (
              <BarraProgreso fase={fase} progreso={progreso} />
            ) : (
              <button
                type="button"
                onClick={subir}
                className="btn-cta btn-press !mt-6 min-h-[48px]"
              >
                Subir ahora
              </button>
            )}
          </div>
        )}
      </div>

      {msg ? (
        <p className="mt-4 text-sm font-semibold text-[#ffb2b2]" role="alert">
          {msg}
        </p>
      ) : null}
      {exito ? (
        <p className="mt-4 text-sm font-semibold text-[#19e16d]" role="status">
          {exito}
        </p>
      ) : null}
    </div>
  );
}

function BarraProgreso({ fase, progreso }: { fase: Fase; progreso: number }) {
  const texto =
    fase === "preparando"
      ? "Preparando la subida…"
      : fase === "registrando"
        ? "Guardando el recurso…"
        : `Subiendo… ${progreso}% — no cierres la pestaña.`;
  const ancho = fase === "preparando" ? 4 : fase === "registrando" ? 100 : Math.max(4, progreso);

  return (
    <div className="mt-6">
      <div
        className="h-3 overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={fase === "subiendo" ? progreso : undefined}
        aria-label="Progreso de la subida"
      >
        <div
          className="h-full rounded-full bg-[#19e16d] transition-[width] duration-200"
          style={{ width: `${ancho}%` }}
        />
      </div>
      <p className="mt-2 text-sm text-white/70" aria-live="polite">
        {texto}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Agregar liga (flujo existente, ahora en su pestaña)                 */
/* ------------------------------------------------------------------ */

function FormLiga() {
  const router = useRouter();
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [url, setUrl] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function crear(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (cargando) return;
    setMsg(null);
    setExito(null);
    if (!titulo.trim()) {
      setMsg("Ponle un título a la liga.");
      return;
    }
    if (!/^https?:\/\//.test(url.trim())) {
      setMsg("La liga debe empezar con http:// o https://");
      return;
    }
    setCargando(true);
    try {
      const r = await fetch("/api/admin/recursos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: titulo.trim(),
          descripcion: descripcion.trim(),
          url: url.trim(),
          tipo: "link",
        }),
      });
      const data = (await r.json()) as { ok?: boolean; error?: string };
      if (!r.ok || !data.ok) {
        setMsg(data.error ?? "No se pudo guardar la liga.");
      } else {
        setTitulo("");
        setDescripcion("");
        setUrl("");
        setExito("Liga agregada — ya la ven los afiliados.");
        router.refresh();
      }
    } catch {
      setMsg("Error de conexión. Intenta de nuevo.");
    }
    setCargando(false);
  }

  return (
    <form onSubmit={crear} className="glass mt-4 space-y-4 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="af-liga-titulo">
            Título
          </label>
          <input
            id="af-liga-titulo"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej. Video en YouTube"
            className="field"
          />
        </div>
        <div>
          <label className="label" htmlFor="af-liga-descripcion">
            Descripción · opcional
          </label>
          <input
            id="af-liga-descripcion"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Para qué sirve"
            className="field"
          />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="af-liga-url">
          Liga (Drive, YouTube, etc.)
        </label>
        <input
          id="af-liga-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…"
          className="field"
        />
      </div>
      {msg ? (
        <p className="text-sm font-semibold text-[#ffb2b2]" role="alert">
          {msg}
        </p>
      ) : null}
      {exito ? (
        <p className="text-sm font-semibold text-[#19e16d]" role="status">
          {exito}
        </p>
      ) : null}
      <button disabled={cargando} className="btn-cta btn-press !mt-6 min-h-[48px]">
        {cargando ? "Guardando…" : "Agregar liga"}
      </button>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Lista de recursos                                                   */
/* ------------------------------------------------------------------ */

function ListaRecursos({ recursos }: { recursos: Recurso[] }) {
  if (recursos.length === 0) {
    return (
      <div className="glass mt-4 p-6 text-center">
        <p className="font-semibold">Aún no hay recursos.</p>
        <p className="mt-1 text-sm text-white/60">
          Sube el primer video, imagen o archivo para que los afiliados lo compartan.
        </p>
      </div>
    );
  }

  return (
    <ul className="mt-4 space-y-3">
      {recursos.map((r) => (
        <FilaRecurso key={r.id} recurso={r} />
      ))}
    </ul>
  );
}

function VistaPrevia({ recurso }: { recurso: Recurso }) {
  if (recurso.tipo === "imagen") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={recurso.url}
        alt={recurso.titulo}
        loading="lazy"
        className="h-16 w-16 shrink-0 rounded-xl object-cover"
      />
    );
  }
  if (recurso.tipo === "video") {
    return (
      <video
        src={recurso.url}
        controls
        preload="metadata"
        className="h-20 w-32 shrink-0 rounded-xl bg-black/40"
      />
    );
  }
  return (
    <div
      aria-hidden
      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-2xl"
    >
      {recurso.tipo === "link" ? "🔗" : "📄"}
    </div>
  );
}

const NOMBRE_TIPO: Record<string, string> = {
  imagen: "Imagen",
  video: "Video",
  archivo: "Archivo",
  link: "Liga",
};

function FilaRecurso({ recurso }: { recurso: Recurso }) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // La confirmación de borrado se desarma sola si el admin se arrepiente.
  useEffect(() => {
    if (!confirmando) return;
    const t = setTimeout(() => setConfirmando(false), 4000);
    return () => clearTimeout(t);
  }, [confirmando]);

  async function cambiarActivo() {
    if (cargando) return;
    setCargando(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/recursos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: recurso.id, activo: !recurso.activo }),
      });
      const data = (await r.json()) as { ok?: boolean; error?: string };
      if (!r.ok || !data.ok) setError(data.error ?? "No se pudo actualizar. Intenta de nuevo.");
      else router.refresh();
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    }
    setCargando(false);
  }

  async function borrar() {
    if (!confirmando) {
      setConfirmando(true);
      return;
    }
    if (cargando) return;
    setCargando(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/recursos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: recurso.id }),
      });
      const data = (await r.json()) as { ok?: boolean; error?: string };
      if (!r.ok || !data.ok) setError(data.error ?? "No se pudo borrar. Intenta de nuevo.");
      else router.refresh();
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    }
    setConfirmando(false);
    setCargando(false);
  }

  return (
    <li className={`glass p-4 ${recurso.activo ? "" : "opacity-60"}`}>
      <div className="flex flex-wrap items-center gap-4">
        <VistaPrevia recurso={recurso} />

        <div className="min-w-0 flex-1">
          <p className="font-semibold">{recurso.titulo}</p>
          {recurso.descripcion ? (
            <p className="mt-0.5 truncate text-sm text-white/60">{recurso.descripcion}</p>
          ) : null}
          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-white/[0.08] px-2.5 py-1 font-bold uppercase tracking-[0.1em] text-white/60">
              {NOMBRE_TIPO[recurso.tipo] ?? recurso.tipo}
            </span>
            {!recurso.activo ? (
              <span className="rounded-full bg-[#d9b45b]/15 px-2.5 py-1 font-bold text-[#d9b45b]">
                Oculto para afiliados
              </span>
            ) : null}
            <a
              href={recurso.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center text-[#19e16d] hover:underline"
            >
              Abrir ↗
            </a>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={cambiarActivo}
            disabled={cargando}
            aria-pressed={recurso.activo}
            title={recurso.activo ? "Ocultar a los afiliados" : "Mostrar a los afiliados"}
            className="flex min-h-[44px] items-center gap-2 rounded-xl bg-white/[0.06] px-3 text-xs font-bold text-white/70 transition hover:text-white disabled:opacity-50"
          >
            <span
              aria-hidden
              className={`relative h-5 w-9 rounded-full transition ${
                recurso.activo ? "bg-[#19e16d]" : "bg-white/20"
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
                  recurso.activo ? "left-[18px]" : "left-0.5"
                }`}
              />
            </span>
            {recurso.activo ? "Visible" : "Oculto"}
          </button>

          <button
            type="button"
            onClick={borrar}
            disabled={cargando}
            className={`min-h-[44px] rounded-xl px-4 text-xs font-bold transition disabled:opacity-50 ${
              confirmando
                ? "bg-[#ffb2b2] text-black"
                : "bg-[#ffb2b2]/15 text-[#ffb2b2] hover:bg-[#ffb2b2]/25"
            }`}
          >
            {confirmando ? "¿Seguro? Sí, borrar" : "Borrar"}
          </button>
        </div>
      </div>

      {error ? (
        <p className="mt-3 text-sm font-semibold text-[#ffb2b2]" role="alert">
          {error}
        </p>
      ) : null}
    </li>
  );
}
