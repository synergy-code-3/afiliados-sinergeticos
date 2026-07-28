import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
  weight: ["400", "600", "700", "800"],
});

export const viewport: Viewport = {
  themeColor: "#080808",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Afiliados · Sinergéticos",
  description: "Invita a tus conocidos a los eventos Sinergéticos y regálales su boleto.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX" className={outfit.variable}>
      <body className="min-h-screen">
        <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#080808]/80 backdrop-blur-md">
          <div className="wrap flex h-16 items-center justify-between">
            <a href="/" className="text-[17px] font-extrabold tracking-tight">
              SINERGÉTICOS<span className="text-[#19e16d]">.</span>
              <span className="ml-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
                Afiliados
              </span>
            </a>
            <span className="sec-tag">
              <span className="pulse inline-block h-1.5 w-1.5 rounded-full bg-[#19e16d]" />
              Programa de invitados
            </span>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
