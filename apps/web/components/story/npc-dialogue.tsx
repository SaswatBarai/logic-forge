"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { BookOpen, Cog, Shield, User } from "lucide-react";
import type { StoryZone } from "@/store/story-store";

const NPC_MAP: Record<StoryZone, { name: string; icon: React.ElementType }> = {
  ARCHIVE_CITADEL: { name: "Elder Query", icon: BookOpen },
  FORGE_VILLAGE: { name: "Ferron", icon: Cog },
  WALL_OF_GATES: { name: "Gate Commander", icon: Shield },
};

export interface NpcDialogueProps {
  zone: StoryZone;
  text: string;
  onComplete?: () => void;
  speed?: number;
}

export function NpcDialogue({ zone, text, onComplete, speed = 18 }: NpcDialogueProps) {
  const npc = NPC_MAP[zone] ?? { name: "Narrator", icon: User };
  const Icon = npc.icon;
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const idxRef = useRef(0);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    idxRef.current = 0;

    const interval = setInterval(() => {
      idxRef.current += 1;
      if (idxRef.current >= text.length) {
        setDisplayed(text);
        setDone(true);
        clearInterval(interval);
        onComplete?.();
      } else {
        setDisplayed(text.slice(0, idxRef.current));
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, onComplete]);

  return (
    <div className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card shadow-retro-sm">
      <div className="shrink-0 w-10 h-10 rounded-lg border-2 border-primary/40 bg-primary/10 flex items-center justify-center text-primary">
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-mono uppercase tracking-widest text-primary mb-1">
          {npc.name}
        </p>
        <p className="font-story-body text-sm text-foreground leading-relaxed whitespace-pre-wrap">
          {displayed}
          {!done && (
            <motion.span
              className="inline-block w-1.5 h-4 bg-primary ml-0.5 align-middle"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            />
          )}
        </p>
        {done && (
          <motion.span
            className="inline-block mt-2 text-[9px] font-mono uppercase tracking-wider text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            ▼ continue
          </motion.span>
        )}
      </div>
    </div>
  );
}
