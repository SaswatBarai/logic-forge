"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import type { StoryRank } from "@/store/story-store";
import { useStorySFX } from "@/components/story/story-sfx-context";

const DISMISS_MS = 2500;

export interface RankUpOverlayProps {
  rank: StoryRank;
  onDismiss: () => void;
}

export function RankUpOverlay({ rank, onDismiss }: RankUpOverlayProps) {
  const sfx = useStorySFX();

  useEffect(() => {
    sfx.play("rankUp");
  }, [sfx]);

  useEffect(() => {
    const t = setTimeout(onDismiss, DISMISS_MS);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-center justify-center p-6 pointer-events-none bg-black/50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="rounded-xl border-2 border-primary p-8 text-center bg-card shadow-[0_0_48px_hsl(var(--primary)/0.25)]"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
      >
        <motion.div
          className="text-primary"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", damping: 12 }}
        >
          <Zap className="size-12 mx-auto mb-3" />
        </motion.div>
        <p className="text-[10px] font-mono uppercase tracking-widest mb-1 text-primary">
          Rank Up
        </p>
        <p className="font-story-title text-2xl font-bold text-foreground">
          {rank}
        </p>
      </motion.div>
    </motion.div>
  );
}
