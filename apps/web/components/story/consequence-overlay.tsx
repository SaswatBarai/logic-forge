"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Sword, Skull, AlertTriangle, Zap } from "lucide-react";
import type { ConsequencePayload } from "@/store/story-store";
import { useStoryStore } from "@/store/story-store";
import { useStorySFX } from "@/components/story/story-sfx-context";

const AUTO_DISMISS_MS = 3200;

export interface ConsequenceOverlayProps {
  payload: ConsequencePayload;
  onDismiss: () => void;
}

export function ConsequenceOverlay({ payload, onDismiss }: ConsequenceOverlayProps) {
  const sfx = useStorySFX();
  const { streakXpBonus, actStreakWithoutScar } = useStoryStore();

  useEffect(() => {
    if (payload.xp) sfx.play("xpGain");
    if (payload.scar) {
      sfx.play("scarGained");
      if (actStreakWithoutScar === 0) sfx.play("streakBroken");
    }
    if (payload.debt) sfx.play("debtPlanted");
  }, [payload, sfx, actStreakWithoutScar]);

  useEffect(() => {
    const t = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-center justify-center p-6 bg-black/60"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="rounded-xl border-2 border-primary/40 p-6 max-w-md w-full space-y-4 bg-card shadow-retro"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.25 }}
      >
        {payload.xp !== undefined && payload.xp > 0 && (
          <motion.div
            className="flex items-center gap-3 text-primary"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Sword className="size-6 shrink-0" />
            <div>
              <span className="font-story-title font-semibold text-lg">+{payload.xp} XP</span>
              {streakXpBonus !== null && streakXpBonus > 0 && (
                <span className="ml-2 text-xs font-mono text-accent">
                  (+{streakXpBonus} streak bonus)
                </span>
              )}
            </div>
          </motion.div>
        )}

        {payload.scar && (
          <motion.div
            className="flex items-start gap-3 text-destructive"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Skull className="size-6 shrink-0 mt-0.5" />
            <div>
              <p className="font-story-title font-semibold">SCAR GAINED</p>
              <p className="font-story-body text-sm mt-0.5 opacity-90">{payload.scar.name}</p>
              <p className="text-xs opacity-75 mt-1">{payload.scar.description}</p>
              {actStreakWithoutScar === 0 && (
                <motion.p
                  className="text-xs font-mono mt-2 text-destructive"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0.6] }}
                  transition={{ duration: 0.5 }}
                >
                  Streak Broken!
                </motion.p>
              )}
            </div>
          </motion.div>
        )}

        {payload.debt && (
          <motion.div
            className="flex items-start gap-3 text-primary"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <AlertTriangle className="size-6 shrink-0 mt-0.5" />
            <div>
              <p className="font-story-title font-semibold">DEBT PLANTED</p>
              <p className="font-story-body text-sm mt-0.5 opacity-90">{payload.debt.name}</p>
              <p className="text-xs opacity-75 mt-1">Triggers at: {payload.debt.triggersAt}</p>
            </div>
          </motion.div>
        )}

        <motion.button
          type="button"
          onClick={onDismiss}
          className="w-full mt-4 py-2 rounded border border-primary/60 text-primary bg-primary/10 font-mono text-xs uppercase tracking-wider hover:bg-primary/20 transition-colors"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Continue
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
