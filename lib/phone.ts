/** Validación de teléfono por lada — misma regla que el registro de las
 * landings (typos Dallas 27-jul): MX (+52) y US/CA (+1) exigen 10 dígitos
 * nacionales exactos; +1 valida NANP. Cero librerías. */
export function validarTelefono(e164: string): string | null {
  const v = (e164 || "").trim();
  const digits = v.replace(/\D/g, "");
  if (!v || !digits) return "Escribe su WhatsApp.";
  if (v.startsWith("+52")) {
    const n = digits.slice(2);
    if (n.length !== 10) {
      return `El número de México debe tener 10 dígitos después de la lada (escribiste ${n.length}).`;
    }
    return null;
  }
  if (v.startsWith("+1")) {
    const n = digits.slice(1);
    if (n.length !== 10) {
      return `El número de EE. UU./Canadá debe tener 10 dígitos después de la lada (escribiste ${n.length}).`;
    }
    if (/^[01]/.test(n) || /^[01]/.test(n.slice(3))) {
      return "Ese número no parece válido en EE. UU./Canadá — revisa los 10 dígitos.";
    }
    return null;
  }
  if (digits.length < 8 || digits.length > 14) return "Revisa el número — parece incompleto.";
  return null;
}

/** Arma E.164 desde lada elegida + nacional tecleado (quita lada duplicada). */
export function buildE164(dial: string, national: string): string {
  const dd = (dial || "").replace(/\D/g, "");
  let n = (national || "").replace(/\D/g, "").replace(/^0+/, "");
  if (!dd || !n) return "";
  if (n.startsWith(dd) && n.length - dd.length >= 10) n = n.slice(dd.length);
  if (dd === "52" && n.length === 11 && n.startsWith("1")) n = n.slice(1);
  return "+" + dd + n;
}
