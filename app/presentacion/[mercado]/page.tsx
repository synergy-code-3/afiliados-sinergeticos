import { permanentRedirect } from "next/navigation";

/** /presentacion/mx · /presentacion/us — rutas viejas del deck por mercado.
 * El deck se unificó (5-ago-2026): cualquier liga guardada cae en la
 * presentación única con un 308 permanente. */

export default function PresentacionPorMercado() {
  permanentRedirect("/presentacion");
}
