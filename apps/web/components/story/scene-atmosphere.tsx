"use client";

import { motion } from "framer-motion";
import type { StoryZone } from "@/store/story-store";

const ZONE_GRADIENTS: Record<StoryZone, string> = {
  ARCHIVE_CITADEL: "from-blue-900/20 via-indigo-900/10 to-transparent",
  FORGE_VILLAGE: "from-amber-900/20 via-orange-900/10 to-transparent",
  WALL_OF_GATES: "from-emerald-900/20 via-teal-900/10 to-transparent",
};

export function SceneAtmosphere({
  zone,
  isBoss,
}: {
  zone: StoryZone;
  isBoss?: boolean;
}) {
  const gradient = ZONE_GRADIENTS[zone] ?? ZONE_GRADIENTS.ARCHIVE_CITADEL;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-b ${gradient}`} />
      {/* floating motes */}
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-primary/20"
          style={{
            width: 3 + (i % 3) * 2,
            height: 3 + (i % 3) * 2,
            left: `${15 + i * 14}%`,
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
      ))}
      {isBoss && (
        <motion.div
          className="absolute inset-0 bg-destructive/5"
          animate={{ opacity: [0, 0.08, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </div>
  );
}
