"use client";

import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { STORY_ACHIEVEMENTS } from "@/lib/story-data";

export interface AchievementsPanelProps {
  unlockedIds: string[];
}

export function AchievementsPanel({ unlockedIds }: AchievementsPanelProps) {
  return (
    <div className="w-full max-w-4xl mx-auto mt-8">
      <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-primary mb-4 px-2">
        Achievements
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {STORY_ACHIEVEMENTS.map((ach, i) => {
          const unlocked = unlockedIds.includes(ach.id);
          const AchIcon = ach.icon;
          return (
            <motion.div
              key={ach.id}
              className={`group relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all ${
                unlocked
                  ? "border-primary/50 bg-primary/5 shadow-[0_0_16px_hsl(var(--primary)/0.15)]"
                  : "border-border bg-card opacity-50"
              }`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: unlocked ? 1 : 0.5, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              {unlocked ? (
                <AchIcon className="size-6 text-primary" />
              ) : (
                <Lock className="size-6 text-muted-foreground" />
              )}
              <p className={`text-[10px] font-story-title font-semibold ${unlocked ? "text-foreground" : "text-muted-foreground"}`}>
                {ach.title}
              </p>

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg border border-primary/40 bg-card shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-20 w-48 text-left">
                <p className="text-xs text-foreground">{ach.title}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{ach.desc}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
