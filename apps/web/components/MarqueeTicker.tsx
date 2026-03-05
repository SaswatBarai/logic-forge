"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";

export const MarqueeTicker = () => {
  const [paused, setPaused] = useState(false);

  const items = [
    "▶ LIVE ROUNDS ACTIVE",
    "◆ AI DETECTION ENABLED",
    "▶ 850K+ ENGINEERS TESTED",
    "◆ ZERO MEMORIZATION",
    "▶ REAL-TIME EVALUATION",
    "◆ 4 CHALLENGE TYPES",
    "▶ ANTI-CHEAT ACTIVE",
    "◆ HIRE PROBLEM SOLVERS",
  ];

  return (
    <div
      className="border-b-2 border-foreground bg-primary overflow-hidden py-2 relative cursor-pointer select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Edge fade masks */}
      <div className="pointer-events-none absolute left-0 inset-y-0 w-16 z-10"
        style={{ background: "linear-gradient(to right, hsl(var(--primary)), transparent)" }} />
      <div className="pointer-events-none absolute right-0 inset-y-0 w-16 z-10"
        style={{ background: "linear-gradient(to left, hsl(var(--primary)), transparent)" }} />

      <motion.div
        className="flex whitespace-nowrap"
        animate={{ x: paused ? undefined : [0, "-50%"] }}
        transition={paused
          ? {}
          : { repeat: Infinity, duration: 22, ease: "linear" }
        }
        style={paused ? { animationPlayState: "paused" } : {}}
      >
        {[...items, ...items, ...items, ...items].map((item, i) => (
          <motion.span
            key={i}
            className="mx-8 text-[11px] font-black uppercase tracking-widest text-foreground inline-block"
            whileHover={{ scale: 1.1, color: "hsl(var(--background))" }}
            transition={{ duration: 0.15 }}
          >
            {item}
          </motion.span>
        ))}
      </motion.div>

      {/* Pause indicator */}
      {paused && (
        <motion.div
          className="absolute right-20 top-1/2 -translate-y-1/2 z-20 text-[9px] font-black uppercase tracking-widest text-foreground/70 font-mono"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
        >
          ⏸ PAUSED
        </motion.div>
      )}
    </div>
  );
};
