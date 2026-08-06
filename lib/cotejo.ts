import "server-only";
import { paisDeEvento } from "./pais";

/** Cotejo diario entre la BOLETERA (synergyticket.net — la fuente que emite
 * pases) y la WEB pública del seminario
 * (seminariodeemprendedoraempresariodigital.com — lo que la gente ve).
 *
 * Pedido de Manuel: "sincroniza cada 24 horas los eventos que tendremos,
 * coteja lo registrado con la boletera con lo que sale acá".
 *
 * El casamiento es por UUID: cada evento de la web trae `presaleVipUrl`
 * apuntando a synergyticket.net/embed/<uuid> — el mismo id de la boletera.
 * Nada se casa por nombre (los formatos difieren entre sistemas — trampa
 * documentada en STATE.md sesión 7).
 *
 * Ambos fetch llevan `revalidate: 86400` + tag "cotejo": la sincronización es
 * cada 24 horas sola (más un cron diario que calienta el caché), y el botón
 * "Actualizar ahora" del admin revalida el tag. */

const URL_BOLETERA = "https://synergyticket.net/api/events";
const URL_WEB = "https://seminariodeemprendedoraempresariodigital.com/api/events";

export const TAG_COTEJO = "cotejo";

interface EventoBoletera {
  id: string;
  name: string;
  date: string;
  venue?: string;
  timezone?: string;
  isActive?: boolean;
  freeTicketEnabled?: boolean;
}

interface EventoWeb {
  id: number;
  city: string;
  venue?: string;
  date?: string; // "08 AGO"
  time?: string; // "10:00 AM / 4:00 PM"
  available?: boolean;
  currency?: string; // "MXN" | "USD"
  presaleVipUrl?: string;
  ticketUrl?: string;
}

export interface FilaCotejo {
  ciudad: string;
  fechaWeb: string;
  fechaBoletera: string;
  detalle: string;
}

export interface ResultadoCotejo {
  ok: boolean;
  /** eventos que están en ambos lados y cuadran */
  coincidencias: number;
  /** en la web pero SIN evento válido en la boletera (o inactivo/sin pase) */
  soloWeb: FilaCotejo[];
  /** activos en la boletera (futuros, con pase de cortesía) que la web no muestra */
  soloBoletera: FilaCotejo[];
  /** mismo evento en ambos lados pero con datos que no cuadran */
  discrepancias: FilaCotejo[];
  /** eventos de la web sin liga a la boletera — no se pueden cotejar */
  sinLiga: FilaCotejo[];
}

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

const MESES: Record<string, number> = {
  ENE: 1, FEB: 2, MAR: 3, ABR: 4, MAY: 5, JUN: 6,
  JUL: 7, AGO: 8, SEP: 9, SEPT: 9, OCT: 10, NOV: 11, DIC: 12,
};

/** "08 AGO" → { dia: 8, mes: 8 } (null si no se puede leer). */
function fechaWebParseada(texto?: string): { dia: number; mes: number } | null {
  const m = /^\s*(\d{1,2})\s+([A-ZÁÉ]+)\s*$/i.exec(texto ?? "");
  if (!m) return null;
  const mes = MESES[m[2].toUpperCase().replace("É", "E")];
  if (!mes) return null;
  return { dia: Number(m[1]), mes };
}

/** Día y mes del evento de la boletera EN LA ZONA DEL EVENTO (la web publica
 * la fecha local, no la UTC — sin esto, un evento de las 10 am se cotejaría
 * contra el día equivocado). */
function fechaBoleteraLocal(iso: string, timezone?: string): { dia: number; mes: number } | null {
  const t = new Date(iso);
  if (!Number.isFinite(t.getTime())) return null;
  try {
    const partes = new Intl.DateTimeFormat("es-MX", {
      timeZone: timezone || "America/Mexico_City",
      day: "numeric",
      month: "numeric",
    }).formatToParts(t);
    const dia = Number(partes.find((p) => p.type === "day")?.value);
    const mes = Number(partes.find((p) => p.type === "month")?.value);
    return Number.isFinite(dia) && Number.isFinite(mes) ? { dia, mes } : null;
  } catch {
    return null;
  }
}

/** Fecha corta legible EN LA ZONA DEL EVENTO — jamás el corte UTC, que a los
 * eventos de la tarde les corre el día. */
