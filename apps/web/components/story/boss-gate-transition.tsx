"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Skull, Shield, Cog, Waves, Zap } from "lucide-react";
import type { Debt, StoryZone } from "@/store/story-store";
import { useStorySFX } from "@/components/story/story-sfx-context";

const BOSS_META: Record<string, { name: string; title: string; icon: React.ElementType }> = {
  ARCHIVE_CITADEL: { name: "Nullus", title: "The Dread Wyrm", icon: Skull },
  FORGE_VILLAGE: { name: "Deadlock", title: "The Iron Golem", icon: Cog },
  WALL_OF_GATES: { name: "Overflow", title: "The Shadow Mob", icon: Waves },
};

export interface BossGateTransitionProps {
  title: string;
  zone?: StoryZone;
  debtsTriggering?: Debt[];
  onDismiss: () => void;
}

type Phase = "intro" | "debuffs" | "ready";

export function BossGateTransition({
  title,
  zone,
  debtsTriggering = [],
  onDismiss,
}: BossGateTransitionProps) {
  const sfx = useStorySFX();
  const [phase, setPhase] = useState<Phase>("intro");
  const [shownDebts, setShownDebts] = useState(0);
  const boss = zone ? BOSS_META[zone] : null;
  const BossIcon = boss?.icon ?? Shield;

  useEffect(() => {
    sfx.play("bossAppear");
  }, [sfx]);

  useEffect(() => {
    if (phase === "intro") {
      const t = setTimeout(() => {
        if (debtsTriggering.length > 0) {
          setPhase("debuffs");
        } else {
          setPhase("ready");
        }
      }, 2500);
      return () => clearTimeout(t);
    }
    if (phase === "debuffs") {
      if (shownDebts < debtsTriggering.length) {
        const t = setTimeout(() => setShownDebts((p) => p + 1), 800);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setPhase("ready"), 1200);
      return () => clearTimeout(t);
    }
    if (phase === "ready") {
      const t = setTimeout(onDismiss, 1800);
      return () => clearTimeout(t);
    }
  }, [phase, shownDebts, debtsTriggering.length, onDismiss]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Boss portrait zone */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-destructive/10 via-transparent to-destructive/5"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </div>

      <AnimatePresence mode="wait">
        {phase === "intro" && (
          <motion.div
            key="intro"
            className="relative z-10 text-center space-y-4"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="mx-auto w-24 h-24 rounded-2xl border-2 border-destructive/50 bg-destructive/10 flex items-center justify-center text-destructive"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <BossIcon className="size-12" />
            </motion.div>
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-destructive">
              Boss Gate
            </p>
            <h1 className="font-story-title text-3xl sm:text-4xl font-bold text-foreground">
              {boss?.name ?? "Boss"}
            </h1>
            <p className="font-story-title text-lg text-muted-foreground">
              {boss?.title ?? title}
            </p>
          </motion.div>
        )}

        {phase === "debuffs" && (
          <motion.div
            key="debuffs"
            className="relative z-10 text-center space-y-6 max-w-md w-full px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-destructive mb-4">
              Debts Activate
            </p>
            <div className="space-y-3">
              {debtsTriggering.slice(0, shownDebts).map((d, i) => (
                <motion.div
                  key={d.name}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg border border-destructive/40 bg-destructive/5 text-left"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.3 }}
                >
                  <AlertTriangle className="size-5 shrink-0 text-destructive" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{d.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Timer reduced by 5s
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {phase === "ready" && (
          <motion.div
            key="ready"
            className="relative z-10 text-center space-y-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="mx-auto w-16 h-16 rounded-xl border-2 border-primary/50 bg-primary/10 flex items-center justify-center text-primary"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 0.5, repeat: 2 }}
            >
              <Zap className="size-8" />
            </motion.div>
            <p className="font-story-title text-xl font-bold text-foreground">
              Prepare for Combat
            </p>
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
              Counter the boss&apos;s attack!
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tension bar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-64">
        <div className="h-2 rounded-full overflow-hidden bg-muted">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-destructive to-red-400"
            initial={{ width: "100%" }}
            animate={{ width: phase === "ready" ? "100%" : "100%" }}
          />
        </div>
        <p className="text-center text-[8px] font-mono text-muted-foreground mt-1 uppercase tracking-wider">
          Boss Tension
        </p>
      </div>
    </motion.div>
  );
}
