/** Geografía compartida del mapa MX–US (panel y presentación).
 *
 * SVG dibujado a mano sobre proyección equirectangular:
 *   x = (lon + 125) * 25          →  -125°O … -85°O  ⇒  0 … 1000
 *   y = (38 - lat) * (640 / 24)   →   38°N … 14°N    ⇒  0 … 640
 * Con esa fórmula cualquier ciudad se coloca con sus coordenadas reales
 * sin re-dibujar nada. Los contornos son simplificados pero geográficos:
 * Baja California, Yucatán, el Río Bravo y las costas salen de puntos reales.
 *
 * Aquí vive TODO lo que no depende de React: proyección, gazetteer, matching
 * de ciudades, contornos y el acomodo determinístico de etiquetas. Los
 * componentes (mapa del panel, mapa del deck) solo pintan.
 */

export const VB_ANCHO = 1000;
export const VB_ALTO = 640;

/** Proyección del encabezado: de coordenadas reales al viewBox. */
export const xDeLon = (lon: number): number => (lon + 125) * 25;
export const yDeLat = (lat: number): number => (38 - lat) * (VB_ALTO / 24);

export type PosEtiqueta = "arriba" | "abajo" | "izq" | "der";

export interface CiudadGazetteer {
  nombre: string;
  /** Alias en minúsculas y sin acentos; se buscan como subcadena del evento. */
  alias: readonly string[];
  lat: number;
  lon: number;
  /** De qué lado va el nombre, para que no se encimen en racimos (Texas, Bajío). */
  etiqueta: PosEtiqueta;
}

/** Ciudades donde el negocio hace eventos. Las que proyectan fuera del
 * recorte del mapa (Chicago, Miami, NY…) igual viven aquí: el matching las
 * reconoce y sus eventos se muestran como fichas bajo el mapa. */
