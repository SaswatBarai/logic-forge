"use client";

import {
  useEffect, useState, useRef, useCallback, useMemo, memo
} from "react";
import { motion, AnimatePresence, useAnimationControls, Variants } from "framer-motion";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const LOGO_WORD_1 = "LOGIC".split("");
const LOGO_WORD_2 = "FORGE".split("");
const ALL_LETTERS = [...LOGO_WORD_1, " ", ...LOGO_WORD_2];

const BOOT_LINES = [
  "INITIALIZING MATCHMAKER ENGINE",
  "LOADING CHALLENGE DATABASE",
  "CALIBRATING ANTI-CHEAT SYSTEM",
  "CONNECTING TO AP-SOUTH-1",
  "SPAWNING ARENA INSTANCES",
  "ALL SYSTEMS NOMINAL. READY",
];

const MILESTONES = [25, 50, 75, 100];

const GLITCH_CHARS = "!@#$%^&*<>[]{}|\\/?~`";

// ─────────────────────────────────────────────────────────────────────────────
// AUDIO ENGINE
// ─────────────────────────────────────────────────────────────────────────────

function useAudioEngine() {
  const ctxRef    = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const humRef    = useRef<OscillatorNode | null>(null);
  const mutedRef  = useRef(false);

  const getCtx = useCallback((): AudioContext | null => {
    try {
      if (!ctxRef.current) {
        ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        masterRef.current = ctxRef.current.createGain();
        masterRef.current.gain.setValueAtTime(1, ctxRef.current.currentTime);
        masterRef.current.connect(ctxRef.current.destination);
      }
      return ctxRef.current;
    } catch { return null; }
  }, []);

  const getDest = useCallback(() => masterRef.current, []);

  const resume = useCallback(async () => {
    const ctx = getCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") await ctx.resume();
  }, [getCtx]);

  const setMuted = useCallback((v: boolean) => {
    mutedRef.current = v;
    if (masterRef.current && ctxRef.current) {
      masterRef.current.gain.setTargetAtTime(
        v ? 0 : 1, ctxRef.current.currentTime, 0.05
      );
    }
  }, []);

  // Low ambient boot hum — layered oscillators
  const startHum = useCallback(() => {
    const ctx = getCtx(); const dest = getDest();
    if (!ctx || !dest) return;
    try {
      [40, 80, 160].forEach((freq, i) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        const filt = ctx.createBiquadFilter();
        filt.type = "lowpass"; filt.frequency.value = 200;
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.015 - i * 0.003, ctx.currentTime + 1.5);
        osc.connect(filt); filt.connect(gain); gain.connect(dest);
        osc.start();
        if (i === 0) humRef.current = osc;
      });
    } catch {}
  }, [getCtx, getDest]);

  const stopHum = useCallback(() => {
    try { humRef.current?.stop(); } catch {}
  }, []);

  // CRT static burst
  const playCRTStatic = useCallback(() => {
    const ctx = getCtx(); const dest = getDest();
    if (!ctx || !dest) return;
    try {
      const bufSize  = ctx.sampleRate * 0.12;
      const buffer   = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data     = buffer.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
      const src  = ctx.createBufferSource();
      const gain = ctx.createGain();
      const filt = ctx.createBiquadFilter();
      filt.type = "bandpass"; filt.frequency.value = 2000; filt.Q.value = 0.8;
      src.buffer = buffer;
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      src.connect(filt); filt.connect(gain); gain.connect(dest);
      src.start();
    } catch {}
  }, [getCtx, getDest]);

  // Mechanical keyboard key — layered click + thud
  const playKeyClick = useCallback(() => {
    const ctx = getCtx(); const dest = getDest();
    if (!ctx || !dest) return;
    try {
      // Click transient
      const click = ctx.createOscillator();
      const cGain = ctx.createGain();
      click.type = "square";
      click.frequency.setValueAtTime(3000, ctx.currentTime);
      click.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.015);
      cGain.gain.setValueAtTime(0.06, ctx.currentTime);
      cGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.018);
      click.connect(cGain); cGain.connect(dest);
      click.start(); click.stop(ctx.currentTime + 0.02);

      // Thud body
      const thud  = ctx.createOscillator();
      const tGain = ctx.createGain();
      thud.type = "sine";
      thud.frequency.setValueAtTime(120, ctx.currentTime + 0.005);
      thud.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.04);
      tGain.gain.setValueAtTime(0.05, ctx.currentTime + 0.005);
      tGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      thud.connect(tGain); tGain.connect(dest);
      thud.start(ctx.currentTime + 0.005);
      thud.stop(ctx.currentTime + 0.06);
    } catch {}
  }, [getCtx, getDest]);

  // Glitch noise burst
  const playGlitch = useCallback(() => {
    const ctx = getCtx(); const dest = getDest();
    if (!ctx || !dest) return;
    try {
      const bufSize = ctx.sampleRate * 0.06;
      const buffer  = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data    = buffer.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
      const src  = ctx.createBufferSource();
      const gain = ctx.createGain();
      const filt = ctx.createBiquadFilter();
      filt.type = "highpass"; filt.frequency.value = 1500;
      src.buffer = buffer;
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      src.connect(filt); filt.connect(gain); gain.connect(dest);
      src.start();
    } catch {}
  }, [getCtx, getDest]);

  // Letter drop — sawtooth pitch sweep
  const playLetterDrop = useCallback((index: number) => {
    const ctx = getCtx(); const dest = getDest();
    if (!ctx || !dest) return;
    try {
      const freq = 200 + index * 60;
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq * 2.5, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq, ctx.currentTime + 0.07);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
      osc.connect(gain); gain.connect(dest);
      osc.start(); osc.stop(ctx.currentTime + 0.1);
    } catch {}
  }, [getCtx, getDest]);

  // Progress tick — short digital beep
  const playTick = useCallback((milestone = false) => {
    const ctx = getCtx(); const dest = getDest();
    if (!ctx || !dest) return;
    try {
      const freq = milestone ? 1800 : 1000;
      const dur  = milestone ? 0.08 : 0.025;
      const vol  = milestone ? 0.12 : 0.04;
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      if (milestone) {
        osc.frequency.linearRampToValueAtTime(freq * 1.4, ctx.currentTime + 0.05);
      }
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.connect(gain); gain.connect(dest);
      osc.start(); osc.stop(ctx.currentTime + dur + 0.01);
    } catch {}
  }, [getCtx, getDest]);

  // Boot line confirm beep
  const playBootBeep = useCallback((index: number) => {
    const ctx = getCtx(); const dest = getDest();
    if (!ctx || !dest) return;
    try {
      const freq = 250 + index * 90;
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      const filt = ctx.createBiquadFilter();
      filt.type = "bandpass"; filt.frequency.value = freq * 2; filt.Q.value = 2;
      osc.type = "square";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(freq * 1.8, ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(filt); filt.connect(gain); gain.connect(dest);
      osc.start(); osc.stop(ctx.currentTime + 0.14);
    } catch {}
  }, [getCtx, getDest]);

  // Harmonic synth chime — loading complete
  const playReadyChime = useCallback(() => {
    const ctx = getCtx(); const dest = getDest();
    if (!ctx || !dest) return;
    try {
      const chord = [523, 659, 784, 1047]; // C5 E5 G5 C6
      chord.forEach((freq, i) => {
        [1, 2, 4].forEach((harmonic, h) => {
          const osc  = ctx.createOscillator();
          const gain = ctx.createGain();
          const filt = ctx.createBiquadFilter();
          filt.type = "lowpass"; filt.frequency.value = freq * harmonic * 1.5;
          osc.type = h === 0 ? "triangle" : "sine";
          osc.frequency.setValueAtTime(freq * harmonic, ctx.currentTime + i * 0.12);
          gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
          gain.gain.linearRampToValueAtTime(
            0.1 / (h + 1), ctx.currentTime + i * 0.12 + 0.03
          );
          gain.gain.exponentialRampToValueAtTime(
            0.001, ctx.currentTime + i * 0.12 + 0.6
          );
          osc.connect(filt); filt.connect(gain); gain.connect(dest);
          osc.start(ctx.currentTime + i * 0.12);
          osc.stop(ctx.currentTime + i * 0.12 + 0.65);
        });
      });
    } catch {}
  }, [getCtx, getDest]);

  // Start chime (splash press)
  const playStartChime = useCallback(() => {
    const ctx = getCtx(); const dest = getDest();
    if (!ctx || !dest) return;
    try {
      [330, 440, 550, 660].forEach((freq, i) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.07);
        gain.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(
          0.001, ctx.currentTime + i * 0.07 + 0.2
        );
        osc.connect(gain); gain.connect(dest);
        osc.start(ctx.currentTime + i * 0.07);
        osc.stop(ctx.currentTime + i * 0.07 + 0.22);
      });
    } catch {}
  }, [getCtx, getDest]);

  // Exit swoosh — descending filtered sweep
  const playExit = useCallback(() => {
    const ctx = getCtx(); const dest = getDest();
    if (!ctx || !dest) return;
    try {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      const filt = ctx.createBiquadFilter();
      filt.type = "lowpass"; filt.frequency.setValueAtTime(4000, ctx.currentTime);
      filt.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.6);
      osc.type = "sine";
      osc.frequency.setValueAtTime(900, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.6);
      gain.gain.setValueAtTime(0.14, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.connect(filt); filt.connect(gain); gain.connect(dest);
      osc.start(); osc.stop(ctx.currentTime + 0.65);
    } catch {}
  }, [getCtx, getDest]);

  return {
    resume, setMuted, startHum, stopHum,
    playCRTStatic, playKeyClick, playGlitch,
    playLetterDrop, playTick, playBootBeep,
    playReadyChime, playStartChime, playExit,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SPLASH SCREEN
// ─────────────────────────────────────────────────────────────────────────────

const SplashScreen = memo(function SplashScreen({
  onStart,
}: { onStart: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center gap-10 cursor-pointer select-none"
      onClick={onStart}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04, filter: "blur(8px)" }}
      transition={{ duration: 0.35 }}
    >
      {/* Scanlines */}
      <Scanlines />
      {/* HUD grid */}
      <HUDGrid />
      {/* Vignette */}
      <Vignette />

      {/* Corner brackets */}
      <Corners />

      {/* Logo */}
      <motion.div
        className="z-10 text-center flex flex-col items-center gap-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="text-5xl md:text-7xl font-black tracking-tighter">
          <span className="text-foreground">LOGIC </span>
          <span className="text-primary">FORGE</span>
        </div>
        <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-muted-foreground">
          AI-Proof Technical Evaluation Platform
        </p>
      </motion.div>

      {/* Press to start — blink */}
      <motion.div
        className="z-10"
        animate={{ opacity: [1, 0.2, 1] }}
        transition={{ repeat: Infinity, duration: 1.1 }}
      >
        <span className="text-xs font-black font-mono uppercase tracking-[0.4em] text-muted-foreground">
          ▶ &nbsp;PRESS ANY KEY OR CLICK TO START
        </span>
      </motion.div>

      {/* Insert coin border */}
      <motion.div
        className="z-10 border-2 border-foreground/20 px-6 py-2"
        animate={{
          borderColor: [
            "hsl(var(--foreground)/0.15)",
            "hsl(var(--primary))",
            "hsl(var(--foreground)/0.15)",
          ],
        }}
        transition={{ repeat: Infinity, duration: 2.2 }}
      >
        <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
          © 2026 LOGICFORGE · REGION: AP-SOUTH-1
        </span>
      </motion.div>
    </motion.div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// BACKGROUND ATMOSPHERE COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

const Scanlines = memo(function Scanlines() {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none z-10"
      animate={{ opacity: [0.04, 0.07, 0.04] }}
      transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
      style={{
        backgroundImage:
          "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.5) 2px, rgba(0,0,0,0.5) 4px)",
      }}
    />
  );
});

const HUDGrid = memo(function HUDGrid() {
  return (
    <div
      className="absolute inset-0 pointer-events-none z-0 opacity-[0.025]"
      style={{
        backgroundImage:
          "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }}
    />
  );
});

const Vignette = memo(function Vignette() {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none z-10"
      animate={{ opacity: [0.6, 0.9, 0.6] }}
      transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
      style={{
        background:
          "radial-gradient(ellipse at center, transparent 50%, hsl(var(--background)) 100%)",
      }}
    />
  );
});

const Corners = memo(function Corners() {
  return (
    <>
      {[
        "top-4 left-4 border-t-2 border-l-2",
        "top-4 right-4 border-t-2 border-r-2",
        "bottom-4 left-4 border-b-2 border-l-2",
        "bottom-4 right-4 border-b-2 border-r-2",
      ].map((cls, i) => (
        <motion.div
          key={i}
          className={`absolute ${cls} w-8 h-8 border-foreground/25`}
          initial={{ opacity: 0, scale: 1.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        />
      ))}
    </>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// GLITCH LETTER
// ─────────────────────────────────────────────────────────────────────────────

const GlitchLetter = memo(function GlitchLetter({
  char, index, isPrimary, started, onSound,
}: {
  char: string; index: number; isPrimary: boolean;
  started: boolean; onSound: (i: number) => void;
}) {
  const [dropped, setDropped]     = useState(false);
  const [glitching, setGlitching] = useState(false);
  const [glitchChar, setGlitchChar] = useState(char);

  // Random glitch burst after drop
  const triggerGlitch = useCallback(() => {
    let count = 0;
    const max = 4 + Math.floor(Math.random() * 4);
    const id = setInterval(() => {
      setGlitchChar(
        GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
      );
      setGlitching(true);
      count++;
      if (count >= max) {
        clearInterval(id);
        setGlitchChar(char);
        setGlitching(false);
      }
    }, 40);
  }, [char]);

  useEffect(() => {
    if (!started) return;
    const t = setTimeout(() => {
      setDropped(true);
      onSound(index);
      setTimeout(triggerGlitch, 60);
    }, 100 + index * 75);
    return () => clearTimeout(t);
  }, [started]);

  if (char === " ") return <span className="w-4 md:w-6 inline-block" />;

  return (
    <motion.span
      className={`relative inline-block font-black tracking-tighter select-none
        text-5xl md:text-7xl
        ${isPrimary ? "text-primary" : "text-foreground"}`}
      style={{ perspective: "600px" }}
      initial={{ opacity: 0, y: -60, rotateX: -100, scale: 0.8 }}
      animate={
        dropped
          ? { opacity: 1, y: 0, rotateX: 0, scale: 1 }
          : {}
      }
      transition={{
        type: "spring",
        stiffness: 280,
        damping: 18,
        delay: 0,
      }}
    >
      {/* Red channel offset */}
      {glitching && (
        <motion.span
          className="absolute inset-0 text-red-500/50 select-none"
          style={{ left: "-3px", top: "1px" }}
          aria-hidden
        >
          {glitchChar}
        </motion.span>
      )}
      {/* Cyan channel offset */}
      {glitching && (
        <motion.span
          className="absolute inset-0 text-cyan-400/50 select-none"
          style={{ left: "3px", top: "-1px" }}
          aria-hidden
        >
          {glitchChar}
        </motion.span>
      )}
      {/* Actual char */}
      <span className={glitching ? "opacity-80" : ""}>{glitchChar}</span>

      {/* Drop impact flash */}
      {dropped && (
        <motion.span
          className={`absolute inset-0 ${isPrimary ? "text-primary" : "text-white"} select-none`}
          initial={{ opacity: 0.9 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          aria-hidden
        >
          {char}
        </motion.span>
      )}
    </motion.span>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// TYPING BOOT LINE
// ─────────────────────────────────────────────────────────────────────────────

const TypingBootLine = memo(function TypingBootLine({
  text, lineIndex, onCharSound, onDone,
}: {
  text: string; lineIndex: number;
  onCharSound: () => void; onDone: () => void;
}) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone]           = useState(false);
  const doneRef = useRef(false);

  useEffect(() => {
    let i = 0;
    let id: ReturnType<typeof setTimeout>;

    const typeNext = () => {
      if (i >= text.length) {
        setDone(true);
        if (!doneRef.current) { doneRef.current = true; onDone(); }
        return;
      }
      // Random micro delay for organic feel
      const delay = 18 + Math.random() * 28;
      id = setTimeout(() => {
        i++;
        setDisplayed(text.slice(0, i));
        onCharSound();
        typeNext();
      }, delay);
    };

    typeNext();
    return () => clearTimeout(id);
  }, []);

  const isLast = lineIndex === BOOT_LINES.length - 1;

  return (
    <motion.div
      className="flex items-center gap-2"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.15 }}
    >
      <span className="text-foreground/30 shrink-0">&gt;</span>
      <span className={isLast && done ? "text-accent font-bold" : "text-muted-foreground"}>
        {displayed}
      </span>
      {/* Blinking cursor while typing */}
      {!done && (
        <motion.span
          className="text-primary font-bold shrink-0"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ repeat: Infinity, duration: 0.5 }}
        >
          ▌
        </motion.span>
      )}
      {/* Check on complete */}
      {done && isLast && (
        <motion.span
          className="text-accent font-bold ml-1 shrink-0"
          initial={{ opacity: 0, scale: 0, rotate: -20 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
        >
          ✓
        </motion.span>
      )}
    </motion.div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// PROGRESS BAR
// ─────────────────────────────────────────────────────────────────────────────

const ProgressBar = memo(function ProgressBar({
  progress,
}: { progress: number }) {
  const segments   = 20;
  const filled     = Math.floor((progress / 100) * segments);
  const isMilestone = MILESTONES.includes(progress);

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
    >
      <div className="flex justify-between text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
        <span>LOADING ARENA</span>
        <motion.span
          className="font-black text-primary"
          key={`pct-${Math.floor(progress / 5)}`}
          initial={{ scale: 1.4, color: "hsl(var(--accent))" }}
          animate={{ scale: 1, color: "hsl(var(--primary))" }}
          transition={{ duration: 0.15 }}
        >
          {progress}%
        </motion.span>
      </div>

      {/* Segmented bar */}
      <div className="w-full flex gap-[2px] relative">
        {Array.from({ length: segments }).map((_, i) => {
          const active = i < filled;
          const isEdge = i === filled - 1 && active;
          return (
            <motion.div
              key={i}
              className={`h-3 flex-1 relative overflow-hidden border border-foreground/10
                ${active
                  ? progress < 40 ? "bg-destructive"
                    : progress < 75 ? "bg-primary"
                    : "bg-accent"
                  : "bg-card"
                }`}
              animate={
                isMilestone && isEdge
                  ? { scaleY: [1, 1.6, 1], opacity: [1, 0.6, 1] }
                  : {}
              }
              transition={{ duration: 0.25 }}
            >
              {/* Shine sweep on active segments */}
              {active && (
                <motion.div
                  className="absolute inset-y-0 w-3 bg-white/25 skew-x-12"
                  animate={{ x: ["-200%", "400%"] }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.8,
                    ease: "linear",
                    delay: i * 0.04,
                  }}
                />
              )}
            </motion.div>
          );
        })}

        {/* Milestone pulse ring */}
        <AnimatePresence>
          {isMilestone && (
            <motion.div
              className="absolute inset-0 border-2 border-accent pointer-events-none"
              initial={{ opacity: 0.9, scaleX: 1 }}
              animate={{ opacity: 0, scaleX: 1.04 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Segment labels */}
      <div className="flex justify-between mt-1">
        {MILESTONES.map((v) => (
          <span
            key={v}
            className={`text-[8px] font-mono transition-colors duration-300 ${
              progress >= v ? "text-primary font-bold" : "text-foreground/20"
            }`}
          >
            {v}
          </span>
        ))}
      </div>
    </motion.div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN FLASH (on exit)
// ─────────────────────────────────────────────────────────────────────────────

const ScreenFlash = memo(function ScreenFlash({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="fixed inset-0 z-[10000] bg-white pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.85, 0.2, 0.6, 0] }}
          transition={{ duration: 0.5, times: [0, 0.1, 0.25, 0.4, 1] }}
        />
      )}
    </AnimatePresence>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PRELOADER
// ─────────────────────────────────────────────────────────────────────────────

export function PreLoader({ onComplete }: { onComplete: () => void }) {
  const [started, setStarted]         = useState(false);
  const [progress, setProgress]       = useState(0);
  const [activeLines, setActiveLines] = useState<number[]>([]);
  const [doneLines, setDoneLines]     = useState<number[]>([]);
  const [readyState, setReadyState]   = useState(false);
  const [flashing, setFlashing]       = useState(false);
  const [exiting, setExiting]         = useState(false);
  const [muted, setMutedState] = useState(() => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("lf_sfx_enabled") === "false";
  });
  const mutedRef = useRef(
  typeof window !== "undefined"
    ? localStorage.getItem("lf_sfx_enabled") === "false"
    : false
  );

  const audio = useAudioEngine();

  const safePlay = useCallback((fn: () => void) => {
    if (!mutedRef.current) fn();
  }, []);

  const toggleMute = useCallback(() => {
    mutedRef.current = !mutedRef.current;
    setMutedState(mutedRef.current);
    audio.setMuted(mutedRef.current);
  }, [audio]);

  // ── Start handler (requires user gesture) ─────────────────────────────────
  const handleStart = useCallback(async () => {
    await audio.resume();
    safePlay(audio.playStartChime);
    safePlay(audio.startHum);
    safePlay(audio.playCRTStatic);
    setStarted(true);
  }, [audio, safePlay]);

  useEffect(() => {
    if (started) return;
    const handler = () => handleStart();
    window.addEventListener("keydown", handler, { once: true });
    return () => window.removeEventListener("keydown", handler);
  }, [started, handleStart]);

  // ── Boot lines stagger ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!started) return;
    let delay = 250;
    BOOT_LINES.forEach((_, i) => {
      setTimeout(() => {
        setActiveLines((prev) => [...prev, i]);
      }, delay);
      // Each line takes ~text.length * ~23ms to type + buffer
      delay += BOOT_LINES[i].length * 23 + 280;
    });
  }, [started]);

  // ── Progress bar ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!started) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) { clearInterval(interval); return 100; }
        const next = prev + 1;
        const isMilestone = MILESTONES.includes(next);
        safePlay(() => audio.playTick(isMilestone));
        if (isMilestone) safePlay(audio.playCRTStatic);
        return next;
      });
    }, 28);
    return () => clearInterval(interval);
  }, [started]);

  // ── Complete sequence ──────────────────────────────────────────────────────
  useEffect(() => {
    if (progress < 100) return;
    setReadyState(true);
    safePlay(audio.playReadyChime);
    setTimeout(() => {
      setFlashing(true);
      safePlay(audio.playGlitch);
    }, 500);
    setTimeout(() => {
      safePlay(audio.playExit);
      audio.stopHum();
      setExiting(true);
    }, 900);
    setTimeout(() => onComplete(), 1700);
  }, [progress === 100]);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      <ScreenFlash active={flashing} />

      <AnimatePresence mode="wait">
        {/* ── SPLASH ── */}
        {!started && (
          <SplashScreen key="splash" onStart={handleStart} />
        )}

        {/* ── BOOT ── */}
        {started && !exiting && (
          <motion.div
            key="boot"
            className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{
              clipPath: ["inset(0% 0% 0% 0%)", "inset(0% 0% 100% 0%)"],
              filter: ["blur(0px)", "blur(6px)"],
              transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] },
            }}
          >
            <Scanlines />
            <HUDGrid />
            <Vignette />
            <Corners />

            {/* Mute */}
            <button
              onClick={toggleMute}
              className="absolute top-5 right-5 z-30 text-[9px] font-mono uppercase tracking-widest text-muted-foreground border border-foreground/20 px-3 py-1.5 hover:border-primary hover:text-primary transition-colors"
            >
              {muted ? "🔇 MUTED" : "🔊 SFX ON"}
            </button>

            {/* Content */}
            <div className="flex flex-col items-center gap-8 w-full max-w-lg px-8 relative z-20">

              {/* ── Logo ── */}
              <div className="flex items-center" style={{ perspective: "800px" }}>
                {ALL_LETTERS.map((letter, i) => (
                  <GlitchLetter
                    key={i}
                    char={letter}
                    index={i}
                    isPrimary={i >= 6}
                    started={started}
                    onSound={(idx) => safePlay(() => audio.playLetterDrop(idx))}
                  />
                ))}
              </div>

              {/* Tagline */}
              <motion.p
                className="text-[10px] font-mono uppercase tracking-[0.35em] text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1 }}
              >
                AI-Proof Technical Evaluation Platform
              </motion.p>

              {/* ── Terminal ── */}
              <motion.div
                className="w-full border-2 border-foreground/20 bg-card"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Title bar */}
                <div
                  className="flex items-center gap-2 px-4 py-2 border-b border-foreground/10"
                  style={{ backgroundColor: "hsl(var(--editor-header, var(--card)))" }}
                >
                  <div className="flex gap-1.5">
                    {["bg-destructive", "bg-primary", "bg-accent"].map((c, i) => (
                      <div key={i} className={`w-2.5 h-2.5 rounded-full border border-foreground/20 ${c}`} />
                    ))}
                  </div>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground ml-2">
                    BOOT SEQUENCE — LOGICFORGE OS v2.0
                  </span>
                  <motion.span
                    className="ml-auto text-[9px] text-accent"
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  >●</motion.span>
                </div>

                {/* Log */}
                <div className="p-4 font-mono text-xs space-y-2 min-h-[152px]">
                  {activeLines.map((lineIdx) => (
                    <TypingBootLine
                      key={lineIdx}
                      text={BOOT_LINES[lineIdx]}
                      lineIndex={lineIdx}
                      onCharSound={() => safePlay(audio.playKeyClick)}
                      onDone={() => {
                        setDoneLines((prev) => [...prev, lineIdx]);
                        safePlay(() => audio.playBootBeep(lineIdx));
                      }}
                    />
                  ))}
                </div>
              </motion.div>

              {/* ── Progress ── */}
              <ProgressBar progress={progress} />

              {/* ── Ready ── */}
              <AnimatePresence>
                {readyState && (
                  <motion.div
                    className="text-accent font-black font-mono uppercase tracking-[0.4em] text-sm"
                    initial={{ opacity: 0, y: 6, scale: 0.9 }}
                    animate={{ opacity: [0, 1, 0.7, 1], y: 0, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45 }}
                  >
                    ▶ ENTERING ARENA
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Status ── */}
              <motion.div
                className="flex items-center gap-4 text-[9px] font-mono uppercase tracking-widest text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                <span className="flex items-center gap-1.5">
                  <motion.span
                    className="w-1.5 h-1.5 rounded-full bg-accent"
                    animate={{ opacity: [1, 0.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  />
                  MATCHMAKER ONLINE
                </span>
                <span className="text-foreground/20">|</span>
                <span>PLAYERS: <span className="text-primary font-bold">1,842</span></span>
                <span className="text-foreground/20">|</span>
                <span>AP-SOUTH-1</span>
              </motion.div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

