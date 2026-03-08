"use client";

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export type AntiCheatEventType =
  | "PASTE_DETECTED"
  | "FOCUS_LOST"
  | "FOCUS_RESTORED"
  | "KEYSTROKE_BURST"
  | "MOUSE_INACTIVE";

export interface AntiCheatWarning {
  id: string;
  type: AntiCheatEventType;
  message: string;
  timestamp: number;
}

interface AntiCheatState {
  warnings: AntiCheatWarning[];
  eventCounts: Record<string, number>;
  riskScore: number;
  riskLevel: "SAFE" | "SUSPICIOUS" | "MEDIUM" | "HIGH";
  lastEventAt: number | null;
  sessionId: string | null;

  pushWarning: (type: AntiCheatEventType, message: string) => void;
  dismissWarning: (id: string) => void;
  setRiskScore: (score: number) => void;
  setSessionId: (id: string | null) => void;
  reset: () => void;
}

const RISK_LABELS: Record<string, "SAFE" | "SUSPICIOUS" | "MEDIUM" | "HIGH"> = {
  safe: "SAFE",
  suspicious: "SUSPICIOUS",
  medium: "MEDIUM",
  high: "HIGH",
};

function riskLevel(score: number): "SAFE" | "SUSPICIOUS" | "MEDIUM" | "HIGH" {
  if (score >= 80) return "HIGH";
  if (score >= 60) return "MEDIUM";
  if (score >= 40) return "SUSPICIOUS";
  return "SAFE";
}

let _warningCounter = 0;

export const useAntiCheatStore = create<AntiCheatState>()(
  immer((set) => ({
    warnings: [],
    eventCounts: {},
    riskScore: 0,
    riskLevel: "SAFE",
    lastEventAt: null,
    sessionId: null,

    pushWarning: (type, message) =>
      set((s) => {
        _warningCounter += 1;
        s.warnings.push({
          id: `ac-${_warningCounter}`,
          type,
          message,
          timestamp: Date.now(),
        });
        if (s.warnings.length > 10) s.warnings.shift();
        s.eventCounts[type] = (s.eventCounts[type] ?? 0) + 1;
        s.lastEventAt = Date.now();
      }),

    dismissWarning: (id) =>
      set((s) => {
        s.warnings = s.warnings.filter((w) => w.id !== id);
      }),

    setRiskScore: (score) =>
      set((s) => {
        s.riskScore = score;
        s.riskLevel = riskLevel(score);
      }),

    setSessionId: (id) =>
      set((s) => {
        if (id !== s.sessionId) {
          s.sessionId = id;
          s.warnings = [];
          s.eventCounts = {};
          s.riskScore = 0;
          s.riskLevel = "SAFE";
          s.lastEventAt = null;
        }
      }),

    reset: () =>
      set((s) => {
        s.warnings = [];
        s.eventCounts = {};
        s.riskScore = 0;
        s.riskLevel = "SAFE";
        s.lastEventAt = null;
        s.sessionId = null;
      }),
  }))
);
