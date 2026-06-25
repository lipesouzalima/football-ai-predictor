"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { formatKickoffInBrazil } from "@/lib/date-utils";

export function Countdown({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  const [formattedTime, setFormattedTime] = useState("");

  useEffect(() => {
    const target = new Date(targetDate).getTime();
    setFormattedTime(formatKickoffInBrazil(targetDate));

    const updateTimer = () => {
      const diff = target - Date.now();

      if (diff > 0 && diff <= 12 * 60 * 60 * 1000) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds });
      } else {
        setTimeLeft(null);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  if (timeLeft) {
    return (
      <motion.span
        animate={{ opacity: [0.76, 1, 0.76] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        className="inline-flex items-center gap-1.5 rounded-full bg-white/78 px-3 py-1 text-xs font-black text-slate-950 shadow-sm ring-1 ring-white/65"
      >
        <span className="h-2 w-2 rounded-full bg-fuchsia-500 shadow-[0_0_0_4px_rgba(217,70,239,0.18)]" />
        <span className="font-mono tabular-nums">
          {timeLeft.hours > 0 ? `${String(timeLeft.hours).padStart(2, "0")}:` : ""}
          {String(timeLeft.minutes).padStart(2, "0")}:
          {String(timeLeft.seconds).padStart(2, "0")}
        </span>
      </motion.span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-white/72 px-3 py-1 text-xs font-black text-slate-950 shadow-sm ring-1 ring-white/65">
      {formattedTime}
    </span>
  );
}