function fechaLegible(iso?: string, timezone?: string): string {
  if (!iso) return "—";
  const t = new Date(iso);
  if (!Number.isFinite(t.getTime())) return "—";
  try {
    return new Intl.DateTimeFormat("es-MX", {
      timeZone: timezone || "America/Mexico_City",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(t);
  } catch {
    return iso.slice(0, 10);
  }
}

const normal = (s?: string) =>
  (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();

export async function cotejarEventos(): Promise<ResultadoCotejo> {
  const [rBoletera, rWeb] = await Promise.all([
    fetch(URL_BOLETERA, { next: { revalidate: 86400, tags: [TAG_COTEJO] } }),
    fetch(URL_WEB, { next: { revalidate: 86400, tags: [TAG_COTEJO] } }),
  ]);
  if (!rBoletera.ok || !rWeb.ok) {
    return { ok: false, coincidencias: 0, soloWeb: [], soloBoletera: [], discrepancias: [], sinLiga: [] };
  }
  const boletera = ((await rBoletera.json()) as EventoBoletera[]) ?? [];
  const web = ((await rWeb.json()) as EventoWeb[]) ?? [];

  const ahora = Date.now();
  const esVigente = (e: EventoBoletera) => {
    const t = new Date(e.date).getTime();
    return Number.isFinite(t) && t > ahora;
  };
  const invitable = (e: EventoBoletera) =>
    esVigente(e) && e.isActive !== false && e.freeTicketEnabled !== false;

  const porId = new Map(boletera.map((e) => [e.id, e]));
  const idsEnWeb = new Set<string>();

  const soloWeb: FilaCotejo[] = [];
  const discrepancias: FilaCotejo[] = [];
  const sinLiga: FilaCotejo[] = [];
  let coincidencias = 0;

  for (const w of web) {
    if (w.available === false) continue; // la web ya lo marcó no disponible
    const uuid =
      UUID_RE.exec(w.presaleVipUrl ?? "")?.[0] ?? UUID_RE.exec(w.ticketUrl ?? "")?.[0] ?? null;
    const fila = (detalle: string, fechaBoletera = "—"): FilaCotejo => ({
      ciudad: w.city ?? "—",
      fechaWeb: [w.date, w.time].filter(Boolean).join(" · ") || "—",
      fechaBoletera,
      detalle,
    });

    if (!uuid) {
      sinLiga.push(fila("Sin liga a la boletera (presaleVipUrl): agregarla en el admin de la web para poder cotejarlo."));
      continue;
    }
    idsEnWeb.add(uuid);
    const b = porId.get(uuid);
    if (!b) {
      soloWeb.push(fila("El evento de la web NO existe en la boletera."));
      continue;
    }
    if (!invitable(b)) {
      const motivo = !esVigente(b)
        ? "en la boletera ya pasó o no tiene fecha válida"
        : b.isActive === false
          ? "en la boletera está INACTIVO"
          : "en la boletera no tiene pase de cortesía habilitado";
      soloWeb.push(fila(`La web lo anuncia, pero ${motivo}.`, fechaLegible(b.date, b.timezone)));
      continue;
    }

    const problemas: string[] = [];
    const fw = fechaWebParseada(w.date);
    const fb = fechaBoleteraLocal(b.date, b.timezone);
    if (fw && fb && (fw.dia !== fb.dia || fw.mes !== fb.mes)) {
      problemas.push(`la FECHA no cuadra (web ${fw.dia}/${fw.mes} vs boletera ${fb.dia}/${fb.mes})`);
    }
    const monedaBoletera = paisDeEvento(b.timezone, b.name) === "US" ? "USD" : "MXN";
    if (w.currency && w.currency !== monedaBoletera) {
      problemas.push(`la MONEDA no cuadra (web ${w.currency} vs boletera ${monedaBoletera})`);
    }
    if (w.venue && b.venue && !normal(b.venue).includes(normal(w.venue)) && !normal(w.venue).includes(normal(b.venue))) {
      problemas.push(`el VENUE no cuadra (web "${w.venue.trim()}" vs boletera "${b.venue.trim()}")`);
    }
    if (problemas.length) {
      discrepancias.push(fila(problemas.join("; ") + ".", fechaLegible(b.date, b.timezone)));
    } else {
      coincidencias += 1;
    }
  }

  const soloBoletera: FilaCotejo[] = boletera
    .filter((b) => invitable(b) && !idsEnWeb.has(b.id))
    .filter((b) => {
      const n = (b.name ?? "").toLowerCase();
      return !n.includes("upgrade") && !n.includes("prueba") && !n.includes("unlimited");
    })
    .map((b) => ({
      ciudad: b.name ?? "—",
      fechaWeb: "—",
      fechaBoletera: fechaLegible(b.date, b.timezone),
      detalle: "Activo en la boletera pero la web del seminario no lo muestra.",
    }));

  return { ok: true, coincidencias, soloWeb, soloBoletera, discrepancias, sinLiga };
}
