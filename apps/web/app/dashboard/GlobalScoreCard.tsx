"use client";

import { motion }                           from "framer-motion";
import { Trophy, Zap, Shield, Flame, Star } from "lucide-react";

interface Props {
  score:     number;
  username?: string;
}

const RANKS = [
  { label: "ROOKIE",   min: 0,     color: "text-zinc-500",   bg: "bg-zinc-500/10",   border: "border-zinc-400/25",   bar: "bg-zinc-500",   icon: Shield },
  { label: "BRONZE",   min: 500,   color: "text-amber-600",  bg: "bg-amber-600/10",  border: "border-amber-600/25",  bar: "bg-amber-600",  icon: Shield },
  { label: "SILVER",   min: 1500,  color: "text-slate-400",  bg: "bg-slate-400/10",  border: "border-slate-400/25",  bar: "bg-slate-400",  icon: Star   },
  { label: "GOLD",     min: 3000,  color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/25", bar: "bg-yellow-500", icon: Trophy },
  { label: "PLATINUM", min: 6000,  color: "text-cyan-500",   bg: "bg-cyan-500/10",   border: "border-cyan-500/25",   bar: "bg-cyan-500",   icon: Flame  },
  { label: "DIAMOND",  min: 10000, color: "text-violet-400", bg: "bg-violet-400/10", border: "border-violet-400/25", bar: "bg-violet-400", icon: Zap    },
] as const;

type Rank = typeof RANKS[number];

function getRank(score: number): Rank & { next: Rank | null; progress: number } {
  let current: Rank = RANKS[0];
  for (const r of RANKS) {
    if (score >= r.min) current = r;
  }
  const idx      = RANKS.indexOf(current as Rank);
  const next     = (RANKS[idx + 1] as Rank) ?? null;
  const progress = next
    ? Math.min(100, ((score - current.min) / (next.min - current.min)) * 100)
    : 100;
  return { ...current, next, progress };
}

export function GlobalScoreCard({ score, username }: Props) {
  const rank = getRank(score);
  const Icon = rank.icon;

  return (
    <motion.div
      className={`relative border-2 ${rank.border} bg-card overflow-hidden h-full flex flex-col shadow-[2px_2px_0_0_hsl(var(--foreground)/0.06)]`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Top rank accent */}
      <div className={`h-1 w-full ${rank.bar}`} />

      <div className="p-6 md:p-7 flex flex-col gap-6 flex-1">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-[9px] font-black uppercase tracking-[0.32em] text-foreground/45">
              Logic Points
            </span>
            {username && (
              <p className="text-sm font-mono font-medium text-foreground/70 truncate">{username}</p>
            )}
          </div>
          <motion.div
            className={`flex items-center gap-2 px-3 py-2 border-2 ${rank.border} ${rank.bg} shrink-0`}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <Icon className={`w-4 h-4 ${rank.color}`} />
            <span className={`text-[10px] font-black uppercase tracking-widest ${rank.color}`}>
              {rank.label}
            </span>
          </motion.div>
        </div>

        {/* Score */}
        <div className="flex items-baseline gap-2">
          <motion.span
            className={`text-4xl md:text-5xl font-black font-mono tracking-tighter leading-none ${rank.color}`}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {score.toLocaleString()}
          </motion.span>
          <span className="text-sm font-black uppercase tracking-widest text-foreground/35 mb-0.5">LP</span>
        </div>

        {/* Progress to next rank */}
        <div className="flex flex-col gap-2.5 mt-auto pt-1">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-mono uppercase tracking-widest text-foreground/35">
              {rank.next ? `– ${rank.next.label}` : "MAX RANK"}
            </span>
            {rank.next && (
              <span className="text-[9px] font-mono font-semibold text-foreground/50">
                {(rank.next.min - score).toLocaleString()} LP to go
              </span>
            )}
          </div>

          <div className="h-2.5 w-full bg-foreground/[0.07] border border-foreground/10 rounded-sm overflow-hidden">
            <motion.div
              className={`h-full ${rank.bar} rounded-sm relative min-w-[4px]`}
              initial={{ width: "0%" }}
              animate={{ width: `${rank.progress}%` }}
              transition={{ delay: 0.25, duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                className="absolute inset-0 bg-white/25 rounded-sm"
                animate={{ x: ["-100%", "150%"] }}
                transition={{ repeat: Infinity, duration: 2.2, ease: "linear", repeatDelay: 0.5 }}
              />
            </motion.div>
          </div>

          <div className="flex justify-between text-[9px] font-mono text-foreground/25">
            <span>{rank.min.toLocaleString()}</span>
            {rank.next && <span>{rank.next.min.toLocaleString()}</span>}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
