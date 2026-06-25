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
      className="inline-flex items-center gap-2 rounded-full bg-white/22 px-4 py-2 text-sm font-black text-white shadow-sm ring-1 ring-white/24 backdrop-blur-md transition hover:bg-white/30"
    >
      <ArrowLeft className={`h-4 w-4 ${isPending ? "animate-pulse" : ""}`} />
      Voltar
    </button>
  );
}
