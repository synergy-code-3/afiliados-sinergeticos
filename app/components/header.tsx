"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoSynergyPlus from "@/app/components/logo-synergy";

/** Header global. En `/presentacion` no se dibuja: la presentación es
 * fullscreen y sin chrome. */
export default function Header() {
  const pathname = usePathname();
  if (pathname?.startsWith("/presentacion")) return null;

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0e1412]/85 backdrop-blur-md">
      <div className="wrap flex h-16 items-center justify-between">
        <Link href="/" aria-label="Synergy +1 · ir al inicio" className="flex items-center py-2">
          <LogoSynergyPlus size={24} />
        </Link>
        <span className="sec-tag">
          <span className="pulse inline-block h-1.5 w-1.5 rounded-full bg-[#19e16d]" />
          1 + 1 = 3<span className="hidden sm:inline"> · Programa +1</span>
        </span>
      </div>
    </header>
  );
}
