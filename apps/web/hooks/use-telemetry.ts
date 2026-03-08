"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { getSocket } from "@/hooks/use-game-engine";
import { useAntiCheatStore } from "@/store/anti-cheat-store";

const KEYSTROKE_BURST_WINDOW_MS = 3000;
const KEYSTROKE_BURST_THRESHOLD = 40;
const INACTIVITY_MS = 10_000;

const WARNING_MESSAGES: Record<string, string> = {
  PASTE_DETECTED: "Paste detected — this action has been flagged.",
  FOCUS_LOST: "Tab switch detected — you left the arena.",
  KEYSTROKE_BURST: "Unusual typing burst detected.",
  MOUSE_INACTIVE: "Extended inactivity detected.",
};

export function useTelemetry(sessionId: string | null) {
  const { data: session } = useSession();
  const userId = session?.user?.email ?? session?.user?.id ?? null;

  const keystrokeCountRef = useRef(0);
  const keystrokeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inactivityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const pushWarning = useAntiCheatStore((s) => s.pushWarning);
  const setSessionId = useAntiCheatStore((s) => s.setSessionId);

  useEffect(() => {
    setSessionId(sessionId);
  }, [sessionId, setSessionId]);

  const emit = useCallback(
    (eventType: string, payload?: Record<string, unknown>) => {
      if (!sessionId || !userId) return;
      const socket = getSocket();
      if (!socket.connected) {
        console.warn("[AntiCheat] Socket not connected, skipping", eventType);
        return;
      }
      console.info("[AntiCheat] Emitting", eventType, { sessionId });
      socket.emit(eventType, {
        sessionId,
        userId,
        candidateId: userId,
        eventType,
        timestamp: new Date().toISOString(),
        payload: payload ?? undefined,
      });
    },
    [sessionId, userId]
  );

  useEffect(() => {
    if (!sessionId || !userId) return;

    console.info("[AntiCheat] Telemetry active for session", sessionId);

    // ─── visibilitychange → FOCUS_LOST / FOCUS_RESTORED ─────────────────
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        emit("FOCUS_LOST");
        pushWarning("FOCUS_LOST", WARNING_MESSAGES.FOCUS_LOST!);
      } else {
        emit("FOCUS_RESTORED");
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    // ─── paste → PASTE_DETECTED (block + warn) ──────────────────────────
    const onPaste = (e: Event) => {
      e.preventDefault();
      emit("PASTE_DETECTED");
      pushWarning("PASTE_DETECTED", WARNING_MESSAGES.PASTE_DETECTED!);
    };
    document.addEventListener("paste", onPaste, true);

    // ─── copy → also flag ───────────────────────────────────────────────
    const onCopy = (e: Event) => {
      emit("PASTE_DETECTED");
      pushWarning("PASTE_DETECTED", "Copy detected — this action has been flagged.");
    };
    document.addEventListener("copy", onCopy, true);

    // ─── context menu → block right-click ───────────────────────────────
    const onContextMenu = (e: Event) => {
      e.preventDefault();
    };
    document.addEventListener("contextmenu", onContextMenu, true);

    // ─── keydown counter (3s window) → KEYSTROKE_BURST if > 40 ──────────
    if (keystrokeIntervalRef.current) {
      clearInterval(keystrokeIntervalRef.current);
    }
    keystrokeCountRef.current = 0;
    keystrokeIntervalRef.current = setInterval(() => {
      const count = keystrokeCountRef.current;
      if (count > KEYSTROKE_BURST_THRESHOLD) {
        emit("KEYSTROKE_BURST", { count });
        pushWarning("KEYSTROKE_BURST", WARNING_MESSAGES.KEYSTROKE_BURST!);
      }
      keystrokeCountRef.current = 0;
    }, KEYSTROKE_BURST_WINDOW_MS);

    const scheduleInactivity = () => {
      if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
      inactivityTimeoutRef.current = setTimeout(() => {
        emit("MOUSE_INACTIVE");
        pushWarning("MOUSE_INACTIVE", WARNING_MESSAGES.MOUSE_INACTIVE!);
        inactivityTimeoutRef.current = null;
      }, INACTIVITY_MS);
    };
    const clearInactivity = () => {
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
        inactivityTimeoutRef.current = null;
      }
    };

    const onKeydown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "c" || e.key === "v")) {
        // ctrl+c / ctrl+v caught by copy/paste handlers
      }
      keystrokeCountRef.current += 1;
      lastActivityRef.current = Date.now();
      clearInactivity();
      scheduleInactivity();
    };

    const onMousemove = () => {
      lastActivityRef.current = Date.now();
      clearInactivity();
      scheduleInactivity();
    };

    document.addEventListener("keydown", onKeydown);
    document.addEventListener("mousemove", onMousemove);
    scheduleInactivity();

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("paste", onPaste, true);
      document.removeEventListener("copy", onCopy, true);
      document.removeEventListener("contextmenu", onContextMenu, true);
      document.removeEventListener("keydown", onKeydown);
      document.removeEventListener("mousemove", onMousemove);
      clearInactivity();
      if (keystrokeIntervalRef.current) {
        clearInterval(keystrokeIntervalRef.current);
        keystrokeIntervalRef.current = null;
      }
    };
  }, [sessionId, userId, emit, pushWarning]);
}
