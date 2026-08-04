"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase";

/** Quien invitó (viene de /api/ref cuando la liga trae ?ref=CÓDIGO).
 * Solo el nombre para el banner: la vinculación real la hace la RPC
 * af_vincular_referido con el CÓDIGO — el navegador nunca maneja ids. */
interface Referente {
  codigo: string;
  nombre: string;
}

function FormularioCrearCuenta() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCodigo = (searchParams.get("ref") ?? "").trim().toUpperCase();
  const [referente, setReferente] = useState<Referente | null>(null);
  const [nombre, setNombre] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!/^[A-Z0-9]{6}$/.test(refCodigo)) return;
    let vivo = true;
    fetch(`/api/ref?codigo=${refCodigo}`)
      .then((r) => r.json())
      .then((d: { ok?: boolean; nombre?: string }) => {
        if (vivo && d.ok && d.nombre) {
          setReferente({ codigo: refCodigo, nombre: d.nombre });
          // patrón del embudo BGI: la atribución sobrevive aunque el alta se
          // complete después (confirmación de correo) — el panel la consume
          try {
            localStorage.setItem("synergy_ref", refCodigo);
          } catch {
            // storage lleno o bloqueado: el banner sigue funcionando igual
          }
        }
      })
      .catch(() => {
        // si la consulta falla, simplemente no se muestra el banner
      });
    return () => {
      vivo = false;
    };
  }, [refCodigo]);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setMsg(null);
    if (!nombre.trim()) return setMsg("Escribe tu nombre.");
    if (password.length < 8) return setMsg("La contraseña debe tener al menos 8 caracteres.");
    setLoading(true);
    const supabase = supabaseBrowser();
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) {
      setLoading(false);
      return setMsg(
        error.message.includes("already registered")
          ? "Oops — ese correo ya tiene cuenta 🙈, entra por 'Ya tengo cuenta'."
          : `No se pudo crear la cuenta: ${error.message}`,
      );
    }
    if (data.session && data.user) {
      // perfil del afiliado (RLS: solo su propia fila)
      const perfil = {
        id: data.user.id,
        nombre: nombre.trim(),
        ciudad: ciudad.trim() || null,
        telefono: telefono.trim() || null,
      };
      await supabase.from("af_afiliados").insert(perfil);
      if (referente) {
        // la vinculación la decide el SERVIDOR: la RPC resuelve el código,
        // valida que no sea auto-referencia y escribe una sola vez. Si la
        // migración 0082 no está aplicada, falla silencioso — el alta jamás
        // se bloquea por esto.
        // los errores de PostgREST llegan en el valor resuelto, jamás lanzan
        await supabase.rpc("af_vincular_referido", { p_codigo: referente.codigo });
      }
      try {
        localStorage.removeItem("synergy_ref");
      } catch {
        // sin consecuencia: la llave caduca sola al usarse en el panel
      }
      router.push("/panel");
      return;
    }
    setLoading(false);
    setMsg("Revisa tu correo para confirmar la cuenta y luego entra.");
  }

  return (
    <main className="relative">
      <div className="aurora">
        <span className="b1" />
      </div>
      <div className="wrap relative flex justify-center pb-24 pt-16">
        <div className="glass a1 w-full max-w-md p-8">
          <p className="sec-tag mb-4">Paso 1 de 1</p>
          <h1 className="text-2xl font-extrabold">Crea tu cuenta de afiliado</h1>
          {referente ? (
            <div className="mt-4 rounded-xl border border-[#19e16d]/35 bg-[#19e16d]/10 p-4 text-sm leading-relaxed text-white/85">
              🤝 Te invitó <span className="font-bold text-[#19e16d]">{referente.nombre}</span> — al
              crear tu cuenta quedarán conectados.
            </div>
          ) : null}
          <form onSubmit={crear} className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="cc-nombre">Tu nombre</label>
              <input id="cc-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre completo" className="field" />
            </div>
            <div>
              <label className="label" htmlFor="cc-ciudad">Tu ciudad · opcional</label>
              <input id="cc-ciudad" value={ciudad} onChange={(e) => setCiudad(e.target.value)} placeholder="¿De dónde eres?" className="field" />
            </div>
            <div>
              <label className="label" htmlFor="cc-whatsapp">Tu WhatsApp · opcional</label>
              <input id="cc-whatsapp" value={telefono} onChange={(e) => setTelefono(e.target.value)} inputMode="tel" placeholder="10 dígitos" className="field" />
            </div>
            <div>
              <label className="label" htmlFor="cc-correo">Correo</label>
              <input id="cc-correo" value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="tucorreo@ejemplo.com" autoComplete="email" className="field" />
            </div>
            <div>
              <label className="label" htmlFor="cc-password">Contraseña</label>
              <input id="cc-password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Mínimo 8 caracteres" autoComplete="new-password" className="field" />
            </div>
            {msg ? <p className="text-sm font-semibold text-[#ffb2b2]">{msg}</p> : null}
            <button disabled={loading} className="btn-cta btn-press !mt-6 w-full">
              {loading ? "Creando…" : "Crear cuenta →"}
            </button>
          </form>
          <p className="mt-5 text-sm text-white/50">
            ¿Ya tienes cuenta?{" "}
            <Link href="/entrar" className="font-semibold text-[#19e16d] hover:underline">Entra aquí</Link>
          </p>
        </div>
      </div>
    </main>
  );
}

/** useSearchParams exige Suspense en el App Router — el shell es idéntico
 * al de la página, así no hay brinco visual mientras hidrata. */
export default function CrearCuenta() {
  return (
    <Suspense
      fallback={
        <main className="relative">
          <div className="aurora">
            <span className="b1" />
          </div>
        </main>
      }
    >
      <FormularioCrearCuenta />
    </Suspense>
  );
}
