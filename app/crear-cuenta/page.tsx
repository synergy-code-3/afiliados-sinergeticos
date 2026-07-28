"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase";

export default function CrearCuenta() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
          ? "Ese correo ya tiene cuenta — usa 'Ya tengo cuenta'."
          : `No se pudo crear la cuenta: ${error.message}`,
      );
    }
    if (data.session && data.user) {
      // perfil del afiliado (RLS: solo su propia fila)
      await supabase.from("af_afiliados").insert({
        id: data.user.id,
        nombre: nombre.trim(),
        ciudad: ciudad.trim() || null,
        telefono: telefono.trim() || null,
      });
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
          <form onSubmit={crear} className="mt-6 space-y-4">
            <div>
              <label className="label">Tu nombre</label>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre completo" className="field" />
            </div>
            <div>
              <label className="label">Tu ciudad · opcional</label>
              <input value={ciudad} onChange={(e) => setCiudad(e.target.value)} placeholder="¿De dónde eres?" className="field" />
            </div>
            <div>
              <label className="label">Tu WhatsApp · opcional</label>
              <input value={telefono} onChange={(e) => setTelefono(e.target.value)} inputMode="tel" placeholder="10 dígitos" className="field" />
            </div>
            <div>
              <label className="label">Correo</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="tucorreo@ejemplo.com" autoComplete="email" className="field" />
            </div>
            <div>
              <label className="label">Contraseña</label>
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Mínimo 8 caracteres" autoComplete="new-password" className="field" />
            </div>
            {msg ? <p className="text-sm font-semibold text-[#ffb2b2]">{msg}</p> : null}
            <button disabled={loading} className="btn-cta btn-press w-full">
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
