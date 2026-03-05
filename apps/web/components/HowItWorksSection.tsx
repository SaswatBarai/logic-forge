"use client";

import { motion } from "framer-motion";
import { ScrollReveal } from "./ScrollReveal";
import { useTilt } from "@/hooks/useMicroInteractions";

const steps = [
  { num: "01", title: "Enter the Arena",  desc: "Choose your challenge category and format — solo sprint or head-to-head dual. Queue up and get matched in seconds.", icon: "▶", color: "bg-primary" },
  { num: "02", title: "Race the Clock",   desc: "5 rounds. Real code. No documentation, no AI, no shortcuts. Each challenge adapts to test deep engineering intuition.", icon: "⏱", color: "bg-accent" },
  { num: "03", title: "Prove Your Score", desc: "Your result is unfakeable — state tracing, bottleneck analysis, and syntax detection can't be solved by prompt engineering.", icon: "✓", color: "bg-destructive" },
];

function StepCard({ step, i }: { step: typeof steps[0]; i: number }) {
  const tilt = useTilt(5);
  return (
    <ScrollReveal delay={i * 0.15}>
      <motion.div
        ref={tilt.ref}
        className="relative border-2 border-foreground bg-background shadow-retro p-8 flex flex-col gap-4 z-10 cursor-default"
        style={{ rotateX: tilt.rotateX, rotateY: tilt.rotateY, transformPerspective: 700 }}
        onMouseMove={tilt.onMouseMove}
        onMouseLeave={tilt.onMouseLeave}
        whileHover={{ y: -8, boxShadow: "10px 10px 0px 0px hsl(var(--navy))" }}
        transition={{ type: "spring", stiffness: 280, damping: 22 }}
      >
        {/* Step number — bounces on hover */}
        <motion.div
          className={`${step.color} w-12 h-12 border-2 border-foreground flex items-center justify-center font-black text-sm font-mono`}
          whileHover={{ scale: 1.15, rotate: -5 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
        >
          {step.num}
        </motion.div>

        <h3 className="text-xl font-black uppercase">{step.title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>

        {/* Connector arrow */}
        {i < steps.length - 1 && (
          <motion.div
            className="hidden md:block absolute -right-5 top-10 z-20 text-foreground/40 font-black text-xl"
            animate={{ x: [0, 4, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          >
            →
          </motion.div>
        )}
      </motion.div>
    </ScrollReveal>
  );
}

export const HowItWorksSection = () => (
  <section id="how" className="border-y-2 border-foreground bg-card py-24">
    <div className="max-w-7xl mx-auto px-6">
      <ScrollReveal>
        <div className="flex flex-col gap-2 mb-16">
          <div className="flex items-center gap-3">
            <motion.div
              className="bg-accent w-3 h-3 border border-foreground"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
              How It Works
            </span>
          </div>
          <h2 className="text-5xl font-black uppercase tracking-tighter leading-none">
            Three Steps to <span className="text-primary">Truth</span>
          </h2>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
        {/* Connector line — draws in on view */}
        <motion.div
          className="hidden md:block absolute top-12 left-[16%] right-[16%] border-t-2 border-dashed border-foreground/30 z-0"
          initial={{ scaleX: 0, originX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        />
        {steps.map((step, i) => <StepCard key={step.num} step={step} i={i} />)}
      </div>
    </div>
  </section>
);
