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
    <main className="mx-auto max-w-md">
      <h1 className="text-2xl font-extrabold">Crear cuenta de afiliado</h1>
      <form onSubmit={crear} className="mt-6 space-y-3">
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre completo" className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-base outline-none focus:border-[#19e16d]" />
        <input value={ciudad} onChange={(e) => setCiudad(e.target.value)} placeholder="Tu ciudad (opcional)" className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-base outline-none focus:border-[#19e16d]" />
        <input value={telefono} onChange={(e) => setTelefono(e.target.value)} inputMode="tel" placeholder="Tu WhatsApp (opcional)" className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-base outline-none focus:border-[#19e16d]" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Tu correo" autoComplete="email" className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-base outline-none focus:border-[#19e16d]" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Contraseña (mínimo 8)" autoComplete="new-password" className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-base outline-none focus:border-[#19e16d]" />
        {msg ? <p className="text-sm font-semibold text-[#ffb2b2]">{msg}</p> : null}
        <button disabled={loading} className="w-full rounded-xl bg-[#19e16d] px-5 py-3 font-bold text-black transition hover:brightness-110 disabled:opacity-50">
          {loading ? "Creando…" : "Crear cuenta"}
        </button>
      </form>
      <p className="mt-4 text-sm text-white/60">
        ¿Ya tienes cuenta?{" "}
        <Link href="/entrar" className="text-[#19e16d] hover:underline">Entra aquí</Link>
      </p>
    </main>
  );
}
