"use client";

import { createContext, useContext, useMemo } from "react";
import { useAudioManager, type UseAudioManagerReturn } from "@/hooks/use-audio-manager";

const AudioManagerContext = createContext<UseAudioManagerReturn | null>(null);

export function AudioManagerProvider({ children }: { children: React.ReactNode }) {
  const api = useAudioManager();
  const value = useMemo(() => api, [api.setIntensity, api.toggleMute, api.isMuted]);
  return (
    <AudioManagerContext.Provider value={value}>
      {children}
    </AudioManagerContext.Provider>
  );
}

export function useAudioManagerContext(): UseAudioManagerReturn {
  const ctx = useContext(AudioManagerContext);
  if (!ctx) {
    return {
      setIntensity: () => {},
      toggleMute: () => {},
      isMuted: false,
    };
  }
  return ctx;
}
