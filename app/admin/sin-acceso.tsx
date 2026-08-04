import Link from "next/link";

/** Pantalla del panel de administración cuando no se tiene acceso.
 * Distingue "no iniciaste sesión" de "tu cuenta no es administradora": el
 * segundo caso no se arregla volviendo a entrar. */
export default function SinAcceso({
  autenticado,
  email,
}: {
  autenticado: boolean;
  email: string | null;
}) {
  return (
    <main className="relative">
      <div className="aurora">
        <span className="b1" />
      </div>
      <div className="wrap relative flex justify-center pb-24 pt-16">
        <div className="glass a1 w-full max-w-md p-8">
          <p className="sec-tag mb-4">Administración</p>
          {autenticado ? (
            <>
              <h1 className="text-2xl font-extrabold">Tu cuenta no tiene acceso</h1>
              <p className="mt-3 leading-relaxed text-white/55">
                Entraste como{" "}
                <span className="font-semibold text-white/80">{email}</span>, y esa cuenta no
                está en la lista de administradores. Pídele a un administrador que te agregue.
              </p>
              <Link href="/panel" className="btn-cta btn-press !mt-8 inline-block">
                Ir a mi panel →
              </Link>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-extrabold">Inicia sesión</h1>
              <p className="mt-3 leading-relaxed text-white/55">
                El panel de administración se abre con tu propia cuenta.
              </p>
              <Link href="/entrar" className="btn-cta btn-press !mt-8 inline-block">
                Entrar con mi cuenta →
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
