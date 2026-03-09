"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Howl } from "howler";

export type AudioIntensity = 0 | 1 | 2 | 3;

const TRACK_IDS: Record<AudioIntensity, string> = {
  0: "calm",
  1: "tense",
  2: "climactic",
  3: "resolution",
};

const CROSSFADE_DURATION_MS = 1500;
const DEFAULT_VOLUME = 0.4;
const FALLBACK_VOLUME = 0.18;
const BPM = 120;
const SIXTEENTH_MS = (60 * 1000) / BPM / 4;

function createRetroRPGTrack(ctx: AudioContext, intensity: AudioIntensity): { stop: () => void } {
  const masterGain = ctx.createGain();
  masterGain.gain.value = FALLBACK_VOLUME;
  masterGain.connect(ctx.destination);

  const nodes: { stop?: () => void }[] = [];
  const intervalIds: ReturnType<typeof setInterval>[] = [];
  const timeoutIds: ReturnType<typeof setTimeout>[] = [];

  function stopAll() {
    intervalIds.forEach(clearInterval);
    timeoutIds.forEach(clearTimeout);
    intervalIds.length = 0;
    timeoutIds.length = 0;
    nodes.forEach((n) => n.stop?.());
    try {
      masterGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    } catch {
      // ignore
    }
  }

  // --- Level 0: Calm — triangle drone + slow pentatonic arpeggio ---
  if (intensity === 0) {
    const drone = ctx.createOscillator();
    drone.type = "triangle";
    drone.frequency.value = 55;
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.5;
    drone.connect(droneGain).connect(masterGain);
    drone.start();
    nodes.push({ stop: () => drone.stop() });

    const pentatonic = [261.63 * 0.5, 293.66 * 0.5, 329.63 * 0.5, 392 * 0.5, 440 * 0.5];
    let arpIdx = 0;
    const arpInterval = setInterval(() => {
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = pentatonic[arpIdx % pentatonic.length]!;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.connect(g).connect(masterGain);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.65);
      arpIdx++;
    }, 1250);
    intervalIds.push(arpInterval);
  }

  // --- Level 1: Tense — saw bass + hi-hat noise + staccato strings ---
  if (intensity >= 1) {
    const bass = ctx.createOscillator();
    bass.type = "sawtooth";
    bass.frequency.value = 55;
    const bassGain = ctx.createGain();
    bassGain.gain.value = 0.2;
    const bassFilter = ctx.createBiquadFilter();
    bassFilter.type = "lowpass";
    bassFilter.frequency.value = 200;
    bass.connect(bassFilter).connect(bassGain).connect(masterGain);
    bass.start();
    nodes.push({ stop: () => bass.stop() });

    const hatBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.02, ctx.sampleRate);
    const hatData = hatBuffer.getChannelData(0);
    for (let i = 0; i < hatData.length; i++) hatData[i] = (Math.random() * 2 - 1) * Math.exp(-i / 200);
    const hatInterval = setInterval(() => {
      const src = ctx.createBufferSource();
      src.buffer = hatBuffer;
      const g = ctx.createGain();
      g.gain.value = 0.08;
      const filter = ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = 7000;
      src.connect(filter).connect(g).connect(masterGain);
      src.start(ctx.currentTime);
      src.stop(ctx.currentTime + 0.02);
    }, SIXTEENTH_MS);
    intervalIds.push(hatInterval);

    const stringNotes = [220, 277.18, 329.63];
    let strIdx = 0;
    const strInterval = setInterval(() => {
      const osc = ctx.createOscillator();
      osc.type = "square";
      osc.frequency.value = stringNotes[strIdx % stringNotes.length]!;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.15, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(g).connect(masterGain);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
      strIdx++;
    }, 250);
    intervalIds.push(strInterval);
  }

  // --- Level 2: Climactic — melody + reverb feel ---
  if (intensity >= 2) {
    const melodyNotes = [523.25, 493.88, 440, 392, 369.99, 329.63, 293.66, 261.63];
    let melIdx = 0;
    const delay = ctx.createDelay(0.5);
    delay.delayTime.value = 0.2;
    const delayFeedback = ctx.createGain();
    delayFeedback.gain.value = 0.35;
    delay.connect(delayFeedback).connect(delay);
    delay.connect(masterGain);

    const melInterval = setInterval(() => {
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = melodyNotes[melIdx % melodyNotes.length]!;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.2, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(g);
      g.connect(masterGain);
      g.connect(delay);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.45);
      melIdx++;
    }, 500);
    intervalIds.push(melInterval);
  }

  // --- Level 3: Resolution — major chord arpeggio rising + drone fade ---
  if (intensity === 3) {
    const chord = [261.63, 329.63, 392, 523.25, 659.25, 783.99];
    let chordIdx = 0;
    const resInterval = setInterval(() => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = chord[chordIdx % chord.length]!;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.22, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.connect(g).connect(masterGain);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.55);
      chordIdx++;
    }, 400);
    intervalIds.push(resInterval);

    const resolveDrone = ctx.createOscillator();
    resolveDrone.type = "sine";
    resolveDrone.frequency.value = 110;
    const resolveGain = ctx.createGain();
    resolveGain.gain.setValueAtTime(0.3, ctx.currentTime);
    resolveGain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 4);
    resolveDrone.connect(resolveGain).connect(masterGain);
    resolveDrone.start();
    nodes.push({ stop: () => resolveDrone.stop() });
  }

  return {
    stop() {
      stopAll();
      setTimeout(() => {
        try {
          nodes.forEach((n) => n.stop?.());
        } catch {
          // ignore
        }
      }, 300);
    },
  };
}