export const GAZETTEER: readonly CiudadGazetteer[] = [
  // México
  { nombre: "Tijuana", alias: ["tijuana"], lat: 32.5149, lon: -117.0382, etiqueta: "izq" },
  { nombre: "Mexicali", alias: ["mexicali"], lat: 32.6633, lon: -115.4678, etiqueta: "abajo" },
  { nombre: "Ciudad Juárez", alias: ["ciudad juarez", "cd. juarez", "cd juarez", "juarez"], lat: 31.6904, lon: -106.4245, etiqueta: "abajo" },
  { nombre: "Chihuahua", alias: ["chihuahua"], lat: 28.6353, lon: -106.0889, etiqueta: "der" },
  { nombre: "Hermosillo", alias: ["hermosillo"], lat: 29.0729, lon: -110.9559, etiqueta: "der" },
  { nombre: "Culiacán", alias: ["culiacan"], lat: 24.8091, lon: -107.394, etiqueta: "der" },
  { nombre: "Monterrey", alias: ["monterrey"], lat: 25.6866, lon: -100.3161, etiqueta: "der" },
  { nombre: "Guadalajara", alias: ["guadalajara", "zapopan", "gdl"], lat: 20.6597, lon: -103.3496, etiqueta: "der" },
  { nombre: "Puerto Vallarta", alias: ["puerto vallarta", "vallarta"], lat: 20.6534, lon: -105.2253, etiqueta: "izq" },
  { nombre: "Aguascalientes", alias: ["aguascalientes"], lat: 21.8853, lon: -102.2916, etiqueta: "arriba" },
  { nombre: "León", alias: ["leon"], lat: 21.125, lon: -101.686, etiqueta: "arriba" },
  { nombre: "Querétaro", alias: ["queretaro"], lat: 20.5888, lon: -100.3899, etiqueta: "der" },
  { nombre: "Morelia", alias: ["morelia"], lat: 19.706, lon: -101.195, etiqueta: "abajo" },
  { nombre: "Toluca", alias: ["toluca"], lat: 19.2827, lon: -99.6557, etiqueta: "abajo" },
  { nombre: "CDMX", alias: ["cdmx", "ciudad de mexico", "mexico city"], lat: 19.4326, lon: -99.1332, etiqueta: "arriba" },
  { nombre: "Puebla", alias: ["puebla"], lat: 19.0414, lon: -98.2063, etiqueta: "der" },
  { nombre: "Veracruz", alias: ["veracruz"], lat: 19.1738, lon: -96.1342, etiqueta: "der" },
  { nombre: "Oaxaca", alias: ["oaxaca"], lat: 17.0654, lon: -96.7237, etiqueta: "abajo" },
  { nombre: "Mérida", alias: ["merida"], lat: 20.9678, lon: -89.6217, etiqueta: "arriba" },
  { nombre: "Cancún", alias: ["cancun"], lat: 21.1619, lon: -86.8515, etiqueta: "izq" },
  // Estados Unidos
  { nombre: "Austin", alias: ["austin"], lat: 30.2672, lon: -97.7431, etiqueta: "arriba" },
  { nombre: "Dallas", alias: ["dallas"], lat: 32.7767, lon: -96.797, etiqueta: "arriba" },
  { nombre: "Houston", alias: ["houston"], lat: 29.7604, lon: -95.3698, etiqueta: "der" },
  { nombre: "San Antonio", alias: ["san antonio"], lat: 29.4241, lon: -98.4936, etiqueta: "abajo" },
  { nombre: "El Paso", alias: ["el paso"], lat: 31.7619, lon: -106.485, etiqueta: "arriba" },
  { nombre: "Phoenix", alias: ["phoenix"], lat: 33.4484, lon: -112.074, etiqueta: "arriba" },
  { nombre: "Los Ángeles", alias: ["los angeles"], lat: 34.0522, lon: -118.2437, etiqueta: "der" },
  { nombre: "San José", alias: ["san jose", "fremont"], lat: 37.3382, lon: -121.8863, etiqueta: "der" },
  { nombre: "Sacramento", alias: ["sacramento"], lat: 38.5816, lon: -121.4944, etiqueta: "der" },
  { nombre: "Fresno", alias: ["fresno"], lat: 36.7378, lon: -119.7871, etiqueta: "der" },
  { nombre: "Las Vegas", alias: ["las vegas"], lat: 36.1699, lon: -115.1398, etiqueta: "der" },
  { nombre: "Denver", alias: ["denver"], lat: 39.7392, lon: -104.9903, etiqueta: "abajo" },
  { nombre: "Chicago", alias: ["chicago"], lat: 41.8781, lon: -87.6298, etiqueta: "abajo" },
  { nombre: "Atlanta", alias: ["atlanta"], lat: 33.749, lon: -84.388, etiqueta: "izq" },
  { nombre: "Miami", alias: ["miami"], lat: 25.7617, lon: -80.1918, etiqueta: "izq" },
  { nombre: "Orlando", alias: ["orlando"], lat: 28.5383, lon: -81.3792, etiqueta: "izq" },
  { nombre: "Tampa", alias: ["tampa"], lat: 27.9506, lon: -82.4572, etiqueta: "izq" },
  { nombre: "New York", alias: ["new york", "nueva york", "nyc"], lat: 40.7128, lon: -74.006, etiqueta: "izq" },
  { nombre: "Boston", alias: ["boston"], lat: 42.3601, lon: -71.0589, etiqueta: "izq" },
];

/* ── Matching de ciudades ─────────────────────────────────────────────────────
 * Se normaliza (minúsculas, sin acentos) y se busca cada alias como subcadena
 * del nombre del evento; el venue es el respaldo. Gana la coincidencia con el
 * alias más largo — así "Monterrey" (9) le gana a "León" (4) aunque el venue
 * diga "Nuevo León". */

export const normalizar = (t: string): string =>
  t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

/** Nombres de lugar que CONTIENEN a otra ciudad del gazetteer y engañarían al
 * matching por subcadena: se borran del texto antes de comparar. */
const FALSOS_AMIGOS: readonly string[] = ["nuevo leon", "benito juarez", "san jose del cabo"];

const limpiarFalsosAmigos = (t: string): string =>
  FALSOS_AMIGOS.reduce((acc, falso) => acc.split(falso).join(" "), t);

export const buscarCiudad = (texto: string): CiudadGazetteer | null => {
  const limpio = limpiarFalsosAmigos(normalizar(texto));
  const mejor = GAZETTEER.reduce<{ ciudad: CiudadGazetteer; largo: number } | null>(
    (acc, ciudad) => {
      const largo = ciudad.alias.reduce(
        (max, a) => (limpio.includes(a) && a.length > max ? a.length : max),
        0,
      );
      if (largo === 0) return acc;
      return acc === null || largo > acc.largo ? { ciudad, largo } : acc;
    },
    null,
  );
  return mejor?.ciudad ?? null;
};

/** El mapa recorta en 38°N y 85°O: lo que proyecta fuera no se pinta como pin. */
export const dentroDelMapa = (x: number, y: number): boolean =>
  x >= 10 && x <= VB_ANCHO - 10 && y >= 40 && y <= VB_ALTO - 10;

