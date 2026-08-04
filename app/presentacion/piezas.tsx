"use client";

import { useState, type CSSProperties } from "react";

/** Piezas compartidas de la presentación Synergy +1.
 * Las clases (.palabra, .cascada-item, .premio-*) viven en el CSS del deck. */

/** Formato de dinero para sala/proyector: "$2,700 MXN" · "$359 USD".
 * Los montos SIEMPRE salen de lib/comisiones.ts; aquí solo se pintan. */
export const dineroSala = (cents: number, moneda: "MXN" | "USD"): string =>
  `$${(cents / 100).toLocaleString("es-MX", { maximumFractionDigits: 0 })} ${moneda}`;

/** Retraso escalonado para tarjetas/frases que entran en cascada. */
export const estiloCascada = (i: number): CSSProperties => ({
  animationDelay: `${0.12 + i * 0.13}s`,
});

/** Revela un texto palabra por palabra (entrada "palabras" del deck). */
export function Palabras({ texto }: { texto: string }) {
  return (
    <>
      {texto.split(" ").map((palabra, i) => (
        <span
          key={`${i}-${palabra}`}
          className="palabra"
          style={{ animationDelay: `${i * 0.09}s` }}
        >
          {palabra}
        </span>
      ))}
    </>
  );
}

/** Imagen de premio con respaldo elegante: si el .webp aún no existe en
 * /public/premios, se ve un degradado con la meta gigante — nunca un ícono roto. */
export function ImagenPremio({ src, alt, numero }: { src: string; alt: string; numero: number }) {
  const [fallo, setFallo] = useState(false);

  if (fallo) {
    return (
      <div className="premio-respaldo" role="img" aria-label={alt}>
        <span>{numero}</span>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className="premio-img" loading="lazy" onError={() => setFallo(true)} />
  );
}
