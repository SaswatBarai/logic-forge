"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, ShieldCheck, ShieldX, Eye, X, AlertTriangle, ClipboardPaste, MonitorX, Mouse, Keyboard } from "lucide-react";
import { useAntiCheatStore, type AntiCheatEventType } from "@/store/anti-cheat-store";

const EVENT_ICONS: Record<AntiCheatEventType, React.ElementType> = {
  PASTE_DETECTED: ClipboardPaste,
  FOCUS_LOST: MonitorX,
  FOCUS_RESTORED: Eye,
  KEYSTROKE_BURST: Keyboard,
  MOUSE_INACTIVE: Mouse,
};

const RISK_CONFIG = {
  SAFE: { color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/30", icon: ShieldCheck, label: "SECURE" },
  SUSPICIOUS: { color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/30", icon: ShieldAlert, label: "CAUTION" },
  MEDIUM: { color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/30", icon: ShieldAlert, label: "FLAGGED" },
  HIGH: { color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30", icon: ShieldX, label: "HIGH RISK" },
} as const;

const WARNING_AUTO_DISMISS_MS = 4000;

interface Props {
  sessionId: string | null;
}

export function AntiCheatHUD({ sessionId }: Props) {
  const warnings = useAntiCheatStore((s) => s.warnings);
  const riskScore = useAntiCheatStore((s) => s.riskScore);
  const riskLevel = useAntiCheatStore((s) => s.riskLevel);
  const setRiskScore = useAntiCheatStore((s) => s.setRiskScore);
  const dismissWarning = useAntiCheatStore((s) => s.dismissWarning);
  const eventCounts = useAntiCheatStore((s) => s.eventCounts);

  // Poll risk score from anti-cheat service every 10s
  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/anti-cheat/${sessionId}`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          if (typeof data.riskScore === "number") {
            setRiskScore(data.riskScore);
          }
        }
      } catch {
        // anti-cheat service may be down
      }
    };
    poll();
    const interval = setInterval(poll, 10_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [sessionId, setRiskScore]);

  // Auto-dismiss old warnings
  useEffect(() => {
    if (warnings.length === 0) return;
    const oldest = warnings[0];
    if (!oldest) return;
    const age = Date.now() - oldest.timestamp;
    const delay = Math.max(100, WARNING_AUTO_DISMISS_MS - age);
    const t = setTimeout(() => dismissWarning(oldest.id), delay);
    return () => clearTimeout(t);
  }, [warnings, dismissWarning]);

  const risk = RISK_CONFIG[riskLevel];
  const RiskIcon = risk.icon;

  const totalFlags = Object.values(eventCounts).reduce((a, b) => a + b, 0);

  return (
    <>
      {/* Risk badge in top HUD */}
      <div className={`flex items-center gap-1.5 px-2.5 py-1 border-2 ${risk.border} ${risk.bg} transition-colors duration-300`}>
        <RiskIcon className={`w-3.5 h-3.5 ${risk.color}`} />
        <span className={`text-[9px] font-black uppercase tracking-widest ${risk.color}`}>
          {risk.label}
        </span>
        {totalFlags > 0 && (
          <span className={`text-[9px] font-mono font-bold ${risk.color} ml-1`}>
            ({totalFlags})
          </span>
        )}
      </div>

      {/* Warning toasts */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none max-w-sm">
        <AnimatePresence mode="popLayout">
          {warnings.map((w) => {
            const WIcon = EVENT_ICONS[w.type] ?? AlertTriangle;
            return (
              <motion.div
                key={w.id}
                initial={{ opacity: 0, x: 80, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 80, scale: 0.9 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="pointer-events-auto flex items-start gap-3 px-4 py-3 bg-red-950/90 border-2 border-red-500/60 shadow-lg backdrop-blur-md"
              >
                <div className="mt-0.5 p-1.5 bg-red-500/20 border border-red-500/40">
                  <WIcon className="w-4 h-4 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-widest text-red-400 mb-0.5">
                    Anti-Cheat Warning
                  </p>
                  <p className="text-xs font-medium text-red-200/90 leading-snug">
                    {w.message}
                  </p>
                </div>
                <button
                  onClick={() => dismissWarning(w.id)}
                  className="mt-0.5 text-red-400/60 hover:text-red-300 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </>
  );
}
