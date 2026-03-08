"use client";

import { useGameStore } from "@/store/game-store";
import { Flame, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

/**
 * Shown between survival rounds (after SURVIVAL_CONTINUE, before next ROUND_START).
 * Shows streak, +30s bonus, and "Finding next opponent...".
 */
export function SurvivalTransition() {
    const survivalActive = useGameStore((s) => s.survivalActive);
    const survivalStreak = useGameStore((s) => s.survivalStreak);
    const sessionStatus = useGameStore((s) => s.sessionStatus);
    const challenge = useGameStore((s) => s.challenge);

    // Show when we're in survival and waiting for next round (no challenge yet or still in LOBBY)
    const show = survivalActive && (sessionStatus === "LOBBY" || !challenge);

    if (!show) return null;

    return (
        <motion.div
            className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-6 bg-background/95 backdrop-blur-sm border-2 border-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
        >
            <motion.div
                className="flex flex-col items-center gap-2"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
            >
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/60">
                    Streak
                </span>
                <div className="flex items-center gap-2">
                    <Flame className="size-8 text-amber-500" />
                    <span className="font-mono font-black text-4xl text-amber-600">
                        {survivalStreak}
                    </span>
                </div>
            </motion.div>
            <motion.div
                className="rounded-lg bg-emerald-500/20 border-2 border-emerald-500/50 px-4 py-2"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <span className="text-sm font-black uppercase tracking-wider text-emerald-600">
                    +30s bonus
                </span>
            </motion.div>
            <motion.div
                className="flex items-center gap-2 text-foreground/70"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                <Loader2 className="size-4 animate-spin" />
                <span className="text-xs font-medium uppercase tracking-widest">
                    Finding next opponent…
                </span>
            </motion.div>
        </motion.div>
    );
}
