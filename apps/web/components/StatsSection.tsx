"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { ScrollReveal } from "./ScrollReveal";

function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let cur = 0;
    const step = target / (2000 / 16);
    const t = setInterval(() => {
      cur += step;
      if (cur >= target) { setCount(target); clearInterval(t); }
      else setCount(Math.floor(cur));
    }, 16);
    return () => clearInterval(t);
  }, [inView, target]);

  const fmt = count >= 1_000_000
    ? (count / 1_000_000).toFixed(1) + "M"
    : count >= 1_000 ? (count / 1_000).toFixed(0) + "K"
    : count.toString();

  return <span ref={ref}>{fmt}{suffix}</span>;
}

const stats = [
  { label: "Engineers Tested", value: 850000, icon: "👥", color: "text-accent",      bar: "bg-accent",      pct: "85%" },
  { label: "Cheats Blocked",   value: 1200000, icon: "🛡️", color: "text-destructive", bar: "bg-destructive", pct: "92%" },
  { label: "Rounds Played",    value: 4200000, icon: "🎮", color: "text-primary",     bar: "bg-primary",     pct: "96%" },
  { label: "System Trust",     value: 99,      icon: "✓",  color: "text-accent",      bar: "bg-accent",      pct: "99%", suffix: ".9%" },
];

export const StatsSection = () => (
  <section className="border-y-2 border-foreground bg-card py-16">
    <div className="max-w-7xl mx-auto px-6">
      {/* Section header */}
      <div className="flex items-center gap-4 mb-10">
        <div className="h-px flex-1 bg-foreground/20" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
          Platform Stats
        </span>
        <div className="h-px flex-1 bg-foreground/20" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <ScrollReveal key={s.label} delay={i * 0.1}>
            <motion.div
              className="border-2 border-foreground bg-background p-6 shadow-retro flex flex-col gap-3"
              whileHover={{ y: -4, boxShadow: "6px 6px 0px 0px hsl(var(--navy))" }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{s.label}</span>
                <span className="text-base">{s.icon}</span>
              </div>
              <div className={`text-3xl font-black font-mono ${s.color}`}>
                <Counter target={s.value} suffix={s.suffix} />
              </div>
              <div className="w-full h-2 bg-muted border border-foreground/30 overflow-hidden">
                <motion.div
                  className={`h-full ${s.bar}`}
                  initial={{ width: 0 }}
                  whileInView={{ width: s.pct }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, delay: 0.3 + i * 0.1, ease: "easeOut" }}
                />
              </div>
            </motion.div>
          </ScrollReveal>
        ))}
      </div>
    </div>
  </section>
);
