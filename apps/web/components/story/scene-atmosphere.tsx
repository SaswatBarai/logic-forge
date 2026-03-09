"use client";

import { motion } from "framer-motion";
import type { StoryZone } from "@/store/story-store";
import type { SceneMood } from "@/lib/story-data";

const ZONE_BASE: Record<StoryZone, string> = {
  ARCHIVE_CITADEL: "from-slate-950 via-indigo-950/40 to-slate-900",
  FORGE_VILLAGE: "from-slate-950 via-amber-950/30 to-slate-900",
  WALL_OF_GATES: "from-slate-950 via-emerald-950/40 to-slate-900",
};

const MOOD_OVERLAY: Record<SceneMood, string> = {
  calm: "from-transparent via-blue-950/10 to-transparent",
  tense: "from-transparent via-amber-950/15 to-transparent",
  danger: "from-red-950/30 via-red-900/20 to-slate-950",
  victory: "from-amber-900/20 via-yellow-900/10 to-transparent",
  sad: "from-slate-900/50 via-slate-800/30 to-slate-950",
};

export function SceneAtmosphere({
  zone,
  mood = "calm",
  isBoss = false,
}: {
  zone: StoryZone;
  mood?: SceneMood;
  isBoss?: boolean;
}) {

  const baseGradient = ZONE_BASE[zone] ?? ZONE_BASE.ARCHIVE_CITADEL;
  const moodGradient = MOOD_OVERLAY[mood] ?? MOOD_OVERLAY.calm;

  const isEmber = mood === "danger" || mood === "tense";
  const isCalmOrVictory = mood === "calm" || mood === "victory";
  const isSad = mood === "sad";
  const particleCount = 12;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Layer 0 — background gradient (subtle parallax drift) */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-b ${baseGradient}`}
        animate={{ x: [0, 3, 0], y: [0, 2, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className={`absolute inset-0 bg-gradient-to-b ${moodGradient}`}
        animate={{ x: [0, -2, 0], y: [0, -3, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Layer 1 — large blurred orbs */}
      <motion.div
        className="absolute inset-0 overflow-hidden"
        animate={{ x: [0, 8, 0], y: [0, 6, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="absolute w-[180%] h-[180%] -left-[40%] -top-[40%]">
          <div className="absolute top-[20%] left-[10%] w-64 h-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute top-[60%] right-[15%] w-48 h-48 rounded-full bg-accent/10 blur-3xl" />
          <div className="absolute bottom-[20%] left-[30%] w-40 h-40 rounded-full bg-primary/5 blur-2xl" />
        </div>
      </motion.div>

      {/* Layer 2 — mood-based particles */}
      <motion.div
        className="absolute inset-0"
        animate={{ x: [0, -6, 0], y: [0, 4, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      >
        {Array.from({ length: particleCount }).map((_, i) => {
          if (isEmber) {
            return (
              <motion.div
                key={`ember-${i}`}
                className="absolute rounded-full bg-orange-500/60"
                style={{
                  width: 4 + (i % 3),
                  height: 4 + (i % 3),
                  left: `${8 + (i * 7) % 84}%`,
                  bottom: "0%",
                }}
                animate={{
                  y: [0, -120 - i * 25],
                  opacity: [0, 0.9, 0],
                }}
                transition={{
                  duration: 2.5 + i * 0.2,
                  repeat: Infinity,
                  delay: i * 0.4,
                  ease: "easeOut",
                }}
              />
            );
          }
          if (isSad) {
            return (
              <motion.div
                key={`drip-${i}`}
                className="absolute rounded-full bg-slate-500/40"
                style={{
                  width: 3,
                  height: 8 + (i % 4) * 4,
                  left: `${10 + (i * 9) % 80}%`,
                  top: "0%",
                }}
                animate={{
                  y: [0, 200 + i * 20],
                  opacity: [0.5, 0.2],
                }}
                transition={{
                  duration: 4 + i * 0.5,
                  repeat: Infinity,
                  delay: i * 0.6,
                  ease: "linear",
                }}
              />
            );
          }
          if (isCalmOrVictory) {
            return (
              <motion.div
                key={`mote-${i}`}
                className="absolute rounded-full bg-white/30"
                style={{
                  width: 3 + (i % 3) * 2,
                  height: 3 + (i % 3) * 2,
                  left: `${12 + i * 7}%`,
                  bottom: "10%",
                }}
                animate={{
                  y: [0, -(60 + i * 25), -(140 + i * 30)],
                  opacity: [0, 0.7, 0],
                }}
                transition={{
                  duration: 5 + i * 0.6,
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: "easeOut",
                }}
              />
            );
          }
          return (
            <motion.div
              key={`default-${i}`}
              className="absolute rounded-full bg-primary/20"
              style={{
                width: 3 + (i % 3) * 2,
                height: 3 + (i % 3) * 2,
                left: `${15 + (i * 7) % 70}%`,
                bottom: "10%",
              }}
              animate={{
                y: [0, -(80 + i * 30), -(160 + i * 40)],
                opacity: [0, 0.6, 0],
              }}
              transition={{
                duration: 4 + i * 0.8,
                repeat: Infinity,
                delay: i * 0.7,
                ease: "easeOut",
              }}
            />
          );
        })}
      </motion.div>

      {/* Boss pulse */}
      {isBoss && (
        <motion.div
          className="absolute inset-0 bg-destructive/5"
          animate={{ opacity: [0, 0.12, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      {isBoss && (
        <motion.div
          className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_50%,hsl(var(--destructive)/0.15),transparent_70%)]"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        />
      )}
    </div>
  );
}
