"use client";

import { motion } from "framer-motion";
import { ScrollReveal } from "./ScrollReveal";
import { useTilt } from "@/hooks/useMicroInteractions";

const categories = [
  {
    id: "THE_MISSING_LINK",    title: "The Missing Link",   tagline: "Fill the blank",
    description: "A critical line of logic is removed. You must identify exactly what's missing to make the code correct — no hints, no autocomplete.",
    icon: "🔗", difficulty: "NORMAL", color: "bg-accent",      textColor: "text-accent",
    borderColor: "border-accent", glowColor: "rgba(var(--accent-rgb),0.15)", dots: 2,
  },
  {
    id: "THE_BOTTLENECK_BREAKER", title: "Bottleneck Breaker", tagline: "Pick the fastest",
    description: "You see an O(N²) implementation. Four refactors are presented — only one is truly optimal. Choose wrong and your score drops.",
    icon: "⚡", difficulty: "HARD", color: "bg-primary", textColor: "text-primary",
    borderColor: "border-primary", glowColor: "rgba(var(--primary-rgb),0.15)", dots: 3,
  },
  {
    id: "STATE_TRACING", title: "State Tracing", tagline: "Trace the execution",
    description: "No running the code. Read it, trace the execution mentally, and type the exact final value. Pure engineering intuition.",
    icon: "🔍", difficulty: "HARD", color: "bg-blue-500", textColor: "text-blue-400",
    borderColor: "border-blue-500", glowColor: "rgba(59,130,246,0.15)", dots: 3,
  },
  {
    id: "SYNTAX_ERROR_DETECTION", title: "Syntax Sniper", tagline: "Spot the bug",
    description: "A real-world snippet with one subtle syntax error buried inside. Find it before the timer hits zero. One chance, full pressure.",
    icon: "🐛", difficulty: "ELITE", color: "bg-destructive", textColor: "text-destructive",
    borderColor: "border-destructive", glowColor: "rgba(var(--destructive-rgb),0.15)", dots: 3,
  },
];

function CategoryCard({ cat, i }: { cat: typeof categories[0]; i: number }) {
  const tilt = useTilt(5);

  return (
    <ScrollReveal delay={i * 0.1}>
      <motion.div
        ref={tilt.ref}
        className="group border-2 border-foreground bg-card shadow-retro overflow-hidden flex flex-col h-full cursor-default"
        style={{ rotateX: tilt.rotateX, rotateY: tilt.rotateY, transformPerspective: 800 }}
        onMouseMove={tilt.onMouseMove}
        onMouseLeave={tilt.onMouseLeave}
        whileHover={{ y: -8, boxShadow: "10px 10px 0px 0px hsl(var(--navy))" }}
        transition={{ type: "spring", stiffness: 280, damping: 22 }}
      >
        {/* Top accent bar — grows on hover */}
        <motion.div
          className={`w-full ${cat.color}`}
          initial={{ height: "4px" }}
          whileHover={{ height: "6px" }}
          transition={{ duration: 0.2 }}
        />

        <div className="p-8 flex flex-col gap-4 h-full">
          <div className="flex items-start justify-between">
            {/* Icon with bounce */}
            <motion.div
              className={`${cat.color}/10 border-2 border-foreground w-14 h-14 flex items-center justify-center text-2xl`}
              whileHover={{ scale: 1.15, rotate: [0, -8, 8, 0] }}
              transition={{ duration: 0.35 }}
            >
              {cat.icon}
            </motion.div>

            {/* Difficulty badge — pulses on hover */}
            <motion.div
              className={`border ${cat.borderColor} px-2 py-1`}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.15 }}
            >
              <span className={`text-[9px] font-black uppercase tracking-widest ${cat.textColor}`}>
                {cat.difficulty}
              </span>
            </motion.div>
          </div>

          <div>
            <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${cat.textColor} mb-1`}>
              {cat.tagline}
            </p>
            <h3 className="text-xl font-black uppercase">{cat.title}</h3>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed flex-1">
            {cat.description}
          </p>

          {/* Difficulty dots — stagger animate into view */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((d) => (
              <motion.div
                key={d}
                className={`w-2 h-2 border border-foreground ${d <= cat.dots ? cat.color : "bg-muted"}`}
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{
                  type: "spring", stiffness: 500, damping: 18,
                  delay: 0.3 + i * 0.08 + d * 0.07,
                }}
              />
            ))}
            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
              Difficulty
            </span>
          </div>
        </div>
      </motion.div>
    </ScrollReveal>
  );
}

export const CategoriesSection = () => (
  <section id="categories" className="max-w-7xl mx-auto px-6 py-24">
    <ScrollReveal>
      <div className="flex flex-col gap-2 mb-16">
        <div className="flex items-center gap-3">
          <motion.div
            className="bg-primary w-3 h-3 border border-foreground"
            animate={{ rotate: [0, 90, 180, 270, 360] }}
            transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
          />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
            Challenge Types
          </span>
        </div>
        <h2 className="text-5xl font-black uppercase tracking-tighter leading-none">
          Select Your <span className="text-primary">Mission</span>
        </h2>
      </div>
    </ScrollReveal>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {categories.map((cat, i) => <CategoryCard key={cat.id} cat={cat} i={i} />)}
    </div>
  </section>
);
