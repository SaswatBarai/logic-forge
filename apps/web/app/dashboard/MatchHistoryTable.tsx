"use client";

import { motion }                              from "framer-motion";
import { Trophy, X, Minus, CheckCircle2, Zap, Users, BookOpen } from "lucide-react";
import { format }                              from "date-fns";

export interface MatchRecord {
  id:          string;
  gameMode:    "ARCADE_SINGLE" | "ARCADE_DUAL" | "STORY";
  outcome:     "WIN" | "LOSS" | "DRAW" | "COMPLETED";
  scoreEarned: number;
  createdAt:   string;
  stats:       Record<string, unknown>;
}

const MODE: Record<MatchRecord["gameMode"], { label: string; icon: React.ElementType; color: string }> = {
  ARCADE_SINGLE: { label: "Solo Run",    icon: Zap,      color: "text-primary"   },
  ARCADE_DUAL:   { label: "Dual Engine", icon: Users,    color: "text-accent"    },
  STORY:         { label: "Story Mode",  icon: BookOpen, color: "text-cyan-400"  },
};

const OUTCOME: Record<MatchRecord["outcome"], { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  WIN:       { label: "WIN",       icon: Trophy,       color: "text-yellow-400",  bg: "bg-yellow-400/10",  border: "border-yellow-400/30"  },
  LOSS:      { label: "LOSS",      icon: X,            color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30" },
  DRAW:      { label: "DRAW",      icon: Minus,        color: "text-zinc-400",    bg: "bg-zinc-400/10",    border: "border-zinc-400/30"    },
  COMPLETED: { label: "DONE",      icon: CheckCircle2, color: "text-accent",      bg: "bg-accent/10",      border: "border-accent/30"      },
};

export function MatchHistoryTable({ records }: { records: MatchRecord[] }) {
  if (records.length === 0) {
    return (
      <div className="border-2 border-foreground/20 bg-card py-16 flex flex-col items-center gap-3">
        <Zap className="w-7 h-7 text-foreground/20" />
        <p className="text-xs font-black uppercase tracking-widest text-foreground/30">No matches yet</p>
        <p className="text-[10px] font-mono text-foreground/20">Play your first game to start building your record.</p>
      </div>
    );
  }

  return (
    <div className="border-2 border-foreground/20 bg-card overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-12 px-4 py-2.5 bg-foreground/5 border-b-2 border-foreground/10">
        {[
          { label: "Date",      span: "col-span-4" },
          { label: "Mode",      span: "col-span-3" },
          { label: "Outcome",   span: "col-span-3" },
          { label: "LP",        span: "col-span-2 text-right" },
        ].map(h => (
          <span key={h.label} className={`text-[9px] font-black uppercase tracking-[0.25em] text-foreground/30 ${h.span}`}>
            {h.label}
          </span>
        ))}
      </div>

      {/* Rows */}
      <div className="divide-y divide-foreground/5">
        {records.map((r, i) => {
          const mode    = MODE[r.gameMode];
          const outcome = OUTCOME[r.outcome];
          const MIcon   = mode.icon;
          const OIcon   = outcome.icon;
          const pos     = r.scoreEarned >= 0;

          return (
            <motion.div
              key={r.id}
              className="grid grid-cols-12 px-4 py-3 items-center hover:bg-foreground/5 transition-colors"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03, duration: 0.2 }}
            >
              {/* Date */}
              <div className="col-span-4 flex flex-col gap-0.5">
                <span className="text-xs font-mono text-foreground/70">
                  {format(new Date(r.createdAt), "MMM dd, yyyy")}
                </span>
                <span className="text-[10px] font-mono text-foreground/30">
                  {format(new Date(r.createdAt), "HH:mm")}
                </span>
              </div>

              {/* Mode */}
              <div className="col-span-3 flex items-center gap-1.5">
                <MIcon className={`w-3.5 h-3.5 shrink-0 ${mode.color}`} />
                <span className={`text-[10px] font-bold uppercase tracking-wide ${mode.color}`}>
                  {mode.label}
                </span>
              </div>

              {/* Outcome badge */}
              <div className="col-span-3">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 border text-[9px] font-black uppercase tracking-widest ${outcome.color} ${outcome.bg} ${outcome.border}`}>
                  <OIcon className="w-2.5 h-2.5" />
                  {outcome.label}
                </span>
              </div>

              {/* LP */}
              <div className="col-span-2 text-right">
                <span className={`text-sm font-black font-mono ${pos ? "text-accent" : "text-destructive"}`}>
                  {pos ? "+" : ""}{r.scoreEarned}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
