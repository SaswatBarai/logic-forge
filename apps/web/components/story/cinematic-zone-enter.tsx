"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { ZONE_META } from "@/components/story/world-map";
import type { StoryZone } from "@/store/story-store";

export interface CinematicZoneEnterProps {
  zone: StoryZone;
  onComplete: () => void;
}

const DURATION_MS = 2200;

export function CinematicZoneEnter({ zone, onComplete }: CinematicZoneEnterProps) {
  const meta = ZONE_META.find((z) => z.id === zone);

  useEffect(() => {
    const t = setTimeout(onComplete, DURATION_MS);
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 px-6 bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <p className="text-xs font-mono uppercase tracking-[0.3em] text-primary mb-2">
          {meta?.subtitle ?? zone}
        </p>
        <h1 className="font-story-title text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
          {meta?.title ?? zone}
        </h1>
      </motion.div>
      <motion.p
        className="text-sm text-muted-foreground max-w-md text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        {meta?.desc ?? "Enter the realm."}
      </motion.p>
    </motion.div>
  );
}
