"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Trophy } from "lucide-react";
import { useStoryStore } from "@/store/story-store";
import { ZONE_META } from "@/components/story/world-map";
import { STORY_ACHIEVEMENTS } from "@/lib/story-data";
import { useStorySFX } from "@/components/story/story-sfx-context";

type Phase = "title" | "stats" | "achievements" | "mastery";

function getPerformanceTitle(zone: string, scarCount: number): string {
  const names: Record<string, [string, string, string]> = {
    ARCHIVE_CITADEL: ["Legend of the Archive", "Survivor of the Archive", "The Scarred Scholar"],
    FORGE_VILLAGE: ["Iron Heart", "Forge Walker", "The Scarred Scholar"],
    WALL_OF_GATES: ["Gate Keeper", "Wall Runner", "The Scarred Scholar"],
  };
  const set = names[zone] ?? ["Champion", "Survivor", "The Scarred"];
  if (scarCount === 0) return set[0];
  if (scarCount <= 2) return set[1];
  return set[2];
}

function getMasteryStars(xp: number, maxXp: number): number {
  if (maxXp <= 0) return 1;
  const pct = xp / maxXp;
  if (pct >= 0.95) return 5;
  if (pct >= 0.8) return 4;
  if (pct >= 0.6) return 3;
  if (pct >= 0.4) return 2;
  return 1;
}

export interface ZoneCompleteScreenProps {
  onReturnToMap: () => void;
}