/* ── Contornos ────────────────────────────────────────────────────────────────
 * La frontera MX–US es la MISMA polilínea en ambos países para que embonen:
 * Tijuana (32.53°N) → Río Colorado en Mexicali/Calexico (32.72°N) → San Luis
 * Río Colorado → Nogales → El Paso/Juárez → Río Bravo → Laredo → Brownsville.
 * El tramo de California SUBE hacia el este (la frontera real va de 32.53°N a
 * 32.72°N): así Mexicali (32.66°N) queda del lado mexicano, como en la vida
 * real. */

/** Sur de Estados Unidos, recortado arriba (~36.5°N) y a la derecha (~85°O):
 * costa de California, frontera, Texas completo y costa del Golfo. */
export const D_US =
  "M78 40 L113 95 L170 115 L196 141 L199 145 " + // costa de California
  "L257 140 L255 147 L350 178 L420 178 L420 166 L463 167 " + // frontera oeste
  "L548 235 L588 227 L638 280 L688 323 " + // Río Bravo hasta Brownsville
  "L690 272 L755 232 L825 224 L890 235 L938 205 L1000 203 " + // costa del Golfo
  "L1000 40 Z";

/** México completo: frontera, Golfo, Yucatán, Caribe, Chiapas, Pacífico,
 * Mar de Cortés y la península de Baja California hasta Los Cabos. */
export const D_MX =
  "M199 145 L257 140 L255 147 L350 178 L420 178 L420 166 L463 167 " + // frontera
  "L548 235 L588 227 L638 280 L688 323 " + // Río Bravo
  "L679 421 L722 501 L765 529 L830 516 L863 484 L868 453 " + // Golfo y Campeche
  "L948 437 L957 450 L939 475 L918 520 " + // Yucatán (punta en Cancún) y Caribe
  "L896 539 L851 538 L818 621 " + // Belice, Guatemala, Chiapas
  "L745 581 L628 564 L570 533 L518 505 L483 469 L465 395 L428 352 L353 269 L288 179 " + // Pacífico
  "L261 168 L254 187 L288 243 L318 285 L341 320 L368 369 L378 403 " + // Mar de Cortés (lado este de Baja)
  "L360 389 L323 357 L249 271 L268 248 L240 219 L210 164 Z"; // Pacífico de Baja hasta Tijuana

/** Líneas internas que hacen reconocibles a Texas y California. */
export const D_ESTADOS =
  "M463 167 L466 160 L550 160 L550 40 " + // oeste de Texas y su panhandle
  "M625 40 L625 92 L774 117 L782 173 L779 229 " + // Río Rojo y frontera con Luisiana
  "M209 40 L259 80 L257 140"; // límite este de California

/* ── Acomodo de etiquetas: que los racimos no se encimen ─────────────────────
 * Determinístico y a escala nominal (~0.8px CSS por unidad de viewBox, el
 * ancho típico del mapa donde hay etiquetas). Reglas, en este orden:
 *   1. Racimo denso — 3+ ciudades a menos de 44px entre sí (Bajío con todo
 *      encendido): esas no llevan nombre, solo punto y conteo; el nombre
 *      vive en el tooltip y en la ficha.
 *   2. Lado fijo por ciudad (el campo `etiqueta` del gazetteer).
 *   3. Si aun así una etiqueta quedaría a menos de 16px de otra etiqueta, o
 *      pisaría el punto de otra ciudad (GDL y Vallarta), la que sigue en el
 *      recorrido norte→sur se corre en vertical hasta librar — hacia arriba
 *      si su lado es "arriba", hacia abajo en los demás casos. */

const ESCALA_NOMINAL = 0.8; // px CSS por unidad de viewBox
const SEPARACION_MIN_PX = 16;
const RADIO_RACIMO_PX = 44;
const VECINOS_RACIMO = 2; // con 2 vecinos así de cerca ya son 3 ciudades
const ANCHO_LETRA_PX = 7; // fuente de 11px + letter-spacing
const ALTO_ETIQUETA_PX = 13;
const OFFSET_VERTICAL_PX = 14; // borde de la etiqueta arriba/abajo del pin
const OFFSET_LATERAL_PX = 16; // borde de la etiqueta a un lado del pin
const RADIO_PUNTO_PX = 12; // caja del punto de otra ciudad (obstáculo)
const HOLGURA_PUNTO_PX = 2; // colchón al librar un punto
const MAX_INTENTOS_ACOMODO = 6;

