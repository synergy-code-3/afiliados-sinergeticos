"use client";

import { useEffect, useState } from "react";
import { COMISIONES_PAQUETE } from "@/lib/comisiones";

/** Tope del teaser de la landing, en UNA sola moneda.
 *
 * Regla de Manuel: "que los de USD no se enteren de MXN y viceversa". Como la
 * landing es una sola para ambos mercados, se decide por la zona horaria del
 * navegador: zona de EE. UU. → dólares; cualquier otra → pesos (el público es
 * MX/US). Es solo presentación — el dinero real siempre lo calcula el servidor
 * con la geografía del evento. Antes de hidratar se muestra el monto MX para
 * no parpadear en el mercado mayoritario. */

const TOPE_MX = `$${(COMISIONES_PAQUETE.MX["12m"] / 100).toLocaleString("es-MX")} MXN`;
const TOPE_US = `$${(COMISIONES_PAQUETE.US["12m"] / 100).toLocaleString("es-MX")} USD`;

const zonaEsUS = (): boolean => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
    if (!tz.startsWith("America/")) return false;
    const usZonas = [
      "America/New_York",
      "America/Chicago",
      "America/Denver",
      "America/Phoenix",
      "America/Los_Angeles",
      "America/Boise",
      "America/Detroit",
      "America/Indiana",
      "America/Kentucky",
      "America/Anchorage",
    ];
    return usZonas.some((z) => tz === z || tz.startsWith(z));
  } catch {
    return false;
  }
};

export default function TopeComision() {
  const [tope, setTope] = useState(TOPE_MX);
  useEffect(() => {
    if (zonaEsUS()) setTope(TOPE_US);
  }, []);
  return <span className="text-[#19e16d]">{tope}</span>;
}
