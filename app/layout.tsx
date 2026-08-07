import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import Header from "@/app/components/header";
import WhatsappBubble from "@/app/components/whatsapp-bubble";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
  weight: ["400", "600", "700", "800"],
});

export const viewport: Viewport = {
  themeColor: "#0e1412",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Synergy +1 · Programa +1 de Sinergéticos",
  description:
    "Sé el +1 de alguien más: invita a tus conocidos al Seminario con Pase de Invitado Especial de cortesía y gana con ello.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX" className={outfit.variable}>
      <body className="min-h-screen">
        <Header />
        {children}
        <WhatsappBubble />
      </body>
    </html>
  );
}
