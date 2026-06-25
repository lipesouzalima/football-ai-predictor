"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function BackButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleBack = () => {
    startTransition(() => {
      router.push("/");
    });
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className="inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-white/95 px-4 py-2 text-sm font-black text-slate-900 shadow-[0_12px_40px_-16px_rgba(15,23,42,0.4)] backdrop-blur-sm transition hover:bg-white"
    >
      <ArrowLeft className={`h-4 w-4 ${isPending ? "animate-pulse" : ""}`} />
      Voltar
    </button>
  );
}
