import type { Metadata } from "next";
import type { ReactNode } from "react";

/** Layout de /presentacion: modo sala.
 * Oculta el header global del portal (el deck es pantalla completa propia)
 * y define las clases neumórficas compartidas por los slides.
 * Solo aplica mientras una ruta de /presentacion está montada. */

export const metadata: Metadata = {
  title: "Presentación · Programa +1",
  description: "Presentación oficial del Programa +1 para la comunidad del Club Sinergético.",
};

const CSS_PRESENTACION = `
body > header { display: none; }

.pres-fondo-base {
  min-height: 100dvh;
  background:
    radial-gradient(1100px 700px at 75% -10%, rgba(25,225,109,0.09), transparent 60%),
    radial-gradient(900px 600px at 5% 110%, rgba(217,180,91,0.06), transparent 55%),
    #0e1412;
}

/* Neumorfismo oscuro Sinergéticos: superficie extruida con doble sombra */
.pres-card {
  background: #121917;
  border-radius: 18px;
  box-shadow: -6px -6px 14px rgba(46,66,56,0.55), 8px 8px 18px rgba(2,6,4,0.85);
}
.pres-inset {
  background: #0b110f;
  border-radius: 14px;
  box-shadow: inset -4px -4px 10px rgba(46,66,56,0.30), inset 5px 5px 12px rgba(2,6,4,0.70);
}

.sello-suma {
  display: inline-flex; align-items: center;
  border-radius: 999px; padding: 10px 22px;
  font-weight: 800; font-size: clamp(1rem, 1.6vw, 1.35rem);
  letter-spacing: 0.08em; font-variant-numeric: tabular-nums;
  color: #d9b45b; background: #0b110f;
  box-shadow: inset -3px -3px 8px rgba(46,66,56,0.3), inset 4px 4px 10px rgba(2,6,4,0.7);
}

`;

export default function PresentacionLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{CSS_PRESENTACION}</style>
      {children}
    </>
  );
}
