"use client";

import { motion } from "framer-motion";
import { ScrollReveal } from "./ScrollReveal";

const features = [
  {
    title: "Canvas Obfuscation",
    icon: "🖌️",
    desc: "Our editor renders code as transient canvas elements, preventing LLM browser extensions from reading the problem structure.",
  },
  {
    title: "Semantic Randomization",
    icon: "🔀",
    desc: "Challenges are procedurally generated with shifting semantics, ensuring no two candidates see the same logic pattern.",
  },
  {
    title: "Behavioral Telemetry",
    icon: "🧠",
    desc: "AI monitors keystroke rhythms and problem-solving velocity to flag inhuman coding patterns or copy-paste actions.",
  },
];

export const AntiCheatSection = () => {
  return (
    <section className="bg-foreground text-background py-24 overflow-hidden relative">
      <div
        className="absolute top-0 right-0 w-64 h-64 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, #fff 2px, transparent 2px)",
          backgroundSize: "20px 20px",
        }}
      />
      <div className="max-w-7xl mx-auto px-6 relative">
        <ScrollReveal>
          <div className="text-center mb-20">
            <motion.span
              className="text-primary font-black uppercase tracking-[0.4em] text-sm block mb-4"
              initial={{ letterSpacing: "0em" }}
              whileInView={{ letterSpacing: "0.4em" }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              Secured by ForgeGuard
            </motion.span>
            <h2 className="text-5xl font-black uppercase">Built-In AI-Immunity</h2>
          </div>
        </ScrollReveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <ScrollReveal key={f.title} delay={i * 0.15}>
              <motion.div
                className="p-8 border-2 border-primary rounded-xl bg-foreground/50 h-full"
                whileHover={{ borderColor: "hsl(43, 100%, 62%)", y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <motion.div
                  className="size-12 rounded-full border-2 border-primary flex items-center justify-center mb-6"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <span className="text-xl">{f.icon}</span>
                </motion.div>
                <h4 className="text-xl font-black uppercase mb-4">{f.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {f.desc}
                </p>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};
