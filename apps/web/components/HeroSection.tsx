"use client";

import { motion } from "framer-motion";
import { Hero3D } from "./Hero3D";

export const HeroSection = () => {
  return (
    <section className="max-w-7xl mx-auto px-6 py-20 lg:py-32 grid lg:grid-cols-2 gap-16 items-center relative">
      <div className="flex flex-col gap-8 z-10">
        <motion.h1
          className="text-6xl md:text-8xl font-black leading-[0.9] tracking-tighter text-foreground cursor-pointer"
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{
            color: "hsl(43, 96%, 56%)",
            textShadow: "4px 4px 0px hsl(222, 47%, 11%)",
          }}
          style={{ transition: "color 0.3s, text-shadow 0.3s" }}
        >
          LOGIC, <br />NOT SYNTAX.
        </motion.h1>
        <motion.div
          className="border-2 border-foreground p-6 bg-card shadow-retro-lg max-w-lg"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <p className="text-lg font-medium leading-relaxed">
            The gamified, AI-proof technical evaluation platform built to test
            engineering intuition, not just memorization. Stop hiring prompt
            engineers; start hiring problem solvers.
          </p>
        </motion.div>
        <motion.div
          className="flex flex-wrap gap-6 mt-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <a href="#cta">
            <motion.button
              className="arcade-btn bg-primary px-10 py-5 border-2 border-foreground shadow-retro text-xl font-black uppercase tracking-widest flex items-center gap-3"
              whileHover={{
                scale: 1.05,
                boxShadow: "6px 6px 0px 0px hsl(var(--navy))",
              }}
              whileTap={{
                scale: 0.95,
                x: 2,
                y: 2,
                boxShadow: "0px 0px 0px 0px hsl(var(--navy))",
              }}
            >
              <span>▶</span>
              Enter Arena
            </motion.button>
          </a>
          <motion.button
            className="arcade-btn bg-card px-10 py-5 border-2 border-foreground shadow-retro text-xl font-black uppercase tracking-widest"
            whileHover={{
              scale: 1.05,
              boxShadow: "6px 6px 0px 0px hsl(var(--navy))",
            }}
            whileTap={{
              scale: 0.95,
              x: 2,
              y: 2,
              boxShadow: "0px 0px 0px 0px hsl(var(--navy))",
            }}
          >
            View Demo
          </motion.button>
        </motion.div>
      </div>

      <div className="relative">
        <Hero3D />
        <motion.div
          className="bg-foreground rounded-xl p-1 shadow-retro-lg overflow-hidden border-2 border-foreground relative z-10"
          initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="rounded-lg overflow-hidden" style={{ backgroundColor: "hsl(var(--editor-bg))" }}>
            <div className="px-4 py-2 border-b-2 border-foreground flex justify-between items-center" style={{ backgroundColor: "hsl(var(--editor-header))" }}>
              <div className="flex gap-2">
                <motion.div
                  className="size-3 rounded-full bg-destructive border border-foreground"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2, delay: 0 }}
                />
                <motion.div
                  className="size-3 rounded-full bg-primary border border-foreground"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2, delay: 0.3 }}
                />
                <motion.div
                  className="size-3 rounded-full bg-accent border border-foreground"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2, delay: 0.6 }}
                />
              </div>
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                Level 01: Memory_Leak.exe
              </div>
              <div className="flex gap-1">
                <div className="health-bar-segment" />
                <div className="health-bar-segment" />
                <div className="health-bar-segment" />
                <div
                  className="health-bar-segment bg-slate-700"
                  style={{ backgroundColor: undefined }}
                />
              </div>
            </div>
            <div className="p-6 font-mono text-sm leading-relaxed space-y-1">
              {[
                {
                  num: "01",
                  content: (
                    <>
                      <span className="text-purple-400">func</span>{" "}
                      <span className="text-blue-400">optimize_kernel</span>(
                      v []<span className="text-yellow-400">int</span>) {"{"}
                    </>
                  ),
                },
                {
                  num: "02",
                  content: (
                    <span className="text-slate-400 pl-4">
                      {"// BUG: O(N^2) detected"}
                    </span>
                  ),
                },
                {
                  num: "03",
                  content: (
                    <>
                      <span className="text-orange-400 pl-4">for</span> i :={" "}
                      <span className="text-green-400">0</span>; i &lt;{" "}
                      <span className="text-blue-400">len</span>(v); i++ {"{"}
                    </>
                  ),
                },
                {
                  num: "04",
                  content: (
                    <>
                      <span className="text-orange-400 pl-8">if</span>{" "}
                      <span className="text-blue-400">validate</span>(v[i]){" "}
                      {"{"}
                    </>
                  ),
                },
                {
                  num: "05",
                  content: (
                    <span className="bg-destructive/20 border-b border-destructive text-destructive font-bold">
                      ??? MISSING_LOGIC ???
                    </span>
                  ),
                },
                { num: "06", content: "   }" },
                { num: "07", content: "  }" },
                { num: "08", content: "}" },
              ].map((line, i) => (
                <motion.div
                  key={line.num}
                  className="flex gap-4"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + i * 0.1 }}
                >
                  <span className="text-slate-600">{line.num}</span>
                  {line.content}
                </motion.div>
              ))}
            </div>
            <motion.div
              className="bg-destructive px-4 py-2 text-destructive-foreground text-[10px] font-bold uppercase"
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              ! WARNING: AI DETECTION TRIGGERED - GPT INPUT BLOCKED !
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
