"use client";

import { useGameStore } from "@/store/game-store";
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Clock, Zap } from "lucide-react";

const VERDICT_CONFIG: Record<string, {
    icon: React.ElementType;
    color: string;
    glow: string;
    label: string;
}> = {
    CORRECT: { icon: CheckCircle2, color: "text-emerald-400", glow: "shadow-emerald-500/30", label: "Correct!" },
    INCORRECT: { icon: XCircle, color: "text-rose-400", glow: "shadow-rose-500/30", label: "Incorrect" },
    TIMEOUT: { icon: Clock, color: "text-amber-400", glow: "shadow-amber-500/30", label: "Time's Up" },
    COMPILE_ERROR: { icon: XCircle, color: "text-orange-400", glow: "shadow-orange-500/30", label: "Compile Error" },
    RUNTIME_ERROR: { icon: XCircle, color: "text-rose-400", glow: "shadow-rose-500/30", label: "Runtime Error" },
    PARTIAL: { icon: Zap, color: "text-yellow-400", glow: "shadow-yellow-500/30", label: "Partial Credit" },
};

export function RoundResultOverlay() {
    const lastRoundResult = useGameStore((s) => s.lastRoundResult);
    const status = useGameStore((s) => s.status);
    const clearRoundResult = useGameStore((s) => s.clearRoundResult);

    const [countdown, setCountdown] = useState(3);

    // Show overlay only when there's a result and we're in inter-round LOBBY status
    const visible = !!lastRoundResult && status === "LOBBY";

    useEffect(() => {
        if (!visible) return;
        setCountdown(3);

        const interval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    clearRoundResult();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [visible, clearRoundResult]);

    if (!visible || !lastRoundResult) return null;

    const config = VERDICT_CONFIG[lastRoundResult.verdict] ?? VERDICT_CONFIG.INCORRECT;
    const Icon = config.icon;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
            <div className={`relative bg-zinc-900 border border-zinc-700 rounded-2xl p-10 flex flex-col items-center gap-6 shadow-2xl ${config.glow} max-w-sm w-full mx-4`}>
                {/* Glowing icon */}
                <div className={`relative`}>
                    <div className={`absolute inset-0 blur-xl rounded-full ${config.color} opacity-30`} />
                    <Icon className={`h-20 w-20 ${config.color} relative z-10`} />
                </div>

                {/* Verdict label */}
                <div className="text-center space-y-1">
                    <h2 className={`text-4xl font-black ${config.color}`}>{config.label}</h2>
                    <p className="text-zinc-400 text-sm">
                        Round {lastRoundResult.roundNumber} · {lastRoundResult.executionTimeMs}ms
                    </p>
                </div>

                {/* Score delta */}
                {lastRoundResult.score > 0 && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-full px-6 py-2 text-emerald-400 font-bold text-xl">
                        +{lastRoundResult.score} pts
                    </div>
                )}

                {/* Countdown */}
                <div className="text-zinc-500 text-sm font-mono">
                    Next round in <span className="text-zinc-300 font-bold">{countdown}</span>…
                </div>

                {/* Countdown progress ring */}
                <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-zinc-500 transition-all duration-1000 ease-linear"
                        style={{ width: `${(countdown / 3) * 100}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
