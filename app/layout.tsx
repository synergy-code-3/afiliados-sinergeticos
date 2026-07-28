import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Afiliados Sinergéticos",
  description: "Invita a tus conocidos a los eventos Sinergéticos y regálales su boleto.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-[#0b0f0d] text-white antialiased">
        <div className="mx-auto max-w-3xl px-4 py-8">
          <header className="mb-8 flex items-center justify-between">
            <a href="/" className="text-lg font-extrabold tracking-tight">
              <span className="text-[#19e16d]">Sinergéticos</span> · Afiliados
            </a>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
