"use client";

import { createContext, useContext, useRef, useCallback } from "react";

type SfxName =
  | "choiceSelect"
  | "xpGain"
  | "scarGained"
  | "debtPlanted"
  | "rankUp"
  | "bossAppear"
  | "timerTick"
  | "timerUrgent"
  | "zoneComplete"
  | "sceneTransition"
  | "streakBroken"
  | "textTick";

interface StorySFXContextValue {
  play: (name: SfxName) => void;
}

const StorySFXContext = createContext<StorySFXContextValue>({ play: () => {} });

function tone(
  ctx: AudioContext,
  freq: number,
  type: OscillatorType,
  duration: number,
  gain = 0.15,
  ramp?: number,
) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  if (ramp) osc.frequency.linearRampToValueAtTime(ramp, ctx.currentTime + duration);
  g.gain.setValueAtTime(gain, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(g).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

function playSound(ctx: AudioContext, name: SfxName) {
  switch (name) {
    case "choiceSelect":
      tone(ctx, 800, "sine", 0.06, 0.12);
      break;
    case "xpGain":
      tone(ctx, 523, "triangle", 0.12, 0.12);
      setTimeout(() => tone(ctx, 659, "triangle", 0.15, 0.12), 80);
      break;
    case "scarGained":
      tone(ctx, 180, "sawtooth", 0.35, 0.1);
      tone(ctx, 130, "sine", 0.4, 0.08);
      break;
    case "debtPlanted":
      tone(ctx, 400, "sine", 0.3, 0.1);
      setTimeout(() => tone(ctx, 300, "sine", 0.3, 0.06), 100);
      break;
    case "rankUp":
      tone(ctx, 523, "triangle", 0.1, 0.12);
      setTimeout(() => tone(ctx, 659, "triangle", 0.1, 0.12), 100);
      setTimeout(() => tone(ctx, 784, "triangle", 0.2, 0.14), 200);
      break;
    case "bossAppear":
      tone(ctx, 100, "sawtooth", 1.2, 0.06, 60);
      break;
    case "timerTick":
      tone(ctx, 1000, "sine", 0.025, 0.08);
      break;
    case "timerUrgent":
      tone(ctx, 1200, "sine", 0.02, 0.12);
      break;
    case "zoneComplete":
      tone(ctx, 523, "triangle", 0.1, 0.1);
      setTimeout(() => tone(ctx, 659, "triangle", 0.1, 0.1), 80);
      setTimeout(() => tone(ctx, 784, "triangle", 0.12, 0.1), 160);
      setTimeout(() => tone(ctx, 1047, "triangle", 0.25, 0.14), 250);
      break;
    case "sceneTransition":
      tone(ctx, 600, "sine", 0.15, 0.04, 400);
      break;
    case "streakBroken":
      tone(ctx, 400, "sawtooth", 0.15, 0.1);
      setTimeout(() => tone(ctx, 250, "sawtooth", 0.25, 0.08), 100);
      break;
    case "textTick":
      tone(ctx, 1100, "sine", 0.012, 0.03);
      break;
  }
}

export function StorySFXProvider({ children }: { children: React.ReactNode }) {
  const ctxRef = useRef<AudioContext | null>(null);

  const play = useCallback((name: SfxName) => {
    try {
      if (!ctxRef.current) ctxRef.current = new AudioContext();
      if (ctxRef.current.state === "suspended") ctxRef.current.resume();
      playSound(ctxRef.current, name);
    } catch {
      // Web Audio not supported
    }
  }, []);

  return (
    <StorySFXContext.Provider value={{ play }}>
      {children}
    </StorySFXContext.Provider>
  );
}

export function useStorySFX() {
  return useContext(StorySFXContext);
}
