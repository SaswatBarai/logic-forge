"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { StoryChoice } from "@/lib/story-data";
import type { Scar, StoryZone } from "@/store/story-store";
import { CHARACTER_CONFIG } from "@/lib/character-config";
import { PixelPortrait } from "@/components/story/pixel-portrait";
import { useStorySFX } from "@/components/story/story-sfx-context";

const CHOICE_LABELS = ["A", "B", "C", "D"];
const PROMPT_TYPEWRITER_MS = 24;

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
  /** Prompt text (e.g. act question) — typewriter reveals then shows choices */
  prompt: string;
}

/**
 * Choice box — pixel portrait left; right: typewriter prompt, then divider, then
 * lettered choice buttons with hover shimmer and ✦ on select. Matches DialogueUI ChoiceBox.
 */
export function ChoiceCards({
  choices,
  onSelect,
  disabled,
  selectedId,
  scars = [],
  streakCount = 0,
  isBossAct = false,
  zone,
  prompt,
}: ChoiceCardsProps) {
  const sfx = useStorySFX();
  const timerMs = getTimerMs(isBossAct, scars.length);
  const [remaining, setRemaining] = useState(timerMs);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [promptDisplayed, setPromptDisplayed] = useState("");
  const [promptDone, setPromptDone] = useState(false);
  const promptIdxRef = useRef(0);
  const promptTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef(Date.now());
  const firedRef = useRef(false);

  const effectiveZone = zone ?? "ARCHIVE_CITADEL";
  const config = CHARACTER_CONFIG[effectiveZone];

  // Typewriter for prompt
  useEffect(() => {
    setPromptDisplayed("");
    setPromptDone(false);
    promptIdxRef.current = 0;
    if (!prompt) {
      setPromptDone(true);
      return;
    }
    const tick = () => {
      promptIdxRef.current += 1;
      if (promptIdxRef.current >= prompt.length) {
        setPromptDisplayed(prompt);
        setPromptDone(true);
        return;
      }
      setPromptDisplayed(prompt.slice(0, promptIdxRef.current));
      promptTimerRef.current = setTimeout(tick, PROMPT_TYPEWRITER_MS);
    };
    promptTimerRef.current = setTimeout(tick, PROMPT_TYPEWRITER_MS);
    return () => {
      if (promptTimerRef.current) clearTimeout(promptTimerRef.current);
    };
  }, [prompt]);

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
  const isUrgent = remaining <= 5_000 && remaining > 0;
  const showHint = streakCount >= 3;
  const obscure = scars.length >= 3;

  return (
    <div className="story-mode flex w-full gap-0">
      {/* Portrait panel — pixel art */}
      <div
        className="flex shrink-0 flex-col items-center gap-2 border-2 border-r-0 p-3"
        style={{
          background: "linear-gradient(180deg, #140f02 0%, #0d0a00 100%)",
          borderColor: config.borderColor,
        }}
      >
        <PixelPortrait
          initials={config.initials}
          color={config.color}
          borderColor={config.borderColor}
          isActive={true}
        />
        <div
          className="max-w-[110px] overflow-hidden text-ellipsis whitespace-nowrap px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
          style={{
            background: config.borderColor,
            color: "#0d0a00",
            fontFamily: "'Courier New', monospace",
          }}
        >
          {config.name}
        </div>
      </div>

      {/* Right panel: prompt (typewriter), timer, divider when done, choices */}
      <div
        className="relative flex flex-1 flex-col gap-2.5 border-2 py-5 pl-6 pr-5 pb-5"
        style={{
          background: "linear-gradient(180deg, #1d1508 0%, #130f04 100%)",
          borderColor: config.borderColor,
        }}
      >
        {/* Character name floating above */}
        <div
          className="absolute left-4 -top-3 px-2.5 py-0 text-[11px] font-bold uppercase tracking-widest"
          style={{
            background: "#130f04",
            color: config.color,
            fontFamily: "'Courier New', monospace",
          }}
        >
          {config.name}
        </div>

        {/* Speech arrow */}
        <div
          className="absolute left-0 top-12 h-0 w-0 -translate-y-1/2"
          style={{
            borderTop: "10px solid transparent",
            borderBottom: "10px solid transparent",
            borderRight: `10px solid ${config.borderColor}`,
          }}
        />
        <div
          className="absolute left-[7px] top-12 h-0 w-0 -translate-y-1/2"
          style={{
            borderTop: "8px solid transparent",
            borderBottom: "8px solid transparent",
            borderRight: "8px solid #130f04",
          }}
        />

        {/* Prompt line — typewriter */}
        <p
          className="m-0 mb-1 text-[14px] leading-[1.7] italic"
          style={{
            color: "#E8D9B0",
            fontFamily: "'Courier New', monospace",
          }}
        >
          {promptDisplayed}
          {!promptDone && <span className="animate-blink opacity-70">▮</span>}
        </p>

        {/* Timer row — show next to prompt or below */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px]" style={{ color: "transparent" }} />
          <p
            className="font-mono text-xs font-bold uppercase tracking-wider"
            style={{
              color: isUrgent ? "#dc2626" : "rgba(232, 217, 176, 0.7)",
              fontFamily: "'Courier New', monospace",
            }}
          >
            {Math.ceil(remaining / 1000)}s
          </p>
        </div>

        {/* Timer bar */}
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-black/40">
          <motion.div
            className="h-full rounded-full"
            style={{
              width: `${pct}%`,
              background: pct > 60 ? config.borderColor : pct > 30 ? config.color : "#dc2626",
            }}
            transition={{ duration: 0.1 }}
          />
          {isUrgent && (
            <div className="absolute inset-0 rounded-full shadow-[0_0_12px_rgba(239,68,68,0.5)]" />
          )}
        </div>

        {/* Divider — when prompt done */}
        {promptDone && (
          <div
            className="h-px shrink-0"
            style={{
              background: `linear-gradient(90deg, transparent, ${config.borderColor}88, transparent)`,
              margin: "2px 0 6px",
            }}
          />
        )}

        {/* Choices — only when prompt done */}
        {promptDone &&
          choices.map((choice, idx) => {
            const label = CHOICE_LABELS[idx] ?? String(idx + 1);
            const isTier1 = choice.tier === 1;
            const shouldObscure = obscure && choice.tier >= 2 && choice.tier <= 3;
            const isSelected = selectedId === choice.id;
            const isHovered = hoveredIdx === idx;

            const showTierHint = showHint && isTier1 && !isSelected;
            const bg =
              isSelected
                ? `${config.color}22`
                : isHovered
                  ? "#2a1e0a"
                  : "#1a1206";
            const border =
              isSelected
                ? `2px solid ${config.color}`
                : isHovered
                  ? `2px solid ${config.borderColor}`
                  : showTierHint
                    ? `2px solid ${config.color}66`
                    : "2px solid #3a2a08";
            const badgeBg =
              isSelected ? config.color : isHovered ? config.borderColor : "#3a2a08";
            const badgeFg = isSelected || isHovered ? "#0d0a00" : config.color;

            return (
              <motion.button
                key={choice.id}
                type="button"
                onClick={() => {
                  sfx.play("choiceSelect");
                  onSelect(choice);
                }}
                disabled={disabled}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="relative flex w-full cursor-pointer items-center gap-3 overflow-hidden rounded-none border-2 py-2.5 pl-3.5 pr-4 text-left transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  background: bg,
                  border,
                  transform: isHovered && !disabled && !isSelected ? "translateX(4px)" : "none",
                  opacity: isSelected ? 1 : selectedId != null && !isSelected ? 0.35 : 1,
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08, duration: 0.3 }}
              >
                <div
                  className="flex h-[26px] w-[26px] shrink-0 items-center justify-center text-xs font-bold transition-colors duration-150"
                  style={{
                    background: badgeBg,
                    color: badgeFg,
                    fontFamily: "'Courier New', monospace",
                  }}
                >
                  {label}
                </div>

                <span
                  className={`min-w-0 flex-1 text-[13px] leading-snug ${shouldObscure ? "select-none blur-[3px]" : ""}`}
                  style={{
                    color: isSelected ? config.color : "#D4C090",
                    fontFamily: "'Courier New', monospace",
                  }}
                >
                  {choice.text}
                </span>

                {/* Hover shimmer */}
                {isHovered && !disabled && !isSelected && (
                  <div
                    className="animate-shimmer pointer-events-none absolute inset-0"
                    style={{
                      background: `linear-gradient(90deg, transparent 0%, ${config.color}11 50%, transparent 100%)`,
                    }}
                  />
                )}

                {isSelected && (
                  <span className="text-base" style={{ color: config.color }}>
                    ✦
                  </span>
                )}
              </motion.button>
            );
          })}
      </div>
    </div>
  );
}
