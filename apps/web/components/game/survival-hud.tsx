"use client";

import { useGameStore } from "@/store/game-store";
import { Flame } from "lucide-react";
import { motion } from "framer-motion";

/**
 * Survival streak HUD — shows current streak and bonus time in the arena top bar.
 * Renders only when survivalActive is true.
 */
export function SurvivalHUD() {
    const survivalActive = useGameStore((s) => s.survivalActive);
    const survivalStreak = useGameStore((s) => s.survivalStreak);
    const survivalBonusTime = useGameStore((s) => s.survivalBonusTime);

    if (!survivalActive) return null;

    return (
        <div className="flex items-center gap-3">
            <motion.div
                className="flex items-center gap-1.5 bg-amber-500/15 border-2 border-amber-500/40 px-3 py-1.5 rounded shadow-retro-sm"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
            >
                <Flame
                    className={`size-4 ${survivalStreak >= 3 ? "text-amber-500 animate-pulse" : "text-amber-600"}`}
                />
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">
                    Streak
                </span>
                <span className="font-mono font-black text-amber-600 text-lg leading-none">
                    {survivalStreak}
                </span>
            </motion.div>
            {survivalBonusTime > 0 && (
                <motion.div
                    className="flex items-center gap-1 bg-emerald-500/20 border border-emerald-500/50 px-2 py-1 rounded text-emerald-600"
                    initial={{ opacity: 0, y: -4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                    <span className="text-[9px] font-black uppercase">+30s</span>
                </motion.div>
            )}
        </div>
    );
}
