"use client";

import { motion } from "framer-motion";
import { BookOpen, Cog, Shield, Lock, Sword, Star } from "lucide-react";
import type { StoryZone } from "@/store/story-store";
import type { ZoneCompletionStatus } from "@/store/story-store";

export const ZONE_META: {
  id: StoryZone;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  realm: string;
  enemy: string;
  desc: string;
  difficulty: 1 | 2 | 3;
  estimatedMinutes: number;
  recommendedRank: string;
  accentClass: string;
  glowClass: string;
}[] = [
  {
    id: "ARCHIVE_CITADEL",
    icon: BookOpen,
    title: "The Archive Citadel",
    subtitle: "Database Realm",
    realm: "Databases",
    enemy: "Nullus the Dread Wyrm",
    desc: "A library of 10 million tomes, guarded by Elder Query. Master relational databases to find the weapon that slays the wyrm.",
    difficulty: 1,
    estimatedMinutes: 12,
    recommendedRank: "Squire",
    accentClass: "text-blue-400",
    glowClass: "shadow-[0_0_24px_rgba(96,165,250,0.4)]",
  },
  {
    id: "FORGE_VILLAGE",
    icon: Cog,
    title: "The Forge Village",
    subtitle: "Operating Systems Realm",
    realm: "Operating Systems",
    enemy: "Deadlock the Iron Golem",
    desc: "Ferron the Iron Golem is dying from mismanaged energy. Restore proper scheduling, resolve deadlocks, and manage memory.",
    difficulty: 2,
    estimatedMinutes: 15,
    recommendedRank: "Knight",
    accentClass: "text-amber-400",
    glowClass: "shadow-[0_0_24px_rgba(251,191,36,0.4)]",
  },
  {
    id: "WALL_OF_GATES",
    icon: Shield,
    title: "The Wall of Gates",
    subtitle: "Computer Networks Realm",
    realm: "Computer Networks",
    enemy: "Overflow the Shadow Mob",
    desc: "Fight deception with routing algorithms, verify messengers, and defend against flood attacks. Every road is a trap.",
    difficulty: 3,
    estimatedMinutes: 18,
    recommendedRank: "Champion",
    accentClass: "text-emerald-400",
    glowClass: "shadow-[0_0_24px_rgba(52,211,153,0.4)]",
  },
];

function DifficultyPips({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${
            i < level ? "bg-primary" : "bg-muted-foreground/20"
          }`}
        />
      ))}
    </div>
  );
}

export interface ZoneNodeProps {
  zone: (typeof ZONE_META)[number];
  completion: ZoneCompletionStatus;
  masteryStars?: number;
  onSelect: () => void;
  index: number;
}

export function ZoneNode({ zone, completion, masteryStars = 0, onSelect, index }: ZoneNodeProps) {
  const Icon = zone.icon;
  const isLocked = false;
  const isCompleted = completion === "completed";
  const isInProgress = completion === "started";

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      disabled={isLocked}
      className={`group relative flex flex-col items-center gap-2 p-5 rounded-xl border-2 min-w-[160px] transition-all duration-200 bg-card disabled:opacity-40 disabled:cursor-not-allowed ${
        isCompleted
          ? "border-primary shadow-[0_0_20px_hsl(var(--primary)/0.25)]"
          : isInProgress
            ? "border-accent/50 animate-pulse"
            : "border-border"
      }`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.15 * index, duration: 0.4 }}
      whileHover={!isLocked ? {
        scale: 1.05,
        borderColor: "hsl(var(--primary))",
      } : undefined}
      whileTap={!isLocked ? { scale: 0.98 } : undefined}
    >
      {isLocked && (
        <div className="absolute inset-0 rounded-xl bg-background/50 flex items-center justify-center z-10">
          <Lock className="size-6 text-muted-foreground" />
        </div>
      )}

      <div className={`${zone.accentClass} border-2 border-current/30 rounded-lg p-2`}>
        <Icon className="size-8" />
      </div>

      <span className="font-story-title font-semibold text-sm text-foreground text-center">
        {zone.title}
      </span>

      <DifficultyPips level={zone.difficulty} />

      {/* Mastery stars for completed */}
      {isCompleted && masteryStars > 0 && (
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`size-3 ${i < masteryStars ? "text-primary fill-primary" : "text-muted-foreground/20"}`}
            />
          ))}
        </div>
      )}

      {/* Status label */}
      <span className={`text-[10px] font-mono uppercase tracking-wider ${
        isCompleted ? "text-primary" : isInProgress ? "text-accent" : "text-muted-foreground"
      }`}>
        {isCompleted ? "Completed" : isInProgress ? "In Progress" : "Not Started"}
      </span>

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg border border-primary/40 bg-card shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-20 w-64 text-left">
        <p className="text-xs text-foreground/90 leading-relaxed">{zone.desc}</p>
        <p className="mt-2 text-[10px] font-mono text-primary">
          Recommended: {zone.recommendedRank} · Est. {zone.estimatedMinutes} min
        </p>
        <p className="text-[10px] text-muted-foreground">Boss: {zone.enemy}</p>
      </div>
    </motion.button>
  );
}

function ConnectingPath() {
  return (
    <div className="hidden md:flex items-center">
      <svg width="48" height="4" className="text-primary/30">
        <line x1="0" y1="2" x2="48" y2="2" stroke="currentColor" strokeWidth="2" strokeDasharray="6 4" />
      </svg>
    </div>
  );
}

export interface WorldMapProps {
  zoneCompletion: Record<StoryZone, ZoneCompletionStatus>;
  onSelectZone: (zone: StoryZone) => void;
  achievements?: string[];
}

export function WorldMap({ zoneCompletion, onSelectZone, achievements = [] }: WorldMapProps) {
  const completedCount = Object.values(zoneCompletion).filter((v) => v === "completed").length;

  return (
    <div className="relative w-full max-w-4xl mx-auto space-y-6">
      {/* Player progress */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <Sword className="size-4 text-primary" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-foreground">
            Sir Axiom
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-muted-foreground">
            {completedCount}/3 Zones Cleared
          </span>
          <div className="w-24 h-1.5 rounded-full overflow-hidden bg-muted">
            <motion.div
              className="h-full rounded-full bg-primary"
              animate={{ width: `${(completedCount / 3) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="rounded-2xl border-2 border-primary/20 bg-card p-8 md:p-12 shadow-retro-sm">
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0">
          {ZONE_META.map((zone, i) => (
            <div key={zone.id} className="flex items-center">
              <ZoneNode
                zone={zone}
                completion={zoneCompletion[zone.id]}
                onSelect={() => onSelectZone(zone.id)}
                index={i}
              />
              {i < ZONE_META.length - 1 && <ConnectingPath />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
