"use client";

import { motion }                             from "framer-motion";
import { Trophy, Zap, Shield, Flame, Star }   from "lucide-react";

interface Props {
  score:     number;
  username?: string;
}

const RANKS = [
  { label: "ROOKIE",   min: 0,     color: "text-zinc-400",   bg: "bg-zinc-400/10",   border: "border-zinc-400/30",   icon: Shield, glow: ""                    },
  { label: "BRONZE",   min: 500,   color: "text-amber-600",  bg: "bg-amber-600/10",  border: "border-amber-600/30",  icon: Shield, glow: "shadow-amber-700/10" },
  { label: "SILVER",   min: 1500,  color: "text-slate-300",  bg: "bg-slate-300/10",  border: "border-slate-300/30",  icon: Star,   glow: "shadow-slate-400/10" },
  { label: "GOLD",     min: 3000,  color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/30", icon: Trophy, glow: "shadow-yellow-500/20" },
  { label: "PLATINUM", min: 6000,  color: "text-cyan-400",   bg: "bg-cyan-400/10",   border: "border-cyan-400/30",   icon: Flame,  glow: "shadow-cyan-500/20"  },
  { label: "DIAMOND",  min: 10000, color: "text-violet-400", bg: "bg-violet-400/10", border: "border-violet-400/30", icon: Zap,    glow: "shadow-violet-500/20" },
];

type Rank = typeof RANKS[number];

function getRank(score: number): Rank & { next: Rank | null; progress: number } {
  let current: Rank = RANKS[0]!;
  for (const r of RANKS) {
    if (score >= r.min) current = r;
  }
  const idx      = RANKS.indexOf(current);
  const next     = RANKS[idx + 1] ?? null;
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
      className={`relative border-2 ${rank.border} bg-card overflow-hidden`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Top accent line */}
      <div className={`h-0.5 w-full ${rank.bg}`} />

      <div className="p-6 flex flex-col gap-5">
        {/* Header row */}
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-foreground/40">
              Logic Points
            </span>
            {username && (
              <p className="text-xs font-mono text-muted-foreground mt-0.5">{username}</p>
            )}
          </div>

          <div className={`flex items-center gap-1.5 px-3 py-1.5 border-2 ${rank.border} ${rank.bg}`}>
            <Icon className={`w-3 h-3 ${rank.color}`} />
            <span className={`text-[9px] font-black uppercase tracking-widest ${rank.color}`}>
              {rank.label}
            </span>
          </div>
        </div>

        {/* Score */}
        <div className="flex items-end gap-2">
          <motion.span
            className={`text-5xl font-black font-mono tracking-tighter leading-none ${rank.color}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.35 }}
          >
            {score.toLocaleString()}
          </motion.span>
          <span className="text-sm font-black uppercase tracking-widest text-foreground/30 mb-1">LP</span>
        </div>

        {/* Progress bar */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between">
            <span className="text-[9px] font-mono uppercase tracking-widest text-foreground/30">
              {rank.next ? `Next: ${rank.next.label}` : "MAX RANK"}
            </span>
            {rank.next && (
              <span className="text-[9px] font-mono text-foreground/30">
                {(rank.next.min - score).toLocaleString()} LP away
              </span>
            )}
          </div>
          <div className="h-1.5 w-full bg-foreground/10 border border-foreground/10">
            <motion.div
              className={`h-full ${rank.bg} border-r ${rank.border}`}
              initial={{ width: "0%" }}
              animate={{ width: `${rank.progress}%` }}
              transition={{ delay: 0.25, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