/** Lo mínimo que el acomodo necesita saber de un pin. */
export interface PuntoEtiquetable {
  x: number;
  y: number;
  nombre: string;
  etiqueta: PosEtiqueta;
}

export interface EtiquetaAcomodada {
  visible: boolean;
  /** Desplazamiento vertical extra (px CSS) para no encimarse. */
  dy: number;
}

interface RectPx {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const rectEtiqueta = (pin: PuntoEtiquetable, dy: number): RectPx => {
  const cx = pin.x * ESCALA_NOMINAL;
  const cy = pin.y * ESCALA_NOMINAL + dy;
  const ancho = pin.nombre.length * ANCHO_LETRA_PX;
  const media = ALTO_ETIQUETA_PX / 2;
  switch (pin.etiqueta) {
    case "arriba":
      return {
        x1: cx - ancho / 2,
        x2: cx + ancho / 2,
        y1: cy - OFFSET_VERTICAL_PX - ALTO_ETIQUETA_PX,
        y2: cy - OFFSET_VERTICAL_PX,
      };
    case "abajo":
      return {
        x1: cx - ancho / 2,
        x2: cx + ancho / 2,
        y1: cy + OFFSET_VERTICAL_PX,
        y2: cy + OFFSET_VERTICAL_PX + ALTO_ETIQUETA_PX,
      };
    case "izq":
      return { x1: cx - OFFSET_LATERAL_PX - ancho, x2: cx - OFFSET_LATERAL_PX, y1: cy - media, y2: cy + media };
    case "der":
      return { x1: cx + OFFSET_LATERAL_PX, x2: cx + OFFSET_LATERAL_PX + ancho, y1: cy - media, y2: cy + media };
  }
};

/** Holgura vertical entre rectángulos: negativa si se pisan de verdad. */
const seEstorban = (a: RectPx, b: RectPx, separacion: number): boolean => {
  if (a.x2 < b.x1 || b.x2 < a.x1) return false;
  const holguraY = a.y1 > b.y2 ? a.y1 - b.y2 : b.y1 > a.y2 ? b.y1 - a.y2 : -1;
  return holguraY < separacion;
};

/** Caja del punto de una ciudad: obstáculo que ninguna etiqueta debe pisar. */
const rectPunto = (pin: PuntoEtiquetable): RectPx => ({
  x1: pin.x * ESCALA_NOMINAL - RADIO_PUNTO_PX,
  x2: pin.x * ESCALA_NOMINAL + RADIO_PUNTO_PX,
  y1: pin.y * ESCALA_NOMINAL - RADIO_PUNTO_PX,
  y2: pin.y * ESCALA_NOMINAL + RADIO_PUNTO_PX,
});

export function acomodarEtiquetas(
  pines: readonly PuntoEtiquetable[],
): ReadonlyMap<string, EtiquetaAcomodada> {
  const enRacimo = (pin: PuntoEtiquetable): boolean =>
    pines.filter(
      (otro) =>
        otro !== pin &&
        Math.hypot((otro.x - pin.x) * ESCALA_NOMINAL, (otro.y - pin.y) * ESCALA_NOMINAL) <
          RADIO_RACIMO_PX,
    ).length >= VECINOS_RACIMO;
  const puntos = pines.map(rectPunto);
  // Recorrido norte→sur (y oeste→este): mismo dato, mismo acomodo.
  const orden = [...pines].sort((a, b) => a.y - b.y || a.x - b.x);
  const colocadas: RectPx[] = [];
  const acomodo = new Map<string, EtiquetaAcomodada>();
  for (const pin of orden) {
    if (enRacimo(pin)) {
      acomodo.set(pin.nombre, { visible: false, dy: 0 });
      continue;
    }
    const direccion = pin.etiqueta === "arriba" ? -1 : 1;
    let dy = 0;
    for (let intento = 0; intento < MAX_INTENTOS_ACOMODO; intento++) {
      const rect = rectEtiqueta(pin, dy);
      const contraEtiqueta = colocadas.find((otra) => seEstorban(rect, otra, SEPARACION_MIN_PX));
      const choque = contraEtiqueta ?? puntos.find((p) => seEstorban(rect, p, 0));
      if (!choque) break;
      const holgura = contraEtiqueta ? SEPARACION_MIN_PX : HOLGURA_PUNTO_PX;
      dy += direccion === -1 ? choque.y1 - holgura - rect.y2 : choque.y2 + holgura - rect.y1;
    }
    colocadas.push(rectEtiqueta(pin, dy));
    acomodo.set(pin.nombre, { visible: true, dy });
  }
  return acomodo;
}
