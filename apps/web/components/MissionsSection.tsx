"use client";

import { motion } from "framer-motion";
import { ScrollReveal } from "./ScrollReveal";

const missions = [
  {
    title: "Debug Quest",
    description:
      "Identify and squash deeply hidden memory leaks and concurrency bugs in existing production-grade codebases.",
    difficulty: "Normal",
    color: "bg-accent",
    colorText: "text-accent",
    dots: [true, true, false],
    icon: "🐛",
  },
  {
    title: "Algo Assault",
    description:
      "Solve complex algorithmic puzzles where the environment changes in real-time. Memorized solutions won't help you here.",
    difficulty: "Hard",
    color: "bg-destructive",
    colorText: "text-destructive",
    dots: [true, true, true],
    icon: "📊",
  },
  {
    title: "Sys Defense",
    description:
      "Architect resilient distributed systems while facing simulated traffic spikes, node failures, and security breaches.",
    difficulty: "Elite",
    color: "bg-primary",
    colorText: "text-primary",
    dots: [true, true, true],
    icon: "🔗",
  },
];

export const MissionsSection = () => {
  return (
    <section className="max-w-7xl mx-auto px-6 py-24">
      <ScrollReveal>
        <h2 className="text-4xl font-black uppercase mb-16 flex items-center gap-4">
          <span className="text-4xl">🕹️</span>
          Select Your Mission
        </h2>
      </ScrollReveal>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {missions.map((mission, i) => (
          <ScrollReveal key={mission.title} delay={i * 0.15}>
            <motion.div
              className="group border-2 border-foreground rounded-xl bg-card shadow-retro-lg overflow-hidden flex flex-col h-full"
              whileHover={{
                y: -8,
                boxShadow: "10px 10px 0px 0px hsl(var(--navy))",
              }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <motion.div
                className={`h-4 w-full ${mission.color} border-b-2 border-foreground`}
                whileHover={{ height: "8px" }}
              />
              <div className="p-8 flex flex-col h-full">
                <motion.div
                  className={`${mission.color}/10 size-16 rounded-lg border-2 border-foreground flex items-center justify-center mb-6`}
                  whileHover={{ rotate: 10, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <span className="text-3xl">{mission.icon}</span>
                </motion.div>
                <h3 className="text-2xl font-black uppercase mb-3">
                  {mission.title}
                </h3>
                <p className="text-sm font-medium leading-relaxed mb-8 flex-grow">
                  {mission.description}
                </p>
                <div
                  className={`flex items-center gap-2 font-black text-xs uppercase tracking-widest ${mission.colorText}`}
                >
                  Difficulty: {mission.difficulty}
                  <div className="flex gap-1 ml-2">
                    {mission.dots.map((filled, j) => (
                      <motion.div
                        key={j}
                        className={`size-2 border border-foreground ${filled ? mission.color : "bg-muted"}`}
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 + j * 0.1 }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
};
