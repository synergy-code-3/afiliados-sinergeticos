/** Helpers de presentación del boleto — se importan desde componentes de
 * cliente, así que este archivo NO debe tocar claves ni la API interna
 * (eso vive en lib/boletera.ts, solo server). */

/** Página del boleto en la boletera — la misma que recibe el invitado por
 * WhatsApp, con su QR y el botón "Descargar PDF" de la propia boletera. */
export const ligaBoleto = (ticketId: string) => `https://synergyticket.net/ticket/${ticketId}`;

/** Estados de `af_inscripciones` traducidos a algo que un afiliado entienda.
 * En la base guardamos `error: <detalle crudo>`, que jamás debe verse en la UI. */
export function estadoLegible(status: string): {
  texto: string;
  tono: "ok" | "espera" | "falla";
} {
  if (status === "emitido") return { texto: "Boleto enviado", tono: "ok" };
  if (status === "enviando") return { texto: "Emitiendo…", tono: "espera" };
  return { texto: "No se pudo emitir", tono: "falla" };
}