export function ZoneCompleteScreen({ onReturnToMap }: ZoneCompleteScreenProps) {
  const {
    zone,
    rank,
    xp,
    scars,
    debts,
    energyMeter,
    allTier1,
    zoneCompletion,
    achievements,
    setZoneCompleted,
    unlockAchievement,
  } = useStoryStore();

  const sfx = useStorySFX();
  const [phase, setPhase] = useState<Phase>("title");
  const [countXp, setCountXp] = useState(0);
  const [newAchievements, setNewAchievements] = useState<string[]>([]);

  const meta = zone ? ZONE_META.find((z) => z.id === zone) : null;
  const title = meta?.title ?? zone ?? "Zone";
  const perfTitle = getPerformanceTitle(zone ?? "", scars.length);
  const maxXp = 600;
  const stars = getMasteryStars(xp, maxXp);

  useEffect(() => {
    sfx.play("zoneComplete");
  }, [sfx]);

  useEffect(() => {
    if (phase === "title") {
      const t = setTimeout(() => setPhase("stats"), 1800);
      return () => clearTimeout(t);
    }
    if (phase === "stats") {
      const t = setTimeout(() => setPhase("achievements"), 2500);
      return () => clearTimeout(t);
    }
    if (phase === "achievements") {
      const t = setTimeout(() => setPhase("mastery"), 2500);
      return () => clearTimeout(t);
    }
  }, [phase]);

  // XP count-up animation
  useEffect(() => {
    if (phase !== "stats") return;
    const duration = 1500;
    const start = Date.now();
    const iv = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(1, elapsed / duration);
      setCountXp(Math.round(pct * xp));
      if (pct >= 1) clearInterval(iv);
    }, 30);
    return () => clearInterval(iv);
  }, [phase, xp]);

  // Check achievements on mount
  useEffect(() => {
    const earned: string[] = [];

    if (zone === "ARCHIVE_CITADEL" && scars.length === 0 && !achievements.includes("index_master")) {
      unlockAchievement("index_master");
      earned.push("index_master");
    }
    if (zone === "FORGE_VILLAGE" && (energyMeter ?? 0) > 50 && !achievements.includes("deadlock_breaker")) {
      unlockAchievement("deadlock_breaker");
      earned.push("deadlock_breaker");
    }
    if (zone === "WALL_OF_GATES" && debts.filter((d) => d.triggersAt.toLowerCase().includes("boss")).length === 0 && !achievements.includes("gate_defender")) {
      unlockAchievement("gate_defender");
      earned.push("gate_defender");
    }
    if (allTier1 && !achievements.includes("perfect_run")) {
      unlockAchievement("perfect_run");
      earned.push("perfect_run");
    }

    const otherCompleted = Object.entries(zoneCompletion).filter(([k, v]) => k !== zone && v === "completed").length;
    if (otherCompleted >= 2 && !achievements.includes("ironclad")) {
      unlockAchievement("ironclad");
      earned.push("ironclad");
    }

    setNewAchievements(earned);
  }, []);

  const handleReturn = () => {
    if (zone) setZoneCompleted(zone);
    onReturnToMap();
  };

  return (
    <motion.div
      className="fixed inset-0 z-40 flex flex-col items-center justify-center p-8 bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="max-w-md w-full space-y-6 text-center">
        <AnimatePresence mode="wait">
          {/* Phase 1: Title */}
          {phase === "title" && (
            <motion.div
              key="title"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="space-y-3"
            >
              <Trophy className="size-12 mx-auto text-primary" />
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary">
                Zone Complete
              </p>
              <h1 className="font-story-title text-3xl font-bold text-foreground">
                {perfTitle}
              </h1>
              <p className="text-sm text-muted-foreground">{title}</p>
            </motion.div>
          )}

          {/* Phase 2: Stats count-up */}
          {phase === "stats" && (
            <motion.div
              key="stats"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <p className="text-[10px] font-mono uppercase tracking-widest text-primary">
                Battle Report
              </p>
              <div className="rounded-xl border-2 border-primary/40 p-6 bg-card shadow-retro space-y-4">
                <div className="grid grid-cols-2 gap-4 text-left text-sm">
                  <motion.div
                    className="px-3 py-2 rounded border border-border"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <span className="text-[9px] font-mono uppercase text-muted-foreground">Final Rank</span>
                    <p className="font-story-title font-semibold text-foreground">{rank}</p>
                  </motion.div>
                  <motion.div
                    className="px-3 py-2 rounded border border-border"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <span className="text-[9px] font-mono uppercase text-muted-foreground">Total XP</span>
                    <p className="font-story-title font-semibold text-primary">{countXp}</p>
                  </motion.div>
                  <motion.div
                    className="px-3 py-2 rounded border border-border"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <span className="text-[9px] font-mono uppercase text-muted-foreground">Scars</span>
                    <p className={`font-story-title font-semibold ${scars.length > 0 ? "text-destructive" : "text-foreground"}`}>
                      {scars.length}
                    </p>
                  </motion.div>
                  <motion.div
                    className="px-3 py-2 rounded border border-border"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <span className="text-[9px] font-mono uppercase text-muted-foreground">Debts</span>
                    <p className="font-story-title font-semibold text-foreground">{debts.length}</p>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Phase 3: Achievements */}
          {phase === "achievements" && (
            <motion.div
              key="achievements"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {newAchievements.length > 0 ? (
                <>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-primary">
                    Achievements Unlocked!
                  </p>
                  <div className="space-y-3">
                    {newAchievements.map((id, i) => {
                      const ach = STORY_ACHIEVEMENTS.find((a) => a.id === id);
                      if (!ach) return null;
                      const AchIcon = ach.icon;
                      return (
                        <motion.div
                          key={id}
                          className="flex items-center gap-3 p-4 rounded-lg border-2 border-primary/40 bg-primary/5"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.3 }}
                        >
                          <AchIcon className="size-6 text-primary shrink-0" />
                          <div className="text-left">
                            <p className="font-story-title font-semibold text-sm text-foreground">{ach.title}</p>
                            <p className="text-xs text-muted-foreground">{ach.desc}</p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="py-6">
                  <p className="text-sm text-muted-foreground">No new achievements this run.</p>
                  <p className="text-xs text-muted-foreground mt-1">Try for a perfect run next time!</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Phase 4: Mastery rating + return */}
          {phase === "mastery" && (
            <motion.div
              key="mastery"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <p className="text-[10px] font-mono uppercase tracking-widest text-primary">
                Mastery Rating
              </p>
              <div className="flex items-center justify-center gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.15, type: "spring" }}
                  >
                    <Star
                      className={`size-8 ${i < stars ? "text-primary fill-primary" : "text-muted-foreground/30"}`}
                    />
                  </motion.div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {stars >= 5
                  ? "Legendary mastery. Flawless."
                  : stars >= 4
                    ? "Impressive command."
                    : stars >= 3
                      ? "Solid performance."
                      : "Room to grow."}
              </p>
              <motion.button
                type="button"
                onClick={handleReturn}
                className="w-full py-3 rounded-lg border-2 border-primary text-primary bg-primary/10 font-story-title font-semibold text-sm uppercase tracking-wider hover:bg-primary/20 transition-colors shadow-retro-sm"
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                Return to Map
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
