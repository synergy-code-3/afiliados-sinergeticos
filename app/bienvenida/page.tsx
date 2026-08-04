"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase";
import "./bienvenida.css";

/** Onboarding de primera vez de Synergy +1: apodo → foto → celebración.
 * Si el afiliado ya lo hizo (onboarding_at con fecha), o la migración 0082
 * aún no está en la base, se va derecho a /panel sin ruido. */

type Paso = 1 | 2 | 3;

const MAX_FOTO_BYTES = 4 * 1024 * 1024; // 4 MB

interface RespPerfil {
  ok?: boolean;
  plus?: boolean;
  perfil?: {
    nombre: string;
    apodo: string | null;
    foto_url: string | null;
    onboarding_at: string | null;
  } | null;
}

/** Piezas de confetti con posición/ritmo fijos — nada aleatorio en render. */
const COLORES_FIESTA = ["#19e16d", "#d9b45b", "#ffffff"] as const;
const CONFETI = Array.from({ length: 18 }, (_, i) => ({
  left: (i * 53 + 7) % 100,
  delay: (i % 6) * 0.18,
  dur: 2.2 + (i % 5) * 0.3,
  color: COLORES_FIESTA[i % COLORES_FIESTA.length],
  giro: 180 + ((i * 97) % 540),
}));

/** Partículas que salen disparadas del check al celebrar un paso. */
const PARTICULAS = Array.from({ length: 10 }, (_, i) => {
  const angulo = (i / 10) * Math.PI * 2;
  return {
    tx: Math.round(Math.cos(angulo) * 74),
    ty: Math.round(Math.sin(angulo) * 74),
    color: COLORES_FIESTA[i % 2],
  };
});

