"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "logicforge_story_voice";

const SENTENCE_GAP_MS = 200;
const DEFAULT_RATE = 0.83;
const DEFAULT_PITCH = 0.88;
const NARRATOR_RATE = 0.85;
const NARRATOR_PITCH = 0.85;

type NarrationContextValue = {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  speak: (text: string, opts?: { interrupt?: boolean }) => void;
  speakNarrator: (text: string, opts?: { interrupt?: boolean }) => void;
  stop: () => void;
  isSpeaking: boolean;
};

const NarrationContext = createContext<NarrationContextValue | null>(null);

function getStored(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === null ? true : v === "true";
  } catch {
    return true;
  }
}

function setStored(v: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, String(v));
  } catch {}
}

function pickFantasyVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const en = voices.filter((v) => v.lang.startsWith("en"));
  if (!en.length) return voices[0] ?? null;
  const lower = (s: string) => s.toLowerCase();
  const hasNatural = (v: SpeechSynthesisVoice) => lower(v.name).includes("natural");
  const hasRyan = (v: SpeechSynthesisVoice) => lower(v.name).includes("ryan");
  const hasGuy = (v: SpeechSynthesisVoice) => lower(v.name).includes("guy");
  const hasEric = (v: SpeechSynthesisVoice) => lower(v.name).includes("eric");
  const hasWilliam = (v: SpeechSynthesisVoice) => lower(v.name).includes("william");
  return (
    en.find((v) => hasNatural(v) && (hasRyan(v) || hasGuy(v) || hasEric(v) || hasWilliam(v))) ??
    en.find((v) => hasNatural(v)) ??
    en.find((v) => hasRyan(v)) ??
    en.find((v) => lower(v.name).includes("google")) ??
    en.find((v) => lower(v.name).includes("daniel")) ??
    en.find((v) => lower(v.name).includes("arthur")) ??
    en.find((v) => v.lang.startsWith("en-GB")) ??
    en.find((v) => v.lang.startsWith("en-US") && lower(v.name).includes("male")) ??
    en.find((v) => v.lang.startsWith("en-US")) ??
    en[0] ?? null
  );
}

function splitSentences(text: string): string[] {
  const t = text.trim();
  if (!t) return [];
  return t
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function NarrationProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabledState] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const mountedRef = useRef(true);
  const timeoutIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    mountedRef.current = true;
    setEnabledState(getStored());
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
    return () => {
      mountedRef.current = false;
      timeoutIdsRef.current.forEach(clearTimeout);
      timeoutIdsRef.current = [];
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    };
  }, []);

  const setEnabled = useCallback((v: boolean) => {
    setEnabledState(v);
    setStored(v);
    if (!v && typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      timeoutIdsRef.current.forEach(clearTimeout);
      timeoutIdsRef.current = [];
      setIsSpeaking(false);
    }
  }, []);

  const stop = useCallback(() => {
    timeoutIdsRef.current.forEach(clearTimeout);
    timeoutIdsRef.current = [];
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const speakChunked = useCallback(
    (text: string, opts: { interrupt?: boolean; rate: number; pitch: number }) => {
      if (typeof window === "undefined" || !window.speechSynthesis) return;
      if (!getStored()) return;
      if (opts.interrupt !== false) {
        window.speechSynthesis.cancel();
        timeoutIdsRef.current.forEach(clearTimeout);
        timeoutIdsRef.current = [];
      }
      const sentences = splitSentences(text);
      if (!sentences.length) return;

      const synth = window.speechSynthesis;
      const voices = synth.getVoices();
      const voice = pickFantasyVoice(voices) ?? undefined;

      const schedule = (idx: number) => {
        if (!mountedRef.current) return;
        const u = new SpeechSynthesisUtterance(sentences[idx]!);
        u.rate = opts.rate;
        u.pitch = opts.pitch;
        u.volume = 1;
        u.lang = "en-US";
        if (voice) u.voice = voice;
        u.onstart = () => {
          if (mountedRef.current) setIsSpeaking(true);
        };
        u.onend = () => {
          if (idx < sentences.length - 1) {
            const id = setTimeout(() => schedule(idx + 1), SENTENCE_GAP_MS);
            timeoutIdsRef.current.push(id);
          } else {
            if (mountedRef.current) setIsSpeaking(false);
          }
        };
        u.onerror = () => {
          if (idx >= sentences.length - 1 && mountedRef.current) setIsSpeaking(false);
        };
        synth.speak(u);
      };

      if (voices.length === 0) {
        const id = setTimeout(() => {
          timeoutIdsRef.current = timeoutIdsRef.current.filter((x) => x !== id);
          schedule(0);
        }, 100);
        timeoutIdsRef.current.push(id);
      } else {
        schedule(0);
      }
    },
    []
  );

  const speak = useCallback(
    (text: string, opts?: { interrupt?: boolean }) => {
      speakChunked(text, { interrupt: opts?.interrupt ?? true, rate: DEFAULT_RATE, pitch: DEFAULT_PITCH });
    },
    [speakChunked]
  );

  const speakNarrator = useCallback(
    (text: string, opts?: { interrupt?: boolean }) => {
      speakChunked(text, { interrupt: opts?.interrupt ?? true, rate: NARRATOR_RATE, pitch: NARRATOR_PITCH });
    },
    [speakChunked]
  );

  const value: NarrationContextValue = {
    enabled,
    setEnabled,
    speak,
    speakNarrator,
    stop,
    isSpeaking,
  };

  return (
    <NarrationContext.Provider value={value}>
      {children}
    </NarrationContext.Provider>
  );
}

export function useNarration(): NarrationContextValue {
  const ctx = useContext(NarrationContext);
  if (!ctx) {
    return {
      enabled: false,
      setEnabled: () => {},
      speak: () => {},
      speakNarrator: () => {},
      stop: () => {},
      isSpeaking: false,
    };
  }
  return ctx;
}
