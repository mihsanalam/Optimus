"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function IntegrationsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard?tab=integrations");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-zinc-400 font-medium">Consolidating workspace integrations...</p>
      </div>
    </div>
  );
}
