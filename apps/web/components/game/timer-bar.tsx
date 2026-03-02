"use client";

import { useGameEngine } from "@/hooks/use-game-engine";

export function TimerBar() {
    const { timeRemaining, challenge, config } = useGameEngine();

    // Live Mode has no countdown timer — hide the bar entirely
    if (config?.sessionType === "LIVE") return null;

    const maxTime = challenge?.timeLimitMs ?? 60_000;
    const pct = timeRemaining != null
        ? Math.max(0, Math.min(100, (timeRemaining / maxTime) * 100))
        : 100;

    // Color: green → yellow → red
    const color =
        pct > 50 ? "from-emerald-500 to-emerald-400"
            : pct > 20 ? "from-amber-500 to-yellow-400"
                : "from-red-600 to-rose-500";

    // Pulse urgency when < 15%
    const urgent = pct < 15;

    const formatTime = (ms: number | null) => {
        if (ms == null) return "--:--";
        const totalSec = Math.ceil(ms / 1000);
        const m = Math.floor(totalSec / 60).toString().padStart(2, "0");
        const s = (totalSec % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    return (
        <div
            className="relative w-full h-3 border-b-2 border-foreground overflow-visible"
            style={{ backgroundColor: "hsl(var(--editor-header))" }}
        >
            {/* Progress fill */}
            <div
                className={`h-full bg-gradient-to-r ${color} transition-all duration-1000 ease-linear ${urgent ? "animate-pulse" : ""}`}
                style={{ width: `${pct}%` }}
            />
            {/* Floating time label */}
            <div
                className={`absolute top-3 right-3 text-[10px] font-mono font-black pointer-events-none select-none tracking-widest transition-colors ${urgent ? "text-red-400 animate-pulse" : "text-slate-400"
                    }`}
            >
                {formatTime(timeRemaining)}
            </div>
        </div>
    );
}
