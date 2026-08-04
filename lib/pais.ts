/** País y moneda del evento.
 *
 * La boletera devuelve `timezone` por evento (ej. "America/Tijuana"), que es un
 * dato determinista — mejor que adivinar por el nombre de la ciudad, que cambia
 * de formato entre sistemas.
 *
 * Regla pedida por David: pesos si el evento es en México, dólares si es en
 * Estados Unidos.
 */

export type Pais = "MX" | "US";

/** Zonas horarias de México. Cualquier otra America/* se trata como US.
 *
 * OJO: la lista debe estar COMPLETA. `America/Ciudad_Juarez` existe desde 2022
 * (Juárez sigue el horario de EE. UU., no el de Chihuahua) y al faltar mandaba
 * los eventos de Cd. Juárez a dólares. */
const TZ_MX = new Set([
  "America/Mexico_City",
  "America/Tijuana",
  "America/Monterrey",
  "America/Cancun",
  "America/Merida",
  "America/Mazatlan",
  "America/Chihuahua",
  "America/Ciudad_Juarez",
  "America/Hermosillo",
  "America/Matamoros",
  "America/Ojinaga",
  "America/Bahia_Banderas",
]);

/** Ciudades de México que mandan sobre el timezone: si el nombre del evento las
 * menciona, es México aunque su zona horaria no esté en la lista. Red de
 * seguridad para que un tz nuevo no vuelva a mandar un evento mexicano a USD. */
const CIUDADES_MX = [
  "juárez", "juarez", "tijuana", "mexicali", "monterrey", "guadalajara", "gdl",
  "cdmx", "ciudad de méxico", "ciudad de mexico", "puebla", "querétaro", "queretaro",
  "cancún", "cancun", "mérida", "merida", "puerto vallarta", "león", "leon",
  "hermosillo", "culiacán", "culiacan", "chihuahua", "veracruz", "toluca",
  "aguascalientes", "san luis", "morelia", "oaxaca", "ensenada", "durango",
];

/** Ciudades de EE. UU. donde hay eventos — respaldo si no viene timezone. */
const CIUDADES_US = [
  "austin",
  "dallas",
  "houston",
  "san antonio",
  "tampa",
  "miami",
  "chicago",
  "los angeles",
  "phoenix",
  "denver",
  "atlanta",
  "orlando",
  "new york",
  "las vegas",
];

export function paisDeEvento(timezone?: string | null, nombre?: string | null): Pais {
  const n = (nombre ?? "").toLowerCase();
  // una ciudad mexicana en el nombre gana sobre cualquier timezone
  if (CIUDADES_MX.some((c) => n.includes(c))) return "MX";

  const tz = (timezone ?? "").trim();
  if (tz) return TZ_MX.has(tz) ? "MX" : "US";

  // sin timezone: se decide por el nombre de la ciudad
  return CIUDADES_US.some((c) => n.includes(c)) ? "US" : "MX";
}

export const MONEDA_DE_PAIS: Record<Pais, string> = { MX: "MXN", US: "USD" };
