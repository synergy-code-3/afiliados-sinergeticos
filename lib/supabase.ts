import { createBrowserClient } from "@supabase/ssr";

/** Cliente del navegador (Auth del proyecto de Axis; los afiliados no tienen
 * rol de dashboard, así que jamás pueden entrar a Axis). */
export function supabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
  );
}
