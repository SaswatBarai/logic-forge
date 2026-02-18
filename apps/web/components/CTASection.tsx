"use client";

import { motion } from "framer-motion";
import { ScrollReveal } from "./ScrollReveal";

export const CTASection = () => {
  return (
    <section id="cta" className="max-w-7xl mx-auto px-6 py-24">
      <ScrollReveal>
        <motion.div
          className="bg-primary border-3 border-foreground rounded-2xl p-12 md:p-20 shadow-retro-lg flex flex-col items-center text-center gap-8 relative overflow-hidden"
          whileHover={{ boxShadow: "12px 12px 0px 0px hsl(var(--navy))" }}
          transition={{ duration: 0.3 }}
        >
          <div className="absolute -bottom-10 -right-10 opacity-20 rotate-12">
            <svg height="300" viewBox="0 0 100 100" width="300">
              <rect
                fill="none"
                height="80"
                stroke="hsl(var(--navy))"
                strokeWidth="1"
                width="80"
                x="10"
                y="10"
              />
              <circle
                cx="50"
                cy="50"
                fill="none"
                r="30"
                stroke="hsl(var(--navy))"
                strokeWidth="1"
              />
              <path
                d="M0 50 L100 50 M50 0 L50 100"
                stroke="hsl(var(--navy))"
                strokeWidth="0.5"
              />
            </svg>
          </div>
          <motion.h2
            className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none z-10"
            initial={{ scale: 0.9 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, type: "spring" }}
          >
            Ready to <br />
            test real skill?
          </motion.h2>
          <p className="text-xl font-bold max-w-xl z-10">
            Join 500+ engineering teams cutting through the noise and hiring the
            best 1% of problem solvers.
          </p>
          <a href="#cta">
            <motion.button
              className="arcade-btn bg-foreground text-background px-12 py-6 border-2 border-foreground shadow-[4px_4px_0px_0px_white] text-2xl font-black uppercase tracking-widest z-10"
              whileHover={{
                scale: 1.05,
                boxShadow: "6px 6px 0px 0px white",
              }}
              whileTap={{
                scale: 0.95,
                x: 2,
                y: 2,
                boxShadow: "0px 0px 0px 0px white",
              }}
            >
              Enter The Arena
            </motion.button>
          </a>
        </motion.div>
      </ScrollReveal>
    </section>
  );
};
