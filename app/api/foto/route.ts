import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseService } from "@/lib/supabase-server";

/** Sube el avatar del afiliado al bucket público `af-fotos` (migración 0082).
 * El archivo se llama <user.id>.<ext> con upsert: una foto por cuenta, y nadie
 * puede pisar la de otro porque la ruta sale de la sesión, jamás del body. */

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB

const EXT_POR_TIPO: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/heic": "heic",
  "image/heif": "heif",
};

export async function POST(req: NextRequest) {
  // sesión del afiliado (cookies) — mismo patrón que /api/inscribir
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

  const form = await req.formData().catch(() => null);
  const foto = form?.get("foto");
  if (!(foto instanceof File)) {
    return NextResponse.json({ ok: false, error: "No llegó la foto — intenta de nuevo." }, { status: 400 });
  }
  if (!foto.type.startsWith("image/")) {
    return NextResponse.json({ ok: false, error: "Ese archivo no es una imagen." }, { status: 400 });
  }
  if (foto.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: "La foto pesa más de 4 MB — elige una más ligera." }, { status: 400 });
  }

  const ruta = `${user.id}.${EXT_POR_TIPO[foto.type] ?? "jpg"}`;
  const storage = supabaseService().storage.from("af-fotos");
  const { error } = await storage.upload(ruta, await foto.arrayBuffer(), {
    contentType: foto.type,
    upsert: true,
  });
  if (error) {
    // bucket aún sin crear (migración 0082 pendiente): se avisa sin tronar
    if (/bucket/i.test(error.message)) {
      return NextResponse.json({ ok: false, error: "pendiente" });
    }
    return NextResponse.json({ ok: false, error: "No se pudo subir tu foto. Intenta de nuevo." }, { status: 500 });
  }

  // el ?v= le gana al caché del CDN cuando se reemplaza la foto (misma ruta)
  const { data } = storage.getPublicUrl(ruta);
  return NextResponse.json({ ok: true, url: `${data.publicUrl}?v=${Date.now()}` });
}
