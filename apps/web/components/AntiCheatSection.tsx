"use client";

import { motion } from "framer-motion";
import { Shield, Brain, Shuffle, EyeOff } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";

const features = [
  {
    title: "Canvas Obfuscation",
    icon: EyeOff,
    tag: "FORGEGUARD·CANVAS",
    description:
      "Code is rendered into transient canvas frames with no accessible DOM text, blocking LLM browser extensions from scraping problem statements.",
  },
  {
    title: "Semantic Randomization",
    icon: Shuffle,
    tag: "FORGEGUARD·SEMANTICS",
    description:
      "Each round is procedurally regenerated with new variable names, control flow, and distractors so no two candidates see the same exact pattern.",
  },
  {
    title: "Behavioral Telemetry",
    icon: Brain,
    tag: "FORGEGUARD·PATTERNS",
    description:
      "We sample keystroke rhythm, edit bursts, and pause windows to flag paste-heavy behavior and inhuman solving patterns in real time.",
  },
];

export const AntiCheatSection = () => {
  return (
    <section className="bg-[#020617] py-24 border-y-2 border-foreground">
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <ScrollReveal>
          <div className="flex flex-col gap-3 mb-12">
            <div className="flex items-center gap-3 text-amber-400">
              <Shield className="w-5 h-5" />
              <span className="text-[11px] font-black uppercase tracking-[0.35em]">
                Secured by ForgeGuard
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">
              Built‑in <span className="text-amber-400">AI‑Immunity</span>
            </h2>
            <p className="max-w-2xl text-sm text-slate-400 leading-relaxed">
              LogicForge assumes every candidate has access to GPT‑5. So the anti‑cheat
              is designed from the ground up to make automated assistance pointless,
              detectable, or both.
            </p>
          </div>
        </ScrollReveal>

        {/* Feature strip */}
        <div className="relative">
          {/* Background grid + glow */}
          <div className="pointer-events-none absolute inset-0 opacity-40">
            <div
              className="w-full h-full"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 0 0, rgba(250,204,21,0.18), transparent 55%), radial-gradient(circle at 100% 100%, rgba(15,23,42,0.9), transparent 55%)",
              }}
            />
          </div>
          <div
            className="absolute inset-6 border border-amber-500/40 rounded-3xl pointer-events-none"
            style={{
              borderStyle: "dashed",
            }}
          />

          <div className="relative grid gap-6 md:grid-cols-3">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <ScrollReveal key={feat.title} delay={idx * 0.1}>
                  <motion.div
                    className="group h-full border border-amber-500/50 bg-[#020617]/80 rounded-2xl px-6 py-7 flex flex-col gap-4 shadow-[0_0_0_1px_rgba(15,23,42,1)] backdrop-blur"
                    whileHover={{
                      y: -4,
                      boxShadow: "0 0 40px rgba(250,204,21,0.25)",
                      borderColor: "rgba(250,204,21,0.9)",
                    }}
                    transition={{ duration: 0.18 }}
                  >
                    {/* Icon + tag */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full border border-amber-400/60 bg-black/40 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-amber-300" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-300/80">
                          {feat.tag}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">
                        0{idx + 1}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-black uppercase tracking-tight text-slate-50">
                      {feat.title}
                    </h3>

                    {/* Body copy */}
                    <p className="text-xs text-slate-400 leading-relaxed flex-1">
                      {feat.description}
                    </p>

                    {/* Status strip */}
                    <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-500">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 group-hover:bg-emerald-300 transition-colors" />
                        ACTIVE
                      </span>
                      <span className="uppercase tracking-[0.25em] text-amber-300/70">
                        Shield {idx + 1}
                      </span>
                    </div>
                  </motion.div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
