import { NextResponse, type NextRequest } from "next/server";
import { supabaseService } from "@/lib/supabase-server";
import { esAdmin } from "@/lib/admin-auth";

/**
 * Prepara la subida DIRECTA de un archivo a Supabase Storage.
 *
 * El archivo jamás pasa por esta API (Vercel corta los bodies en ~4.5 MB y los
 * videos pesan mucho más): aquí solo se valida la petición, se asegura el
 * bucket y se firma una URL de subida. El navegador sube directo al bucket con
 * esa URL y al terminar registra el recurso con `POST /api/admin/recursos`.
 *
 * Contrato:
 *   POST { nombre, mime, bytes }
 *   → 200 { ok, token, path, signedUrl, urlPublica, tipo }
 *   → 4xx/5xx { error } (mensaje humano, listo para pintar en pantalla)
 *
 * El nombre del objeto SIEMPRE es un uuid generado aquí — jamás el nombre del
 * archivo del usuario (evita path traversal y colisiones).
 */

const BUCKET = "af-recursos";
const MAX_MB = 200;
const MAX_BYTES = MAX_MB * 1024 * 1024;

/** Allowlist: mime permitido → extensión del objeto y tipo de recurso. */
const MIMES: Record<string, { ext: string; tipo: "imagen" | "video" | "archivo" }> = {
  "image/jpeg": { ext: "jpg", tipo: "imagen" },
  "image/png": { ext: "png", tipo: "imagen" },
  "image/webp": { ext: "webp", tipo: "imagen" },
  "image/gif": { ext: "gif", tipo: "imagen" },
  "video/mp4": { ext: "mp4", tipo: "video" },
  "video/quicktime": { ext: "mov", tipo: "video" },
  "video/webm": { ext: "webm", tipo: "video" },
  "application/pdf": { ext: "pdf", tipo: "archivo" },
  "application/zip": { ext: "zip", tipo: "archivo" },
  // algunos navegadores en Windows reportan los ZIP así
  "application/x-zip-compressed": { ext: "zip", tipo: "archivo" },
};

const MSG_TIPO =
  "Ese tipo de archivo no se puede subir. Acepto imágenes (JPG, PNG, WebP o GIF), videos (MP4, MOV o WebM), PDF y ZIP.";
const MSG_PESO = `El archivo pesa más de ${MAX_MB} MB. Compártelo mejor como liga (Drive/YouTube).`;
const MSG_PREPARAR = "No se pudo preparar la subida. Intenta de nuevo en un momento.";

interface Peticion {
  nombre?: unknown;
  mime?: unknown;
  bytes?: unknown;
}

export async function POST(req: NextRequest) {
  if (!(await esAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let cuerpo: Peticion;
  try {
    cuerpo = (await req.json()) as Peticion;
  } catch {
    return NextResponse.json({ error: "Petición inválida." }, { status: 400 });
  }

  const mime = typeof cuerpo.mime === "string" ? cuerpo.mime.toLowerCase().trim() : "";
  const bytes = typeof cuerpo.bytes === "number" ? cuerpo.bytes : NaN;

  const info = MIMES[mime];
  if (!info) return NextResponse.json({ error: MSG_TIPO }, { status: 400 });
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return NextResponse.json(
      { error: "No pude leer el tamaño del archivo. Intenta elegirlo de nuevo." },
      { status: 400 },
    );
  }
  if (bytes > MAX_BYTES) return NextResponse.json({ error: MSG_PESO }, { status: 400 });

  const service = supabaseService();

  // Ensure: el bucket puede no existir y no hay migración posible, pero el
  // service_role sí puede crearlo por API. Si ya existe, ese error se ignora.
  const { error: errorBucket } = await service.storage.createBucket(BUCKET, { public: true });
  if (errorBucket && !/already exists|duplicate/i.test(errorBucket.message)) {
    return NextResponse.json({ error: MSG_PREPARAR }, { status: 500 });
  }

  // El nombre del objeto lo pone el servidor: uuid + extensión según el mime.
  const objeto = `${crypto.randomUUID()}.${info.ext}`;
  const { data, error } = await service.storage.from(BUCKET).createSignedUploadUrl(objeto);
  if (error || !data) return NextResponse.json({ error: MSG_PREPARAR }, { status: 500 });

  const urlPublica = service.storage.from(BUCKET).getPublicUrl(data.path).data.publicUrl;
  return NextResponse.json({
    ok: true,
    token: data.token,
    path: data.path,
    signedUrl: data.signedUrl,
    urlPublica,
    tipo: info.tipo,
  });
}
