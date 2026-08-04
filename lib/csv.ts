/** Generación y descarga de CSV — compartido por el panel del afiliado y el
 * admin. Se importa desde componentes de cliente (usa el DOM al descargar). */

/** Entrecomilla SIEMPRE: los nombres de evento traen comas y los teléfonos
 * empiezan con `+`; sin comillas Excel parte las columnas o los interpreta mal. */
const celda = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;

export function construirCsv(columnas: string[], filas: string[][]): string {
  const cuerpo = filas.map((f) => f.map(celda).join(","));
  // BOM para que Excel respete los acentos (Pequeño, Juárez)
  return "﻿" + [columnas.map(celda).join(","), ...cuerpo].join("\r\n");
}

export function descargarCsv(nombreBase: string, csv: string): void {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${nombreBase}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
