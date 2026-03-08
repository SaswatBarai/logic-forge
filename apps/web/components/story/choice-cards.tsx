"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Sword, Shield, Eye, Skull, Flame } from "lucide-react";
import type { StoryChoice } from "@/lib/story-data";
import type { Scar, StoryZone } from "@/store/story-store";
import { useStorySFX } from "@/components/story/story-sfx-context";

const ACTION_ICONS = [Sword, Shield, Eye, Flame];

function getRiskDots(tier: number): number {
  return Math.min(tier, 3);
}

function getTimerMs(isBoss: boolean, scarCount: number): number {
  const base = isBoss ? 20_000 : 30_000;
  const reduction = Math.min(scarCount, 2) * 3_000;
  return Math.max(10_000, base - reduction);
}

export interface ChoiceCardsProps {
  choices: StoryChoice[];
  onSelect: (choice: StoryChoice) => void;
  disabled?: boolean;
  selectedId?: string | null;
  scars?: Scar[];
  streakCount?: number;
  isBossAct?: boolean;
  zone?: StoryZone;
}

export function ChoiceCards({
  choices,
  onSelect,
  disabled,
  selectedId,
  scars = [],
  streakCount = 0,
  isBossAct = false,
}: ChoiceCardsProps) {
  const sfx = useStorySFX();
  const timerMs = getTimerMs(isBossAct, scars.length);
  const [remaining, setRemaining] = useState(timerMs);
  const startRef = useRef(Date.now());
  const firedRef = useRef(false);

  useEffect(() => {
    startRef.current = Date.now();
    setRemaining(timerMs);
    firedRef.current = false;
  }, [timerMs, choices]);

  useEffect(() => {
    if (disabled || firedRef.current) return;
    const iv = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const left = Math.max(0, timerMs - elapsed);
      setRemaining(left);

      if (left <= 10_000 && left > 5_000 && Math.round(left / 1000) !== Math.round((left + 100) / 1000)) {
        sfx.play("timerTick");
      }
      if (left <= 5_000 && left > 0 && Math.round(left / 500) !== Math.round((left + 100) / 500)) {
        sfx.play("timerUrgent");
      }

      if (left <= 0 && !firedRef.current) {
        firedRef.current = true;
        clearInterval(iv);
        const worst = [...choices].sort((a, b) => b.tier - a.tier)[0];
        if (worst) onSelect(worst);
      }
    }, 100);
    return () => clearInterval(iv);
  }, [disabled, timerMs, choices, onSelect, sfx]);

  const pct = (remaining / timerMs) * 100;
  const timerColor =
    pct > 60 ? "bg-green-500" : pct > 30 ? "bg-yellow-500" : "bg-red-500";
  const isUrgent = remaining <= 5_000 && remaining > 0;

  const showHint = streakCount >= 3;
  const obscure = scars.length >= 3;

  return (
    <div className="border-t border-border bg-muted/20 p-4 space-y-3">
      {/* Timer bar */}
      <div className="relative h-1.5 rounded-full overflow-hidden bg-muted">
        <motion.div
          className={`absolute inset-y-0 left-0 rounded-full ${timerColor} ${isUrgent ? "animate-pulse" : ""}`}
          style={{ width: `${pct}%` }}
          transition={{ duration: 0.1 }}
        />
        {isUrgent && (
          <div className="absolute inset-0 rounded-full shadow-[0_0_12px_rgba(239,68,68,0.5)]" />
        )}
      </div>
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-mono uppercase tracking-widest text-primary">
          What do you do?
        </p>
        <p className={`text-[9px] font-mono ${remaining <= 5_000 ? "text-destructive font-bold" : "text-muted-foreground"}`}>
          {Math.ceil(remaining / 1000)}s
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {choices.map((choice, idx) => {
          const Icon = ACTION_ICONS[idx % ACTION_ICONS.length]!;
          const risk = getRiskDots(choice.tier);
          const isTier1 = choice.tier === 1;
          const shouldObscure = obscure && choice.tier >= 2 && choice.tier <= 3;

          return (
            <motion.button
              key={choice.id}
              type="button"
              onClick={() => {
                sfx.play("choiceSelect");
                onSelect(choice);
              }}
              disabled={disabled}
              className={`group relative text-left p-4 rounded-lg border-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-card shadow-retro-sm ${
                selectedId === choice.id
                  ? "border-primary shadow-[0_0_16px_hsl(var(--primary)/0.2)]"
                  : showHint && isTier1
                    ? "border-accent/50 hover:border-accent"
                    : "border-border hover:border-primary/50"
              }`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              whileHover={!disabled ? { scale: 1.02, y: -2 } : undefined}
              whileTap={!disabled ? { scale: 0.96 } : undefined}
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center border border-primary/30 bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`font-story-title font-semibold text-sm text-foreground ${shouldObscure ? "blur-[3px] select-none" : ""}`}>
                    {choice.text}
                  </p>
                  {/* Risk dots */}
                  <div className="flex items-center gap-1 mt-1.5">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full ${
                          i < risk ? "bg-destructive/70" : "bg-muted-foreground/20"
                        }`}
                      />
                    ))}
                    <span className="text-[8px] font-mono text-muted-foreground ml-1 uppercase">
                      risk
                    </span>
                  </div>
                </div>
              </div>
              {/* Streak hint glow for tier-1 */}
              {showHint && isTier1 && (
                <div className="absolute inset-0 rounded-lg border-2 border-accent/30 pointer-events-none animate-pulse" />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
