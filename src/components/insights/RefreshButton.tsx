"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { RotateCw } from "lucide-react";
import { motion } from "framer-motion";

export function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleRefresh = () => {
    startTransition(async () => {
      // Forçar recarga atualizando a rota com a query string ?refresh=true
      router.replace("?refresh=true");
      
      // Limpar o query param após um breve período para que recargas de página normais não re-executem a IA
      setTimeout(() => {
        router.replace("?");
      }, 3000);
    });
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleRefresh}
      disabled={isPending}
      className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-black uppercase tracking-[0.12em] shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-950/20 disabled:cursor-not-allowed ${
        isPending
          ? "bg-slate-100 text-slate-400 border border-slate-200"
          : "bg-slate-950 text-white hover:bg-slate-900 border border-slate-950 shadow-slate-950/10"
      }`}
    >
      <RotateCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
      <span>{isPending ? "Recalculando com IA..." : "Atualizar com IA"}</span>
    </motion.button>
  );
}
