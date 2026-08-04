import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseService } from "@/lib/supabase-server";

/** Sube el avatar del afiliado al bucket público `af-fotos` (migración 0082).
 * El archivo se llama <user.id>.<ext> con upsert: una foto por cuenta, y nadie
 * puede pisar la de otro porque la ruta sale de la sesión, jamás del body. */

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB

/** Allowlist cerrado — lo que una selfie real puede ser. Nada de SVG (es
 * ejecutable en un bucket público) ni de caer en silencio a "jpg". */
const EXT_POR_TIPO: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

/** El tipo declarado en el multipart lo escribe el cliente: se comprueba
 * contra los BYTES reales antes de confiar en él. */
function bytesCoinciden(tipo: string, b: Uint8Array): boolean {
  if (b.length < 12) return false;
  switch (tipo) {
    case "image/jpeg":
      return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
    case "image/png":
      return b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
    case "image/webp":
      return (
        b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
        b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
      );
    case "image/heic":
    case "image/heif":
      // contenedor ISO-BMFF: "ftyp" en el offset 4
      return b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70;
    default:
      return false;
  }
}

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
  const ext = EXT_POR_TIPO[foto.type];
  if (!ext) {
    return NextResponse.json(
      { ok: false, error: "Usa una foto JPG, PNG, WebP o HEIC." },
      { status: 400 },
    );
  }
  if (foto.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: "La foto pesa más de 4 MB — elige una más ligera." }, { status: 400 });
  }
  const contenido = await foto.arrayBuffer();
  if (!bytesCoinciden(foto.type, new Uint8Array(contenido.slice(0, 16)))) {
    return NextResponse.json(
      { ok: false, error: "Ese archivo no parece una foto válida." },
      { status: 400 },
    );
  }

  const ruta = `${user.id}.${ext}`;
  const storage = supabaseService().storage.from("af-fotos");
  const { error } = await storage.upload(ruta, contenido, {
    contentType: foto.type === "image/heif" ? "image/heic" : foto.type,
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
