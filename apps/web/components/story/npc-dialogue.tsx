"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { StoryZone } from "@/store/story-store";
import { CHARACTER_CONFIG, SPEAKER_CONFIG } from "@/lib/character-config";
import { PixelPortrait } from "@/components/story/pixel-portrait";
import { useStorySFX } from "@/components/story/story-sfx-context";
import { useNarration } from "@/contexts/narration-context";

const TICK_EVERY_N_CHARS = 3;
const MS_PER_WORD_TTS = 320;
const TYPEWRITER_SPEED_MS = 26;

function getSpeechDurationMs(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return words * MS_PER_WORD_TTS;
}

export interface NpcDialogueProps {
  zone: StoryZone;
  text: string;
  /** If provided, overrides the zone's primary character config for name/color/initials */
  speakerName?: string;
  onComplete?: () => void;
  speed?: number;
  tapToContinue?: boolean;
}

/**
 * Character dialogue box — pixel portrait + name tag left, typewriter text right,
 * speech-arrow connector. Click to advance; click during typewriter to skip to end.
 * Matches DialogueUI.jsx CharacterBox exactly.
 */
export function NpcDialogue({
  zone,
  text,
  speakerName,
  onComplete,
  speed = TYPEWRITER_SPEED_MS,
  tapToContinue = true,
}: NpcDialogueProps) {
  const zoneConfig = CHARACTER_CONFIG[zone] ?? {
    name: "Narrator",
    color: "#C9A84C",
    borderColor: "#8B6914",
    image: "",
    initials: "EQ",
  };
  const speakerOverride = speakerName ? SPEAKER_CONFIG[speakerName] : undefined;
  const config = speakerOverride
    ? { ...zoneConfig, ...speakerOverride }
    : zoneConfig;
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const idxRef = useRef(0);
  const lastTickRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sfx = useStorySFX();
  const { speak, stop, enabled: narrationEnabled } = useNarration();

  const effectiveSpeed =
    narrationEnabled && text.length > 0
      ? Math.max(5, getSpeechDurationMs(text) / text.length)
      : speed;

  const finish = useCallback(() => {
    setDisplayed(text);
    setDone(true);
    onComplete?.();
  }, [text, onComplete]);

  const skip = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setDisplayed(text);
    setDone(true);
    stop();
    onComplete?.();
  }, [text, onComplete, stop]);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    idxRef.current = 0;
    lastTickRef.current = 0;
    stop();

    if (speed === 0) {
      setDisplayed(text);
      setDone(true);
      speak(text, { interrupt: true });
      onComplete?.();
      return;
    }

    speak(text, { interrupt: true });

    const interval = setInterval(() => {
      idxRef.current += 1;
      if (idxRef.current >= text.length) {
        setDisplayed(text);
        setDone(true);
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        onComplete?.();
      } else {
        setDisplayed(text.slice(0, idxRef.current));
        if (idxRef.current - lastTickRef.current >= TICK_EVERY_N_CHARS) {
          lastTickRef.current = idxRef.current;
          sfx.play("textTick");
        }
      }
    }, effectiveSpeed);
    intervalRef.current = interval;

    return () => {
      clearInterval(interval);
      intervalRef.current = null;
      stop();
    };
  }, [text, speed, effectiveSpeed, narrationEnabled, onComplete, sfx, speak, stop]);

  const handleTap = () => {
    if (!tapToContinue) return;
    if (done) {
      onComplete?.();
      return;
    }
    skip();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleTap}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleTap()}
      className="story-mode flex w-full cursor-pointer select-none gap-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
    >
      {/* Portrait panel — pixel art + name tag */}
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

      {/* Dialogue panel — speech arrow, name tag, typewriter, ▼ NEXT */}
      <div
        className="relative flex flex-1 items-center border-2 py-5 pl-6 pr-5"
        style={{
          background: "linear-gradient(180deg, #1d1508 0%, #130f04 100%)",
          borderColor: config.borderColor,
          paddingBottom: "1.5rem",
        }}
      >
        {/* Corner accents (top-right, bottom-right) */}
        <div
          style={{
            position: "absolute",
            top: -1,
            right: -1,
            width: 10,
            height: 10,
            borderTop: `3px solid ${config.color}`,
            borderRight: `3px solid ${config.color}`,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -1,
            right: -1,
            width: 10,
            height: 10,
            borderBottom: `3px solid ${config.color}`,
            borderRight: `3px solid ${config.color}`,
          }}
        />

        {/* Character name floating above border */}
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

        {/* Speech arrow from portrait */}
        <div
          className="absolute left-0 top-1/2 h-0 w-0 -translate-y-1/2"
          style={{
            borderTop: "10px solid transparent",
            borderBottom: "10px solid transparent",
            borderRight: `10px solid ${config.borderColor}`,
          }}
        />
        <div
          className="absolute left-[7px] top-1/2 h-0 w-0 -translate-y-1/2"
          style={{
            borderTop: "8px solid transparent",
            borderBottom: "8px solid transparent",
            borderRight: "8px solid #130f04",
          }}
        />

        <p
          className="min-h-[44px] whitespace-pre-wrap text-[15px] leading-[1.8]"
          style={{
            margin: 0,
            color: "#E8D9B0",
            fontFamily: "'Courier New', monospace",
            textShadow: "0 1px 6px #00000077",
          }}
        >
          {displayed}
          {!done && (
            <span
              className="animate-blink align-middle opacity-80"
              style={{ color: config.color }}
            >
              ▮
            </span>
          )}
        </p>

        {done && (
          <div
            className="animate-bounce-y absolute bottom-2.5 right-4 text-[11px] tracking-wider"
            style={{
              color: `${config.color}99`,
              fontFamily: "'Courier New', monospace",
            }}
          >
            ▼ NEXT
          </div>
        )}
      </div>
    </div>
  );
}
