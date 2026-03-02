"use client";

import { useGameEngine } from "@/hooks/use-game-engine";
import { useEffect, useRef } from "react";

export function TimerBar() {
    const { timeRemaining, challenge } = useGameEngine();
    const maxTime = challenge?.timeLimitMs ?? 120_000;
    const pct = timeRemaining != null
        ? Math.max(0, Math.min(100, (timeRemaining / maxTime) * 100))
        : 100;

    // Color: green → yellow → red
    const color =
        pct > 50 ? "from-emerald-500 to-emerald-400"
            : pct > 20 ? "from-amber-500 to-yellow-400"
                : "from-red-600 to-rose-500";

    const formatTime = (ms: number | null) => {
        if (ms == null) return "--:--";
        const totalSec = Math.floor(ms / 1000);
        const m = Math.floor(totalSec / 60).toString().padStart(2, "0");
        const s = (totalSec % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    return (
        <div className="relative w-full h-2 border-b-2 border-foreground overflow-hidden" style={{ backgroundColor: "hsl(var(--editor-header))" }}>
            <div
                className={`h-full bg-gradient-to-r ${color} transition-all duration-1000 ease-linear`}
                style={{ width: `${pct}%` }}
            />
            {/* Floating time label */}
            <div
                className="absolute top-2.5 right-3 text-[10px] font-mono font-black text-slate-400 pointer-events-none select-none tracking-widest"
            >
                {formatTime(timeRemaining)}
            </div>
        </div>
    );
}
