import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DeckClient from "../deck-client";
import type { Mercado } from "../slides";

/** /presentacion/mx · /presentacion/us — el deck por mercado.
 * Cualquier otro valor cae en notFound(). */

const MERCADOS: readonly Mercado[] = ["mx", "us"];

const esMercado = (valor: string): valor is Mercado =>
  (MERCADOS as readonly string[]).includes(valor);

export function generateStaticParams() {
  return MERCADOS.map((mercado) => ({ mercado }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ mercado: string }>;
}): Promise<Metadata> {
  const { mercado } = await params;
  return {
    title:
      mercado === "us" ? "Presentación USA · Synergy +1" : "Presentación MX · Synergy +1",
  };
}

export default async function PaginaPresentacion({
  params,
}: {
  params: Promise<{ mercado: string }>;
}) {
  const { mercado } = await params;
  if (!esMercado(mercado)) notFound();
  return <DeckClient mercado={mercado} />;
}
