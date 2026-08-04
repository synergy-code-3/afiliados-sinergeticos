import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseService } from "@/lib/supabase-server";
import { validarTelefono } from "@/lib/phone";

/**
 * Perfil del afiliado. En la junta (3-ago-2026) quedó que se edite el NOMBRE,
 * sin foto ("es muy tedioso"); se dejan también ciudad y WhatsApp porque hoy se
 * piden al registrarse y quedaban congelados para siempre.
 *
 * Solo toca la fila del usuario de la sesión: el id nunca viene del body.
 */
export async function PATCH(req: NextRequest) {
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
  if (!user) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });

  const body = (await req.json()) as { nombre?: string; ciudad?: string; telefono?: string };
  const nombre = body.nombre?.trim() ?? "";
  const ciudad = body.ciudad?.trim() ?? "";
  const telefono = body.telefono?.trim() ?? "";

  if (nombre.length < 2) {
    return NextResponse.json({ error: "Escribe tu nombre completo." }, { status: 400 });
  }
  // el teléfono es opcional, pero si lo pone tiene que ser válido
  if (telefono) {
    const telErr = validarTelefono(telefono);
    if (telErr) return NextResponse.json({ error: telErr }, { status: 400 });
  }

  const { error } = await supabaseService()
    .from("af_afiliados")
    .update({ nombre, ciudad: ciudad || null, telefono: telefono || null })
    .eq("id", user.id);
  if (error) {
    return NextResponse.json({ error: "No se pudo guardar tu perfil." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
