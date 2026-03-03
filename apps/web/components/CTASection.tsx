"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ScrollReveal } from "./ScrollReveal";

export const CTASection = () => (
  <section id="cta" className="max-w-7xl mx-auto px-6 py-24">
    <ScrollReveal>
      <motion.div
        className="bg-primary border-2 border-foreground shadow-retro-lg p-12 md:p-20 flex flex-col items-center text-center gap-8 relative overflow-hidden"
        whileHover={{ boxShadow: "12px 12px 0px 0px hsl(var(--navy))" }}
      >
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(hsl(var(--navy)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--navy)) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <motion.div
          className="border-2 border-foreground bg-foreground px-4 py-1 z-10"
          animate={{ opacity: [1, 0.6, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-background">
            ▶ Arena Open — Join Now
          </span>
        </motion.div>

        <motion.h2
          className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none z-10"
          initial={{ scale: 0.9 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring" }}
        >
          Ready to Prove <br />
          <span className="text-foreground">Real Skill?</span>
        </motion.h2>

        <p className="text-base font-bold max-w-lg z-10">
          Join 500+ engineering teams cutting through noise and identifying the
          top 1% of problem solvers — with zero GPT interference.
        </p>

        <div className="flex flex-wrap gap-4 justify-center z-10">
          <Link href="/login">
            <motion.button
              className="arcade-btn bg-foreground text-background px-12 py-5 border-2 border-foreground shadow-[4px_4px_0px_0px_white] text-lg font-black uppercase tracking-widest"
              whileHover={{ scale: 1.05, boxShadow: "6px 6px 0px 0px white" }}
              whileTap={{ scale: 0.95, x: 2, y: 2, boxShadow: "0px 0px 0px 0px white" }}
            >
              ▶ Enter The Arena
            </motion.button>
          </Link>
          <motion.button
            className="arcade-btn bg-transparent text-foreground px-12 py-5 border-2 border-foreground text-lg font-black uppercase tracking-widest"
            whileHover={{ scale: 1.05, backgroundColor: "rgba(0,0,0,0.1)" }}
            whileTap={{ scale: 0.95 }}
          >
            Contact Sales
          </motion.button>
        </div>
      </motion.div>
    </ScrollReveal>
  </section>
);