function prefiereQuieto(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function Bienvenida() {
  const router = useRouter();
  const [cargando, setCargando] = useState(true);
  const [paso, setPaso] = useState<Paso>(1);
  const [celebrando, setCelebrando] = useState(false);
  const [apodo, setApodo] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const galeriaRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);

  // sesión + perfil, client-side (mismo espíritu que el panel): sin sesión a
  // /entrar; con onboarding hecho, sin perfil o sin migración, a /panel
  useEffect(() => {
    let vivo = true;
    (async () => {
      const supabase = supabaseBrowser();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!vivo) return;
      if (!user) {
        router.replace("/entrar");
        return;
      }
      try {
        const r = await fetch("/api/perfil");
        const d = (await r.json()) as RespPerfil;
        if (!vivo) return;
        if (!d.ok || !d.plus || !d.perfil || d.perfil.onboarding_at) {
          router.replace("/panel");
          return;
        }
        setApodo(d.perfil.apodo ?? d.perfil.nombre.trim().split(/\s+/)[0] ?? "");
        if (d.perfil.foto_url) {
          setFotoUrl(d.perfil.foto_url);
          setPreview(d.perfil.foto_url);
        }
        setCargando(false);
      } catch {
        if (vivo) router.replace("/panel");
      }
    })();
    return () => {
      vivo = false;
    };
  }, [router]);

  /** Avanza de paso con celebración (check + partículas). Con movimiento
   * reducido no hay pausa ni overlay: el paso cambia al instante. */
  function avanzar(siguiente: Paso) {
    setMsg(null);
    if (prefiereQuieto()) {
      setPaso(siguiente);
      return;
    }
    setCelebrando(true);
    window.setTimeout(() => {
      setCelebrando(false);
      setPaso(siguiente);
    }, 1000);
  }

  function confirmarApodo(e: React.FormEvent) {
    e.preventDefault();
    if (celebrando) return;
    const limpio = apodo.trim();
    if (!limpio) return setMsg("Dinos cómo te gustaría que te llamemos.");
    if (limpio.length > 40) return setMsg("Ese apodo es muy largo — máximo 40 letras.");
    setApodo(limpio);
    avanzar(2);
  }

  function alElegirFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = ""; // permite volver a elegir el mismo archivo
    if (!f) return;
    setMsg(null);
    if (!f.type.startsWith("image/")) return setMsg("Ese archivo no es una imagen.");
    if (f.size > MAX_FOTO_BYTES) return setMsg("La foto pesa más de 4 MB — elige una más ligera.");
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    setArchivo(f);
    setPreview(URL.createObjectURL(f));
  }

  /** Sube la foto (si la hay), guarda apodo + onboarding y pasa al cierre. */
  async function terminar(conFoto: boolean) {
    if (ocupado || celebrando) return;
    setMsg(null);
    setOcupado(true);
    try {
      let urlFoto = fotoUrl;
      if (conFoto && archivo) {
        const form = new FormData();
        form.append("foto", archivo);
        const r = await fetch("/api/foto", { method: "POST", body: form });
        const d = (await r.json()) as { ok?: boolean; url?: string; error?: string };
        if (!d.ok || !d.url) {
          setOcupado(false);
          setMsg(
            d.error === "pendiente"
              ? "Todavía no podemos guardar fotos aquí — sigue con «Luego la subo» y ponla después desde tu panel."
              : (d.error ?? "No se pudo subir tu foto. Intenta de nuevo."),
          );
          return;
        }
        urlFoto = d.url;
        setFotoUrl(d.url);
      }
      const r = await fetch("/api/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apodo,
          onboarding: true,
          ...(urlFoto ? { foto_url: urlFoto } : {}),
        }),
      });
      const d = (await r.json()) as { ok?: boolean; error?: string };
      if (!r.ok || !d.ok) {
        setOcupado(false);
        setMsg(d.error ?? "No se pudo guardar. Intenta de nuevo.");
        return;
      }
      setOcupado(false);
      avanzar(3);
    } catch {
      setOcupado(false);
      setMsg("Error de conexión. Intenta de nuevo.");
    }
  }

  if (cargando) {
    return (
      <main className="relative">
        <div className="aurora">
          <span className="b1" />
        </div>
        <div className="wrap relative flex justify-center pb-24 pt-16">
          <p className="sec-tag a1 mt-16">
            <span className="pulse inline-block h-1.5 w-1.5 rounded-full bg-[#19e16d]" />
            Preparando tu bienvenida…
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative">
      <div className="aurora">
        <span className="b1" />
        <span className="b2" />
      </div>
      <div className="wrap relative flex justify-center pb-24 pt-16">
        <div className="glass bienvenida-card a1 w-full max-w-md p-8">
          <p className="sec-tag mb-3">Synergy +1 · Paso {paso} de 3</p>
          <div
            className="prog-neu mb-8"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={3}
            aria-valuenow={paso}
            aria-label={`Paso ${paso} de 3`}
          >
            <div className="prog-avance" style={{ width: `${(paso / 3) * 100}%` }}>
              <span key={paso} className="prog-perla" />
            </div>
          </div>

          {paso === 1 ? (
            <form onSubmit={confirmarApodo}>
              <h1 className="text-2xl font-extrabold">¿Cómo te gustaría que te llamemos?</h1>
              <p className="mt-2 text-white/55">Así te vamos a saludar cada vez que entres.</p>
              <div className="mt-6">
                <label className="label" htmlFor="apodo">Tu apodo</label>
                <input
                  id="apodo"
                  value={apodo}
                  onChange={(e) => setApodo(e.target.value)}
                  maxLength={40}
                  placeholder="Como te dicen tus amigos"
                  className="field"
                />
              </div>
              {msg ? <p className="mt-3 text-sm font-semibold text-[#ffb2b2]">{msg}</p> : null}
              <button disabled={celebrando} className="btn-cta btn-press mt-6 w-full">
                Continuar →
              </button>
            </form>
          ) : null}

          {paso === 2 ? (
            <div>
              <h1 className="text-2xl font-extrabold">Ponle cara a tu perfil</h1>
              <p className="mt-2 text-white/55">
                Tu foto sale en tu panel y ayuda al equipo a reconocerte en los eventos.
              </p>
              <div className="mt-6 flex justify-center">
                <div className="foto-neu">
                  {preview ? (
                    // blob local o URL pública — next/image no aplica aquí
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview} alt="Tu foto de perfil" />
                  ) : (
                    <span className="foto-inicial" aria-hidden="true">
                      {apodo.charAt(0).toUpperCase() || "+1"}
                    </span>
                  )}
                </div>
              </div>
              <input
                ref={galeriaRef}
                type="file"
                accept="image/*"
                onChange={alElegirFoto}
                className="sr-only"
                aria-label="Elegir una foto de tu galería"
              />
              <input
                ref={selfieRef}
                type="file"
                accept="image/*"
                capture="user"
                onChange={alElegirFoto}
                className="sr-only"
                aria-label="Tomarte una selfie con la cámara"
              />
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => galeriaRef.current?.click()}
                  className="btn-ghost btn-press w-full"
                >
                  📷 {archivo ? "Cambiar la foto" : "Elegir una foto"}
                </button>
                <button
                  type="button"
                  onClick={() => selfieRef.current?.click()}
                  className="btn-ghost btn-press w-full"
                >
                  🤳 Tomarme una selfie
                </button>
              </div>
              {msg ? <p className="mt-4 text-sm font-semibold text-[#ffb2b2]">{msg}</p> : null}
              {archivo ? (
                <button
                  type="button"
                  onClick={() => terminar(true)}
                  disabled={ocupado || celebrando}
                  className="btn-cta btn-press mt-4 w-full"
                >
                  {ocupado ? "Guardando…" : "Continuar con esta foto →"}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => terminar(false)}
                disabled={ocupado || celebrando}
                className="btn-ghost btn-press mt-3 w-full"
              >
                {ocupado && !archivo ? "Guardando…" : "Luego la subo"}
              </button>
            </div>
          ) : null}

          {paso === 3 ? (
            <div className="relative text-center">
              <div className="confeti" aria-hidden="true">
                {CONFETI.map((c, i) => (
                  <span
                    key={i}
                    style={
                      {
                        left: `${c.left}%`,
                        background: c.color,
                        animationDelay: `${c.delay}s`,
                        animationDuration: `${c.dur}s`,
                        "--giro": `${c.giro}deg`,
                      } as React.CSSProperties
                    }
                  />
                ))}
              </div>
              <div className="mx-auto mt-2 flex justify-center">
                <div className="foto-neu">
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview} alt="Tu foto de perfil" />
                  ) : (
                    <span className="foto-inicial" aria-hidden="true">
                      {apodo.charAt(0).toUpperCase() || "+1"}
                    </span>
                  )}
                </div>
              </div>
              <h1 className="mt-6 text-2xl font-extrabold">¡Listo, {apodo}! 🎉</h1>
              <p className="mt-3 leading-relaxed text-white/70">
                Ya eres parte de <span className="font-bold text-[#19e16d]">Synergy +1</span>.
                Aquí creemos que 1+1=3: tú puedes ser el +1 de alguien más — y ganar con ello.
              </p>
              <button
                type="button"
                onClick={() => router.push("/panel")}
                className="btn-cta btn-press mt-8 w-full"
              >
                Ir a mi panel →
              </button>
            </div>
          ) : null}

          {celebrando ? (
            <div className="celebra" role="status" aria-label="¡Muy bien! Siguiente paso">
              <div className="celebra-check">
                <svg
                  width="44"
                  height="44"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
              {PARTICULAS.map((p, i) => (
                <span
                  key={i}
                  className="celebra-particula"
                  style={
                    {
                      background: p.color,
                      animationDelay: `${i * 0.02}s`,
                      "--tx": `${p.tx}px`,
                      "--ty": `${p.ty}px`,
                    } as React.CSSProperties
                  }
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
