import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseService } from "@/lib/supabase-server";
import { validarTelefono } from "@/lib/phone";
import { synergyPlusListo } from "@/lib/schema";

/**
 * Perfil del afiliado. En la junta (3-ago-2026) quedó que se edite el NOMBRE;
 * se dejan también ciudad y WhatsApp porque hoy se piden al registrarse y
 * quedaban congelados para siempre. Con Synergy +1 (migración 0082) se suman
 * apodo, foto y la marca de onboarding — si la migración aún no está aplicada,
 * esos campos se ignoran con gracia y el resto del perfil sí se guarda.
 *
 * Solo toca la fila del usuario de la sesión: el id nunca viene del body.
 */

interface PerfilFila {
  nombre: string;
  ciudad: string | null;
  telefono: string | null;
  apodo?: string | null;
  foto_url?: string | null;
  onboarding_at?: string | null;
}

interface BodyPatch {
  nombre?: string;
  ciudad?: string;
  telefono?: string;
  apodo?: string;
  foto_url?: string;
  onboarding?: boolean;
}

async function usuarioDeSesion(req: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll() {},
      },
    },
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** ¿La foto apunta al bucket público de avatares de NUESTRO Supabase? */
function fotoUrlValida(url: string): boolean {
  try {
    const supa = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL as string);
    const u = new URL(url);
    return u.host === supa.host && u.pathname.startsWith("/storage/v1/object/public/af-fotos/");
  } catch {
    return false;
  }
}

/** Campos de siempre (nombre, ciudad, WhatsApp) — solo los que vengan en el body. */
function cambiosBase(body: BodyPatch): { cambios: Record<string, string | null>; error?: string } {
  const cambios: Record<string, string | null> = {};
  if (body.nombre !== undefined) {
    const nombre = body.nombre.trim();
    if (nombre.length < 2) return { cambios, error: "Escribe tu nombre completo." };
    cambios.nombre = nombre;
  }
  if (body.ciudad !== undefined) cambios.ciudad = body.ciudad.trim() || null;
  if (body.telefono !== undefined) {
    const telefono = body.telefono.trim();
    // el teléfono es opcional, pero si lo pone tiene que ser válido
    if (telefono) {
      const telErr = validarTelefono(telefono);
      if (telErr) return { cambios, error: telErr };
    }
    cambios.telefono = telefono || null;
  }
  return { cambios };
}

/** Lo que /bienvenida necesita para decidir si el onboarding ya se hizo. */
export async function GET(req: NextRequest) {
  const user = await usuarioDeSesion(req);
  if (!user) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });

  const plus = await synergyPlusListo();
  const columnas = plus
    ? "nombre, ciudad, telefono, apodo, foto_url, onboarding_at"
    : "nombre, ciudad, telefono";
  const { data, error } = await supabaseService()
    .from("af_afiliados")
    .select(columnas)
    .eq("id", user.id)
    .maybeSingle<PerfilFila>();
  if (error) {
    return NextResponse.json({ error: "No se pudo cargar tu perfil." }, { status: 500 });
  }
  if (!data) return NextResponse.json({ ok: true, plus, perfil: null });

  return NextResponse.json({
    ok: true,
    plus,
    perfil: {
      nombre: data.nombre,
      ciudad: data.ciudad ?? null,
      telefono: data.telefono ?? null,
      apodo: data.apodo ?? null,
      foto_url: data.foto_url ?? null,
      onboarding_at: data.onboarding_at ?? null,
    },
  });
}

export async function PATCH(req: NextRequest) {
  const user = await usuarioDeSesion(req);
  if (!user) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });

  const body = (await req.json()) as BodyPatch;
  const base = cambiosBase(body);
  if (base.error) return NextResponse.json({ error: base.error }, { status: 400 });
  const cambios = { ...base.cambios };

  // Campos Synergy +1 — solo si la migración 0082 ya está en la base.
  const pideSynergy =
    body.apodo !== undefined || body.foto_url !== undefined || body.onboarding === true;
  if (pideSynergy && (await synergyPlusListo())) {
    if (body.apodo !== undefined) {
      const apodo = body.apodo.trim();
      if (!apodo) {
        return NextResponse.json({ error: "Dinos cómo te gustaría que te llamemos." }, { status: 400 });
      }
      if (apodo.length > 40) {
        return NextResponse.json({ error: "Ese apodo es muy largo — máximo 40 letras." }, { status: 400 });
      }
      cambios.apodo = apodo;
    }
    if (body.foto_url !== undefined) {
      if (!fotoUrlValida(body.foto_url)) {
        return NextResponse.json({ error: "Esa foto no salió de tu perfil — súbela de nuevo." }, { status: 400 });
      }
      cambios.foto_url = body.foto_url;
    }
    if (body.onboarding === true) {
      // solo se marca una vez: si ya tiene fecha, se respeta la original
      const { data: fila } = await supabaseService()
        .from("af_afiliados")
        .select("onboarding_at")
        .eq("id", user.id)
        .maybeSingle<{ onboarding_at: string | null }>();
      if (fila && fila.onboarding_at === null) cambios.onboarding_at = new Date().toISOString();
    }
  }

  if (Object.keys(cambios).length === 0) return NextResponse.json({ ok: true });

  const { error } = await supabaseService().from("af_afiliados").update(cambios).eq("id", user.id);
  if (error) {
    return NextResponse.json({ error: "No se pudo guardar tu perfil." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
