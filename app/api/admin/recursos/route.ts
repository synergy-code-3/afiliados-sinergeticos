import { NextResponse, type NextRequest } from "next/server";
import { supabaseService } from "@/lib/supabase-server";
import { esAdmin } from "@/lib/admin-auth";

/**
 * Recursos que el admin comparte con los afiliados (tabla `af_recursos`).
 *
 * POST   — registra un recurso. Dos formas:
 *          · JSON { titulo, descripcion?, url, tipo } — flujo nuevo: el archivo
 *            ya subió DIRECTO al bucket `af-recursos` con la URL firmada de
 *            /api/admin/recursos/subir y aquí solo se registra la fila.
 *          · FormData (titulo, descripcion, archivo|link) — flujo viejo; se
 *            conserva porque el body pasa por Vercel (corte en ~4.5 MB), útil
 *            solo para ligas y archivos chicos.
 * PATCH  — { id, activo } muestra u oculta un recurso a los afiliados.
 * DELETE — { id } borra la fila y, si el archivo vive en nuestros buckets,
 *          también el objeto del storage.
 */

const BUCKET_LEGADO = "afiliados-recursos";
const BUCKET_SUBIDAS = "af-recursos";
const MAX_MB = 50;

const TIPOS = ["imagen", "video", "archivo", "link"] as const;
type Tipo = (typeof TIPOS)[number];

function tipoDesdeArchivo(nombre: string): string {
  const ext = nombre.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) return "imagen";
  if (["mp4", "mov", "webm"].includes(ext)) return "video";
  return "archivo";
}

export async function POST(req: NextRequest) {
  if (!(await esAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (req.headers.get("content-type")?.includes("application/json")) return crearDesdeJson(req);
  return crearDesdeFormulario(req);
}

/** Flujo nuevo: el archivo ya está en el bucket; aquí solo se registra. */
async function crearDesdeJson(req: NextRequest) {
  let cuerpo: { titulo?: unknown; descripcion?: unknown; url?: unknown; tipo?: unknown };
  try {
    cuerpo = (await req.json()) as typeof cuerpo;
  } catch {
    return NextResponse.json({ error: "Petición inválida." }, { status: 400 });
  }

  const titulo = typeof cuerpo.titulo === "string" ? cuerpo.titulo.trim() : "";
  const descripcion = typeof cuerpo.descripcion === "string" ? cuerpo.descripcion.trim() : "";
  const url = typeof cuerpo.url === "string" ? cuerpo.url.trim() : "";
  const tipo = typeof cuerpo.tipo === "string" ? (cuerpo.tipo as Tipo) : ("" as Tipo);

  if (!titulo) return NextResponse.json({ error: "Falta el título" }, { status: 400 });
  if (!/^https?:\/\//.test(url)) {
    return NextResponse.json({ error: "El link debe empezar con http(s)://" }, { status: 400 });
  }
  if (!TIPOS.includes(tipo)) {
    return NextResponse.json({ error: "Tipo de recurso no válido." }, { status: 400 });
  }
  // Los tipos de archivo solo se aceptan para objetos de NUESTRO bucket de
  // subidas — lo demás se registra como liga.
  if (tipo !== "link" && !url.includes(`/object/public/${BUCKET_SUBIDAS}/`)) {
    return NextResponse.json(
      { error: "Esa URL no corresponde a un archivo subido aquí. Regístrala como liga." },
      { status: 400 },
    );
  }

  const { error } = await supabaseService()
    .from("af_recursos")
    .insert({ titulo, descripcion, url, tipo });
  if (error) {
    return NextResponse.json({ error: "No se pudo guardar el recurso." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

/** Flujo viejo (FormData): liga externa o archivo chico que viaja por la API. */
async function crearDesdeFormulario(req: NextRequest) {
  const form = await req.formData();
  const titulo = String(form.get("titulo") ?? "").trim();
  const descripcion = String(form.get("descripcion") ?? "").trim();
  const link = String(form.get("link") ?? "").trim();
  const archivo = form.get("archivo");
  if (!titulo) return NextResponse.json({ error: "Falta el título" }, { status: 400 });

  const service = supabaseService();
  let url = "";
  let tipo = "link";

  if (archivo instanceof File && archivo.size > 0) {
    if (archivo.size > MAX_MB * 1024 * 1024) {
      return NextResponse.json({ error: `El archivo pasa de ${MAX_MB} MB` }, { status: 400 });
    }
    const limpio = archivo.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${Date.now()}-${limpio}`;
    const { error: upErr } = await service.storage
      .from(BUCKET_LEGADO)
      .upload(path, Buffer.from(await archivo.arrayBuffer()), {
        contentType: archivo.type || "application/octet-stream",
        upsert: false,
      });
    if (upErr) return NextResponse.json({ error: `Storage: ${upErr.message}` }, { status: 500 });
    url = service.storage.from(BUCKET_LEGADO).getPublicUrl(path).data.publicUrl;
    tipo = tipoDesdeArchivo(limpio);
  } else if (link) {
    if (!/^https?:\/\//.test(link)) {
      return NextResponse.json({ error: "El link debe empezar con http(s)://" }, { status: 400 });
    }
    url = link;
  } else {
    return NextResponse.json({ error: "Sube un archivo o pega un link" }, { status: 400 });
  }

  const { error } = await service.from("af_recursos").insert({ titulo, descripcion, url, tipo });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/** Muestra u oculta un recurso a los afiliados. */
export async function PATCH(req: NextRequest) {
  if (!(await esAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let cuerpo: { id?: unknown; activo?: unknown };
  try {
    cuerpo = (await req.json()) as typeof cuerpo;
  } catch {
    return NextResponse.json({ error: "Petición inválida." }, { status: 400 });
  }
  const id = typeof cuerpo.id === "string" ? cuerpo.id : "";
  if (!id || typeof cuerpo.activo !== "boolean") {
    return NextResponse.json({ error: "Faltan datos." }, { status: 400 });
  }

  const { error } = await supabaseService()
    .from("af_recursos")
    .update({ activo: cuerpo.activo })
    .eq("id", id);
  if (error) {
    return NextResponse.json({ error: "No se pudo actualizar. Intenta de nuevo." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

/** Borra un recurso (y su archivo del bucket si vive ahí). */
export async function DELETE(req: NextRequest) {
  if (!(await esAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = (await req.json()) as { id?: string };
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const service = supabaseService();
  const { data: rec } = await service
    .from("af_recursos")
    .select("url")
    .eq("id", id)
    .maybeSingle<{ url: string }>();
  const { error } = await service.from("af_recursos").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: "No se pudo borrar. Intenta de nuevo." }, { status: 500 });
  }

  // Si el archivo vive en alguno de nuestros buckets, se borra también.
  for (const bucket of [BUCKET_SUBIDAS, BUCKET_LEGADO]) {
    const marca = `/object/public/${bucket}/`;
    if (rec?.url.includes(marca)) {
      const path = decodeURIComponent(rec.url.split(marca)[1] ?? "");
      if (path) await service.storage.from(bucket).remove([path]);
    }
  }
  return NextResponse.json({ ok: true });
}
