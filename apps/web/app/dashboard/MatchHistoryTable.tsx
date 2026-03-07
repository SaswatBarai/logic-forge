"use client";

import { motion }                                              from "framer-motion";
import { Trophy, X, Minus, CheckCircle2, Zap, Users, BookOpen } from "lucide-react";
import { format }                                              from "date-fns";

export interface MatchRecord {
  id:          string;
  gameMode:    "ARCADE_SINGLE" | "ARCADE_DUAL" | "STORY";
  outcome:     "WIN" | "LOSS" | "DRAW" | "COMPLETED";
  scoreEarned: number;
  createdAt:   string;
  stats:       Record<string, unknown>;
}

const MODE: Record<
  MatchRecord["gameMode"],
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  ARCADE_SINGLE: { label: "Solo Run",    icon: Zap,      color: "text-primary",    bg: "bg-primary/8"   },
  ARCADE_DUAL:   { label: "Dual Engine", icon: Users,    color: "text-accent",     bg: "bg-accent/8"    },
  STORY:         { label: "Story Mode",  icon: BookOpen, color: "text-cyan-400",   bg: "bg-cyan-400/8"  },
};

const OUTCOME: Record<
  MatchRecord["outcome"],
  { label: string; icon: React.ElementType; color: string; bg: string; border: string }
> = {
  WIN:       { label: "WIN",  icon: Trophy,       color: "text-yellow-400",  bg: "bg-yellow-400/10",  border: "border-yellow-400/30"  },
  LOSS:      { label: "LOSS", icon: X,            color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30" },
  DRAW:      { label: "DRAW", icon: Minus,        color: "text-zinc-400",    bg: "bg-zinc-400/10",    border: "border-zinc-400/30"    },
  COMPLETED: { label: "DONE", icon: CheckCircle2, color: "text-accent",      bg: "bg-accent/10",      border: "border-accent/30"      },
};

function StatsBlurb({ gameMode, stats }: { gameMode: MatchRecord["gameMode"]; stats: Record<string, unknown> }) {
  if (gameMode === "ARCADE_SINGLE") {
    const correct = stats.correctAnswers as number;
    const total   = stats.totalRounds   as number;
    if (correct != null && total != null) {
      return (
        <span className="text-[9px] font-mono text-foreground/30">
          {correct}/{total} correct
        </span>
      );
    }
  }
  if (gameMode === "ARCADE_DUAL") {
    const my  = stats.myScore       as number;
    const opp = stats.opponentScore as number;
    if (my != null && opp != null) {
      return (
        <span className="text-[9px] font-mono text-foreground/30">
          {my} — {opp}
        </span>
      );
    }
  }
  if (gameMode === "STORY") {
    const done  = stats.challengesDone  as number;
    const total = stats.totalChallenges as number;
    if (done != null && total != null) {
      return (
        <span className="text-[9px] font-mono text-foreground/30">
          {done}/{total} challenges
        </span>
      );
    }
  }
  return null;
}

export function MatchHistoryTable({ records }: { records: MatchRecord[] }) {
  if (records.length === 0) return null;

  return (
    <div className="border-2 border-foreground/20 bg-card overflow-hidden">

      {/* Table header */}
      <div className="grid grid-cols-12 px-5 py-3 bg-foreground/5 border-b-2 border-foreground/10">
        {[
          { label: "Date",    span: "col-span-4" },
          { label: "Mode",    span: "col-span-3" },
          { label: "Result",  span: "col-span-3" },
          { label: "LP",      span: "col-span-2 text-right" },
        ].map(h => (
          <span
            key={h.label}
            className={`text-[9px] font-black uppercase tracking-[0.25em] text-foreground/30 ${h.span}`}
          >
            {h.label}
          </span>
        ))}
      </div>

      {/* Rows */}
      <div>
        {records.map((r, i) => {
          const mode    = MODE[r.gameMode];
          const outcome = OUTCOME[r.outcome];
          const MIcon   = mode.icon;
          const OIcon   = outcome.icon;
          const positive = r.scoreEarned >= 0;

          return (
            <motion.div
              key={r.id}
              className={`
                grid grid-cols-12 px-5 py-3.5 items-center
                border-b border-foreground/5 last:border-0
                transition-colors duration-150
                ${i % 2 === 0 ? "bg-transparent" : "bg-foreground/[0.02]"}
                hover:bg-foreground/5
              `}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.025, duration: 0.22 }}
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
              <div className="col-span-3 flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  <MIcon className={`w-3 h-3 shrink-0 ${mode.color}`} />
                  <span className={`text-[10px] font-bold uppercase tracking-wide ${mode.color}`}>
                    {mode.label}
                  </span>
                </div>
                <StatsBlurb gameMode={r.gameMode} stats={r.stats} />
              </div>

              {/* Outcome badge */}
              <div className="col-span-3">
                <span
                  className={`
                    inline-flex items-center gap-1 px-2 py-0.5 border
                    text-[9px] font-black uppercase tracking-widest
                    ${outcome.color} ${outcome.bg} ${outcome.border}
                  `}
                >
                  <OIcon className="w-2.5 h-2.5" />
                  {outcome.label}
                </span>
              </div>

              {/* LP delta */}
              <div className="col-span-2 text-right">
                <motion.span
                  className={`text-sm font-black font-mono tabular-nums ${
                    positive ? "text-accent" : "text-destructive"
                  }`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.025 + 0.1 }}
                >
                  {positive ? "+" : ""}{r.scoreEarned}
                </motion.span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      {records.length >= 50 && (
        <div className="px-5 py-3 border-t border-foreground/10 bg-foreground/5">
          <p className="text-[9px] font-mono text-foreground/30 text-center uppercase tracking-widest">
            Showing last 50 matches
          </p>
        </div>
      )}
    </div>
  );
}
