"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ZONE_META } from "@/components/story/world-map";
import type { StoryZone } from "@/store/story-store";
import { useAudioManagerContext } from "@/contexts/audio-manager-context";

export interface CinematicZoneEnterProps {
  zone: StoryZone;
  onComplete: () => void;
}

const DURATION_MS = 7000;
const LORE_LINE_DELAY_MS = 650;

const ZONE_LORE: Record<StoryZone, string[]> = {
  ARCHIVE_CITADEL: [
    "Before the Null Corruption, the Cipher Knights kept the realm ordered.",
    "Now Nullus the Dread Wyrm has breached the Archive Citadel — ten million tomes.",
    "Within its stacks lies the only weapon that can banish him.",
    "Elder Query, ancient and sightless, holds the final index.",
    "You must ask the right questions. The archive does not forgive the imprecise.",
  ],
  FORGE_VILLAGE: [
    "The Forge Village is the realm's beating heart — without it, nothing is built.",
    "Ferron, the Iron Golem, once defended these walls alone.",
    "The Null Collective infected his processes. Deadlock. Memory rot. Paralysis.",
    "Five tasks wait. A dying core cannot afford a wasted cycle.",
    "Restore his order. Break his chains. Make him whole again.",
  ],
  WALL_OF_GATES: [
    "The Wall of Gates is all that separates the realm from the endless Void.",
    "OVERFLOW — the Shadow Mob — has severed the roads and flooded the gates.",
    "Ten thousand false travellers press against the walls. The real ones are lost among them.",
    "The Gate Commander's authentication is failing. The King's escort is still in the open.",
    "Every path has a weight. Every claim must be verified. Hold the line.",
  ],
};

/* Amber/gold theme — dark brown base with gold accent */
const ZONE_GRADIENTS: Record<StoryZone, string> = {
  ARCHIVE_CITADEL: "from-[hsl(30,60%,4%)] via-[hsl(35,50%,8%)] to-[hsl(30,60%,5%)]",
  FORGE_VILLAGE: "from-[hsl(30,60%,4%)] via-[hsl(25,55%,10%)] to-[hsl(30,60%,5%)]",
  WALL_OF_GATES: "from-[hsl(30,60%,4%)] via-[hsl(32,48%,9%)] to-[hsl(30,60%,5%)]",
};

const ZONE_ACCENT: Record<StoryZone, string> = {
  ARCHIVE_CITADEL: "text-[hsl(38,100%,55%)]",
  FORGE_VILLAGE: "text-[hsl(38,100%,55%)]",
  WALL_OF_GATES: "text-[hsl(38,100%,55%)]",
};

export function CinematicZoneEnter({ zone, onComplete }: CinematicZoneEnterProps) {
  const meta = ZONE_META.find((z) => z.id === zone);
  const { setIntensity } = useAudioManagerContext();
  const completedRef = useRef(false);
  const [showSkip, setShowSkip] = useState(false);
  const [visibleLines, setVisibleLines] = useState(0);
  const [showGameTitle, setShowGameTitle] = useState(true);
  const lore = ZONE_LORE[zone] ?? [];
  const gradient = ZONE_GRADIENTS[zone] ?? ZONE_GRADIENTS.ARCHIVE_CITADEL;
  const accent = ZONE_ACCENT[zone] ?? ZONE_ACCENT.ARCHIVE_CITADEL;

  useEffect(() => {
    setIntensity(0);
  }, [setIntensity, zone]);

  useEffect(() => {
    const t = setTimeout(() => setShowSkip(true), 1200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const hideGameTitle = setTimeout(() => setShowGameTitle(false), 2200);
    return () => clearTimeout(hideGameTitle);
  }, []);

  useEffect(() => {
    if (completedRef.current) return;
    const lineCount = lore.length;
    const lineIntervals = Array.from({ length: lineCount }, (_, i) =>
      setTimeout(() => setVisibleLines((n) => Math.max(n, i + 1)), 2400 + i * LORE_LINE_DELAY_MS)
    );
    const endTimer = setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete();
      }
    }, DURATION_MS);
    return () => {
      lineIntervals.forEach(clearTimeout);
      clearTimeout(endTimer);
    };
  }, [lore.length, onComplete]);

  const handleSkip = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete();
  };

  const title = meta?.title ?? zone;
  const subtitle = meta?.subtitle ?? zone;

  return (
    <div className="story-mode fixed inset-0 z-50 bg-[hsl(30,60%,4%)]">
      <motion.div
        className={`absolute inset-0 flex flex-col items-center justify-center px-6 bg-gradient-to-b ${gradient}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Gold L-shaped corner brackets (NarratorBox style) */}
        <div
          className="pointer-events-none"
          style={{
            position: "absolute",
            top: -1,
            left: -1,
            width: 10,
            height: 10,
            borderTop: "3px solid #C9A84C",
            borderLeft: "3px solid #C9A84C",
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none"
          style={{
            position: "absolute",
            top: -1,
            right: -1,
            width: 10,
            height: 10,
            borderTop: "3px solid #C9A84C",
            borderRight: "3px solid #C9A84C",
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none"
          style={{
            position: "absolute",
            bottom: -1,
            left: -1,
            width: 10,
            height: 10,
            borderBottom: "3px solid #C9A84C",
            borderLeft: "3px solid #C9A84C",
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none"
          style={{
            position: "absolute",
            bottom: -1,
            right: -1,
            width: 10,
            height: 10,
            borderBottom: "3px solid #C9A84C",
            borderRight: "3px solid #C9A84C",
          }}
          aria-hidden
        />

        {/* Vignette — amber dark */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, hsl(30 60% 3% / 0.9) 100%)",
          }}
        />
        {/* Top branding — small-caps Courier New gold */}
        <AnimatePresence>
          {showGameTitle && (
            <motion.div
              className="absolute top-[18%] left-0 right-0 z-10 text-center"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.5 }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-[0.4em] text-opacity-90"
                style={{ color: "#C9A84C", fontFamily: "'Courier New', monospace" }}
              >
                IRONCLAD CHRONICLES
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative z-10 flex max-w-lg flex-col items-center justify-center text-center">
          <motion.p
            className={`mb-3 text-xs font-mono uppercase tracking-[0.3em] opacity-90 ${accent}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.9 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            {subtitle}
          </motion.p>
          {/* Simple Cinzel fade-in for zone title (no glitch) */}
          <motion.h1
            className="font-story-title text-3xl font-bold sm:text-4xl md:text-5xl"
            style={{ color: "hsl(40, 50%, 92%)" }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            {title}
          </motion.h1>

          <div className="mt-12 flex min-h-[5rem] flex-col items-center gap-3">
            {lore.map((line, i) => (
              <AnimatePresence key={i}>
                {visibleLines > i && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                    className="max-w-md text-sm italic"
                    style={{ color: "#C9B882", fontFamily: "'Courier New', monospace" }}
                  >
                    {line}
                  </motion.p>
                )}
              </AnimatePresence>
            ))}
          </div>
        </div>

        <AnimatePresence>
          {showSkip && (
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed bottom-8 right-8 z-20 rounded-lg border border-[hsl(38,70%,30%)] bg-[hsl(30,50%,8%)] px-5 py-2.5 text-xs font-mono uppercase tracking-wider text-[hsl(40,50%,88%)] transition-colors hover:border-[hsl(38,100%,55%)]/60 hover:bg-[hsl(38,50%,15%)] hover:text-[hsl(38,100%,55%)]"
              style={{ fontFamily: "'Courier New', monospace" }}
              onClick={handleSkip}
            >
              Skip
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
