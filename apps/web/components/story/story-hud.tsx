"use client";

import { motion } from "framer-motion";
import { Sword, Skull, AlertTriangle, Zap, Flame } from "lucide-react";
import { useStoryStore, RANK_THRESHOLDS } from "@/store/story-store";

const ZONE_LABELS: Record<string, string> = {
  ARCHIVE_CITADEL: "The Archive Citadel",
  FORGE_VILLAGE: "The Forge Village",
  WALL_OF_GATES: "The Wall of Gates",
};

function getXpProgress(xp: number): { current: number; nextThreshold: number; percent: number } {
  let nextThreshold = RANK_THRESHOLDS[RANK_THRESHOLDS.length - 1]![0];
  let segmentStart = 0;
  for (let i = 0; i < RANK_THRESHOLDS.length; i++) {
    const [t] = RANK_THRESHOLDS[i]!;
    if (xp < t) {
      nextThreshold = t;
      segmentStart = RANK_THRESHOLDS[i - 1]?.[0] ?? 0;
      break;
    }
  }
  const percent =
    nextThreshold > segmentStart ? ((xp - segmentStart) / (nextThreshold - segmentStart)) * 100 : 100;
  return { current: xp, nextThreshold, percent: Math.min(100, Math.max(0, percent)) };
}

export function StoryHud() {
  const {
    zone,
    act,
    xp,
    rank,
    scars,
    debts,
    energyMeter,
    actStreakWithoutScar,
    bossHealth,
    bossPhase,
  } = useStoryStore();
  const xpProgress = getXpProgress(xp);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-b border-border bg-card z-20 relative shadow-retro-sm">
      {/* Left: Zone + Act */}
      <div className="flex items-center gap-3">
        <span className="font-story-title font-semibold text-sm text-foreground">
          {zone ? ZONE_LABELS[zone] ?? zone : "—"}
        </span>
        {zone && (
          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border border-primary/50 text-primary">
            ACT {act}
          </span>
        )}
        {actStreakWithoutScar >= 2 && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded border border-accent/50 bg-accent/10">
            <Flame className="size-3 text-accent" />
            <span className="text-[9px] font-mono font-bold text-accent">
              {actStreakWithoutScar}
            </span>
          </div>
        )}
      </div>

      {/* Center: XP bar + Rank badge + Boss health */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 min-w-[120px]">
          <Sword className="size-3.5 shrink-0 text-primary" />
          <div className="flex-1 min-w-0">
            <div className="h-2 rounded-full overflow-hidden bg-muted">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-accent to-primary shadow-[0_0_12px_hsl(var(--primary)/0.3)]"
                initial={false}
                animate={{ width: `${xpProgress.percent}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-[9px] font-mono mt-0.5 text-muted-foreground">
              {xp} / {xpProgress.nextThreshold} XP
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-primary/60 text-primary shrink-0 shadow-[0_0_14px_hsl(var(--primary)/0.15)]">
          <Zap className="size-3" />
          <span className="text-[10px] font-mono uppercase tracking-wider font-bold">{rank}</span>
        </div>

        {/* Boss health bar */}
        {bossPhase === "combat" && bossHealth !== null && (
          <div className="flex items-center gap-2 min-w-[80px]">
            <Skull className="size-3.5 shrink-0 text-destructive" />
            <div className="flex-1 min-w-0">
              <div className="h-2 rounded-full overflow-hidden bg-muted">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-red-600 to-destructive"
                  animate={{ width: `${bossHealth}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-[9px] font-mono mt-0.5 text-destructive">
                Boss {bossHealth}%
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Right: Scars, Debts, Energy */}
      <div className="flex items-center gap-4">
        {zone === "FORGE_VILLAGE" && energyMeter !== null && (
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono uppercase text-muted-foreground">Energy</span>
            <div className="w-20 h-2 rounded-full overflow-hidden bg-muted">
              <motion.div
                className={`h-full rounded-full ${
                  energyMeter > 70
                    ? "bg-accent"
                    : energyMeter > 40
                      ? "bg-primary"
                      : energyMeter > 20
                        ? "bg-yellow-500"
                        : "bg-destructive animate-pulse"
                }`}
                animate={{ width: `${energyMeter}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className={`text-[9px] font-mono w-8 ${energyMeter <= 20 ? "text-destructive font-bold" : "text-foreground/80"}`}>
              {energyMeter}%
            </span>
          </div>
        )}

        <div
          className="flex items-center gap-1.5"
          title={scars.length > 0 ? scars.map((s) => s.name).join(", ") : "No scars"}
        >
          <Skull className={`size-3.5 shrink-0 ${scars.length > 0 ? "text-destructive" : "text-muted-foreground"}`} />
          <span className={`text-[10px] font-mono font-bold ${scars.length > 0 ? "text-destructive" : "text-muted-foreground"}`}>
            {scars.length}
          </span>
        </div>

        <div
          className="flex items-center gap-1.5"
          title={debts.length > 0 ? debts.map((d) => d.name).join(", ") : "No debts"}
        >
          <AlertTriangle className={`size-3.5 shrink-0 ${debts.length > 0 ? "text-primary" : "text-muted-foreground"}`} />
          <span className={`text-[10px] font-mono font-bold ${debts.length > 0 ? "text-primary" : "text-muted-foreground"}`}>
            {debts.length}
          </span>
        </div>
      </div>
    </div>
  );
}
