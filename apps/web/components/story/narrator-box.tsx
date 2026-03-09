"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useStorySFX } from "@/components/story/story-sfx-context";
import { useNarration } from "@/contexts/narration-context";

const TICK_EVERY_N_CHARS = 3;
const TYPEWRITER_SPEED_MS = 22;

export interface NarratorBoxProps {
  text: string;
  onNext: () => void;
}

/**
 * Full-width narrator line — no portrait, italic gold text,
 * labeled "✦ NARRATOR ✦", corner brackets. Click to advance or skip typewriter.
 */
export function NarratorBox({ text, onNext }: NarratorBoxProps) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const idxRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sfx = useStorySFX();
  const { speak, stop, enabled: narrationEnabled } = useNarration();

  const skip = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setDisplayed(text);
    setDone(true);
    stop();
  }, [text, stop]);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    idxRef.current = 0;
    stop();
    if (!text) {
      setDone(true);
      return;
    }
    speak(text, { interrupt: true });

    const tick = () => {
      idxRef.current += 1;
      if (idxRef.current >= text.length) {
        setDisplayed(text);
        setDone(true);
        return;
      }
      setDisplayed(text.slice(0, idxRef.current));
      if (idxRef.current % TICK_EVERY_N_CHARS === 0) sfx.play("textTick");
      timerRef.current = setTimeout(tick, TYPEWRITER_SPEED_MS);
    };
    timerRef.current = setTimeout(tick, TYPEWRITER_SPEED_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      stop();
    };
  }, [text, speak, stop, sfx]);

  const handleClick = () => {
    if (done) onNext();
    else skip();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleClick()}
      className="story-mode w-full cursor-pointer select-none font-['Courier_New',monospace] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
      style={{
        background: "linear-gradient(180deg, #1a1408 0%, #120e04 100%)",
        border: "2px solid #5A3E10",
        boxShadow: "0 0 0 1px #2a1e04, 0 4px 24px #00000099",
        padding: "18px 24px",
        position: "relative",
        userSelect: "none",
      }}
    >
      {/* Gold L-shaped corner brackets */}
      <div
        style={{
          position: "absolute",
          top: -1,
          left: -1,
          width: 10,
          height: 10,
          borderTop: "3px solid #C9A84C",
          borderLeft: "3px solid #C9A84C",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: -1,
          right: -1,
          width: 10,
          height: 10,
          borderTop: "3px solid #C9A84C",
          borderRight: "3px solid #C9A84C",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -1,
          left: -1,
          width: 10,
          height: 10,
          borderBottom: "3px solid #C9A84C",
          borderLeft: "3px solid #C9A84C",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -1,
          right: -1,
          width: 10,
          height: 10,
          borderBottom: "3px solid #C9A84C",
          borderRight: "3px solid #C9A84C",
        }}
      />

      {/* NARRATOR label */}
      <div
        style={{
          position: "absolute",
          top: -11,
          left: 20,
          background: "#1a1408",
          padding: "0 8px",
          fontSize: 10,
          letterSpacing: 3,
          color: "#C9A84C88",
          fontFamily: "'Courier New', monospace",
          textTransform: "uppercase",
        }}
      >
        ✦ NARRATOR ✦
      </div>

      <p
        style={{
          margin: 0,
          fontSize: 14,
          lineHeight: 1.85,
          color: "#C9B882",
          fontStyle: "italic",
          textShadow: "0 1px 4px #00000099",
          minHeight: 44,
        }}
      >
        {displayed}
        {!done && (
          <span className="animate-blink opacity-70">▮</span>
        )}
      </p>

      {done && (
        <div
          className="animate-bounce-y"
          style={{
            position: "absolute",
            bottom: 10,
            right: 16,
            fontSize: 11,
            color: "#C9A84C99",
            letterSpacing: 1,
            fontFamily: "'Courier New', monospace",
          }}
        >
          ▼ CONTINUE
        </div>
      )}
    </div>
  );
}
