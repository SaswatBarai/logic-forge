"use client";

import { motion } from "framer-motion";
import { ScrollReveal } from "./ScrollReveal";
import { useTilt, useElasticCounter } from "@/hooks/useMicroInteractions";

function ElasticCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const { ref, val } = useElasticCounter(target);
  const fmt = val >= 1_000_000
    ? (val / 1_000_000).toFixed(1) + "M"
    : val >= 1_000 ? (val / 1_000).toFixed(0) + "K"
    : val.toString();
  return <span ref={ref}>{fmt}{suffix}</span>;
}

function StatCard({ s, i }: { s: typeof stats[0]; i: number }) {
  const tilt = useTilt(6);

  return (
    <ScrollReveal delay={i * 0.1}>
      <motion.div
        ref={tilt.ref}
        className="border-2 border-foreground bg-background p-6 shadow-retro flex flex-col gap-3 cursor-default"
        style={{ rotateX: tilt.rotateX, rotateY: tilt.rotateY, transformPerspective: 600 }}
        onMouseMove={tilt.onMouseMove}
        onMouseLeave={tilt.onMouseLeave}
        whileHover={{ y: -6, boxShadow: "8px 8px 0px 0px hsl(var(--navy))" }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
            {s.label}
          </span>
          {/* Icon bounce on hover */}
          <motion.span
            className="text-base"
            whileHover={{ scale: 1.3, rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.3 }}
          >
            {s.icon}
          </motion.span>
        </div>

        <div className={`text-3xl font-black font-mono ${s.color}`}>
          <ElasticCounter target={s.value} suffix={s.suffix} />
        </div>

        {/* Shimmer progress bar */}
        <div className="w-full h-2 bg-muted border border-foreground/30 overflow-hidden relative">
          <motion.div
            className={`h-full ${s.bar}`}
            initial={{ width: 0 }}
            whileInView={{ width: s.pct }}
            viewport={{ once: true }}
            transition={{ duration: 1.4, delay: 0.2 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
          />
          {/* Shimmer sweep */}
          <motion.div
            className="absolute inset-y-0 w-6 bg-white/30 skew-x-12"
            animate={{ x: ["-100%", "600%"] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "linear", delay: i * 0.3 }}
          />
        </div>
      </motion.div>
    </ScrollReveal>
  );
}

const stats = [
  { label: "Engineers Tested", value: 850000,  icon: "👥", color: "text-accent",      bar: "bg-accent",      pct: "85%"             },
  { label: "Cheats Blocked",   value: 1200000, icon: "🛡️", color: "text-destructive", bar: "bg-destructive", pct: "92%"             },
  { label: "Rounds Played",    value: 4200000, icon: "🎮", color: "text-primary",     bar: "bg-primary",     pct: "96%"             },
  { label: "System Trust",     value: 99,      icon: "✓",  color: "text-accent",      bar: "bg-accent",      pct: "99%", suffix: ".9%" },
];

export const StatsSection = () => (
  <section className="border-y-2 border-foreground bg-card py-16">
    <div className="max-w-7xl mx-auto px-6">
      <div className="flex items-center gap-4 mb-10">
        <div className="h-px flex-1 bg-foreground/20" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
          Platform Stats
        </span>
        <div className="h-px flex-1 bg-foreground/20" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((s, i) => <StatCard key={s.label} s={s} i={i} />)}
      </div>
    </div>
  </section>
);