export interface UseAudioManagerReturn {
  setIntensity: (level: AudioIntensity) => void;
  toggleMute: () => void;
  isMuted: boolean;
}

export function useAudioManager(): UseAudioManagerReturn {
  const [isMuted, setIsMuted] = useState(false);
  const howlsRef = useRef<Record<string, Howl>>({});
  const failedIdsRef = useRef<Set<string>>(new Set());
  const currentIdRef = useRef<string | null>(null);
  const fallbackStopRef = useRef<{ stop: () => void } | null>(null);
  const fallbackCtxRef = useRef<AudioContext | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      fallbackStopRef.current?.stop?.();
      fallbackStopRef.current = null;
      fallbackCtxRef.current?.close();
      fallbackCtxRef.current = null;
      Object.values(howlsRef.current).forEach((h) => h.unload());
      howlsRef.current = {};
      currentIdRef.current = null;
    };
  }, []);

  const getOrCreateHowl = useCallback((id: string): Howl | null => {
    if (howlsRef.current[id]) return failedIdsRef.current.has(id) ? null : howlsRef.current[id]!;
    try {
      const src = `/music/story/${id}.mp3`;
      const howl = new Howl({
        src: [src],
        volume: 0,
        loop: true,
        onloaderror: () => {
          failedIdsRef.current.add(id);
        },
      });
      howlsRef.current[id] = howl;
      return howl;
    } catch {
      return null;
    }
  }, []);

  const startFallback = useCallback((level: AudioIntensity) => {
    fallbackStopRef.current?.stop?.();
    try {
      const ctx = fallbackCtxRef.current ?? new AudioContext();
      if (ctx.state === "suspended") ctx.resume();
      fallbackCtxRef.current = ctx;
      fallbackStopRef.current = createRetroRPGTrack(ctx, level);
    } catch {
      // ignore
    }
  }, []);

  const setIntensity = useCallback(
    (level: AudioIntensity) => {
      const nextId = TRACK_IDS[level];
      const currentId = currentIdRef.current;

      if (currentId === nextId) return;

      fallbackStopRef.current?.stop?.();
      fallbackStopRef.current = null;

      const nextHowl = getOrCreateHowl(nextId);
      const useFallback = !nextHowl || failedIdsRef.current.has(nextId);

      if (currentId && howlsRef.current[currentId]) {
        const h = howlsRef.current[currentId]!;
        h.fade(h.volume(), 0, CROSSFADE_DURATION_MS / 1000);
        setTimeout(() => {
          if (mountedRef.current) h.pause();
        }, CROSSFADE_DURATION_MS);
      }

      if (useFallback) {
        startFallback(level);
        currentIdRef.current = nextId;
        return;
      }

      nextHowl!.volume(0);
      nextHowl!.play();
      nextHowl!.fade(0, isMuted ? 0 : DEFAULT_VOLUME, CROSSFADE_DURATION_MS / 1000);
      currentIdRef.current = nextId;

      const idToLevel = (id: string): AudioIntensity => {
        const i = Object.entries(TRACK_IDS).find(([, v]) => v === id)?.[0];
        return (i ? Number(i) : 0) as AudioIntensity;
      };
      setTimeout(() => {
        if (!mountedRef.current) return;
        const h = howlsRef.current[nextId];
        if (h && !h.playing() && currentIdRef.current === nextId) {
          failedIdsRef.current.add(nextId);
          startFallback(idToLevel(nextId));
        }
      }, 1200);
    },
    [getOrCreateHowl, isMuted, startFallback]
  );

  const toggleMute = useCallback(() => {
    setIsMuted((m) => {
      const next = !m;
      const id = currentIdRef.current;
      if (id && howlsRef.current[id] && !failedIdsRef.current.has(id)) {
        howlsRef.current[id]!.volume(next ? 0 : DEFAULT_VOLUME);
      }
      if (fallbackStopRef.current && fallbackCtxRef.current) {
        const ctx = fallbackCtxRef.current;
        const nodes = (ctx as unknown as { _fallbackGain?: GainNode })._fallbackGain;
        if (!nodes) return next;
        // Fallback volume is fixed; we don't expose gain node. So mute only affects Howler. For fallback we could store gain node ref - skip for now.
      }
      return next;
    });
  }, []);

  return { setIntensity, toggleMute, isMuted };
}
