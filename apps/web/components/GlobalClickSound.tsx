"use client";

import { useEffect } from "react";
import { playClickSFX } from "@/hooks/useClickSound";

const INTERACTIVE = [
  "button", "a", "[role='button']",
  "[role='tab']", "[role='menuitem']",
  "[role='checkbox']", "[role='switch']",
  "input[type='checkbox']", "input[type='radio']",
  "label", "summary",
];

export function GlobalClickSound() {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const isInteractive = INTERACTIVE.some(selector => {
        try { return target.closest(selector) !== null; }
        catch { return false; }
      });

      if (!isInteractive) return;

      // Choose sound type based on element
      const el = target.closest("button, a, [role='button']");
      if (!el) {
        playClickSFX("ui");
        return;
      }

      const text = (el.textContent || "").toLowerCase();
      const isHeavy =
        el.classList.contains("arcade-btn") ||
        text.includes("enter") ||
        text.includes("start") ||
        text.includes("save") ||
        text.includes("arena") ||
        text.includes("delete") ||
        text.includes("disconnect");

      playClickSFX(isHeavy ? "hard" : "soft");
    };

    window.addEventListener("click", handler, { passive: true });
    return () => window.removeEventListener("click", handler);
  }, []);

  return null; // renders nothing
}
