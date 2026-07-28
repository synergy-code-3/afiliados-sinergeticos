"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminToggle({ id, activo, k }: { id: string; activo: boolean; k: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (loading) return;
    setLoading(true);
    await fetch("/api/admin/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, activo: !activo, k }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`rounded-lg px-3 py-1 text-xs font-bold transition disabled:opacity-50 ${
        activo
          ? "bg-[#19e16d]/15 text-[#19e16d] hover:bg-[#ffb2b2]/15 hover:text-[#ffb2b2]"
          : "bg-[#ffb2b2]/15 text-[#ffb2b2] hover:bg-[#19e16d]/15 hover:text-[#19e16d]"
      }`}
    >
      {activo ? "Activo" : "Desactivado"}
    </button>
  );
}
