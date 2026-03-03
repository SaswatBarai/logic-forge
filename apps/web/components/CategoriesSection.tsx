"use client";

import { motion } from "framer-motion";
import { ScrollReveal } from "./ScrollReveal";

const categories = [
  {
    id: "THE_MISSING_LINK",
    title: "The Missing Link",
    tagline: "Fill the blank",
    description: "A critical line of logic is removed. You must identify exactly what's missing to make the code correct — no hints, no autocomplete.",
    icon: "🔗",
    difficulty: "NORMAL",
    color: "bg-accent",
    textColor: "text-accent",
    borderColor: "border-accent",
    dots: 2,
  },
  {
    id: "THE_BOTTLENECK_BREAKER",
    title: "Bottleneck Breaker",
    tagline: "Pick the fastest",
    description: "You see an O(N²) implementation. Four refactors are presented — only one is truly optimal. Choose wrong and your score drops.",
    icon: "⚡",
    difficulty: "HARD",
    color: "bg-primary",
    textColor: "text-primary",
    borderColor: "border-primary",
    dots: 3,
  },
  {
    id: "STATE_TRACING",
    title: "State Tracing",
    tagline: "Trace the execution",
    description: "No running the code. Read it, trace the execution mentally, and type the exact final value. Pure engineering intuition.",
    icon: "🔍",
    difficulty: "HARD",
    color: "bg-blue-500",
    textColor: "text-blue-400",
    borderColor: "border-blue-500",
    dots: 3,
  },
  {
    id: "SYNTAX_ERROR_DETECTION",
    title: "Syntax Sniper",
    tagline: "Spot the bug",
    description: "A real-world snippet with one subtle syntax error buried inside. Find it before the timer hits zero. One chance, full pressure.",
    icon: "🐛",
    difficulty: "ELITE",
    color: "bg-destructive",
    textColor: "text-destructive",
    borderColor: "border-destructive",
    dots: 3,
  },
];

export const CategoriesSection = () => (
  <section id="categories" className="max-w-7xl mx-auto px-6 py-24">
    <ScrollReveal>
      <div className="flex flex-col gap-2 mb-16">
        <div className="flex items-center gap-3">
          <div className="bg-primary w-3 h-3 border border-foreground" />
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
      {categories.map((cat, i) => (
        <ScrollReveal key={cat.id} delay={i * 0.1}>
          <motion.div
            className="group border-2 border-foreground bg-card shadow-retro overflow-hidden flex flex-col h-full"
            whileHover={{ y: -6, boxShadow: "8px 8px 0px 0px hsl(var(--navy))" }}
            transition={{ duration: 0.2 }}
          >
            {/* Top accent bar */}
            <div className={`h-1 w-full ${cat.color}`} />

            <div className="p-8 flex flex-col gap-4 h-full">
              <div className="flex items-start justify-between">
                <div className={`${cat.color}/10 border-2 border-foreground w-14 h-14 flex items-center justify-center text-2xl`}>
                  {cat.icon}
                </div>
                {/* Difficulty badge */}
                <div className={`border ${cat.borderColor} px-2 py-1`}>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${cat.textColor}`}>
                    {cat.difficulty}
                  </span>
                </div>
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

              {/* Difficulty dots */}
              <div className="flex items-center gap-2">
                {[1, 2, 3].map((d) => (
                  <motion.div
                    key={d}
                    className={`w-2 h-2 border border-foreground ${d <= cat.dots ? cat.color : "bg-muted"}`}
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + d * 0.1 }}
                  />
                ))}
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  Difficulty
                </span>
              </div>
            </div>
          </motion.div>
        </ScrollReveal>
      ))}
    </div>
  </section>
);
