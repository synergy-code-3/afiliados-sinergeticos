import { NextResponse, type NextRequest } from "next/server";
import { supabaseService } from "@/lib/supabase-server";
import { esAdmin } from "@/lib/admin-auth";

const BUCKET = "afiliados-recursos";
const MAX_MB = 50;

function tipoDesdeArchivo(nombre: string): string {
  const ext = nombre.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) return "imagen";
  if (["mp4", "mov", "webm"].includes(ext)) return "video";
  return "archivo";
}

/** Crea un recurso: archivo subido al bucket público, o un link externo. */
export async function POST(req: NextRequest) {
  if (!(await esAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
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
      .from(BUCKET)
      .upload(path, Buffer.from(await archivo.arrayBuffer()), {
        contentType: archivo.type || "application/octet-stream",
        upsert: false,
      });
    if (upErr) return NextResponse.json({ error: `Storage: ${upErr.message}` }, { status: 500 });
    url = service.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
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
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const marca = `/object/public/${BUCKET}/`;
  if (rec?.url.includes(marca)) {
    const path = decodeURIComponent(rec.url.split(marca)[1] ?? "");
    if (path) await service.storage.from(BUCKET).remove([path]);
  }
  return NextResponse.json({ ok: true });
}
