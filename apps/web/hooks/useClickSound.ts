"use client";

import { useCallback, useRef } from "react";

const SFX_KEY = "lf_sfx_enabled";

function playClickSFX(type: "soft" | "hard" | "ui" = "soft") {
  try {
    const sfxEnabled = localStorage.getItem(SFX_KEY);
    if (sfxEnabled === "false") return; // respect settings toggle

    const ctx  = new (window.AudioContext || (window as any).webkitAudioContext)();
    const dest = ctx.destination;

    if (type === "soft") {
      // Soft mechanical key — light tap
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(2800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.018);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.022);
      osc.connect(gain); gain.connect(dest);
      osc.start(); osc.stop(ctx.currentTime + 0.025);

    } else if (type === "hard") {
      // Hard retro arcade press
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(3200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.03);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain); gain.connect(dest);
      osc.start(); osc.stop(ctx.currentTime + 0.045);

      // Sub thud
      const thud  = ctx.createOscillator();
      const tGain = ctx.createGain();
      thud.type = "sine";
      thud.frequency.setValueAtTime(100, ctx.currentTime + 0.005);
      thud.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.04);
      tGain.gain.setValueAtTime(0.08, ctx.currentTime + 0.005);
      tGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      thud.connect(tGain); tGain.connect(dest);
      thud.start(ctx.currentTime + 0.005);
      thud.stop(ctx.currentTime + 0.055);

    } else if (type === "ui") {
      // Tiny digital UI beep — toggle/switch
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(1600, ctx.currentTime + 0.03);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      osc.connect(gain); gain.connect(dest);
      osc.start(); osc.stop(ctx.currentTime + 0.07);
    }
  } catch {}
}

// Hook version — use inside components
export function useClickSound(type: "soft" | "hard" | "ui" = "soft") {
  return useCallback(() => playClickSFX(type), [type]);
}

// Standalone util — use anywhere without hooks
export { playClickSFX };
