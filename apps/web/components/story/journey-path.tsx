"use client";

import { motion } from "framer-motion";
import { Check, ChevronRight, Skull } from "lucide-react";
import type { StoryZone } from "@/store/story-store";

const ZONE_LABELS: Record<StoryZone, string> = {
  ARCHIVE_CITADEL: "Archive",
  FORGE_VILLAGE: "Forge",
  WALL_OF_GATES: "Gates",
};

export interface JourneyPathProps {
  zone: StoryZone;
  act: number;
  totalActs: number;
}

export function JourneyPath({ zone, act, totalActs }: JourneyPathProps) {
  const zoneLabel = ZONE_LABELS[zone] ?? zone;
  const acts = Array.from({ length: totalActs }, (_, i) => i + 1);

  return (
    <div className="shrink-0 px-4 py-2 border-b border-border bg-card/80 backdrop-blur-sm flex items-center gap-2 overflow-x-auto">
      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground whitespace-nowrap">
        {zoneLabel}
      </span>
      <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
      <div className="flex items-center gap-1 min-w-0">
        {acts.map((a, idx) => {
          const isCurrent = a === act;
          const isCompleted = a < act;
          const isBoss = a === totalActs;
          return (
            <div key={a} className="flex items-center gap-1 shrink-0">
              {idx > 0 && (
                <span className="text-muted-foreground/50 text-[10px]">→</span>
              )}
              <motion.span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider ${
                  isCurrent
                    ? "bg-primary/20 text-primary border border-primary/50 shadow-[0_0_12px_hsl(var(--primary)/0.4)]"
                    : isCompleted
                      ? "bg-muted/50 text-muted-foreground border border-border"
                      : "bg-muted/30 text-muted-foreground/70 border border-transparent"
                }`}
                animate={isCurrent ? { scale: [1, 1.02, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {isCompleted && <Check className="size-2.5" />}
                {isBoss ? (
                  <>
                    <Skull className="size-2.5" />
                    <span>Boss</span>
                  </>
                ) : (
                  <span>{a}</span>
                )}
              </motion.span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
