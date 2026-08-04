import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_ADMIN, crearTokenAdmin, llaveCorrecta } from "@/lib/admin-auth";

/** Canjea la llave de administración por una cookie de sesión firmada. */
export async function POST(req: NextRequest) {
  const { llave } = (await req.json()) as { llave?: string };
  if (!llaveCorrecta(llave?.trim() ?? "")) {
    return NextResponse.json({ error: "Llave incorrecta." }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_ADMIN, crearTokenAdmin(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 12 * 3600,
  });
  return res;
}

/** Cerrar sesión de administración. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_ADMIN, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
