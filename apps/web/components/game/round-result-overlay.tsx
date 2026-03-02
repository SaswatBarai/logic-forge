"use client";

import { useGameStore } from "@/store/game-store";
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Clock, Zap } from "lucide-react";

const VERDICT_CONFIG: Record<string, {
    icon: React.ElementType;
    color: string;
    bg: string;
    label: string;
}> = {
    CORRECT: { icon: CheckCircle2, color: "text-accent", bg: "bg-accent", label: "Correct!" },
    INCORRECT: { icon: XCircle, color: "text-destructive", bg: "bg-destructive", label: "Incorrect" },
    TIMEOUT: { icon: Clock, color: "text-primary", bg: "bg-primary", label: "Time's Up" },
    COMPILE_ERROR: { icon: XCircle, color: "text-destructive", bg: "bg-destructive", label: "Compile Error" },
    RUNTIME_ERROR: { icon: XCircle, color: "text-destructive", bg: "bg-destructive", label: "Runtime Error" },
    PARTIAL: { icon: Zap, color: "text-primary", bg: "bg-primary", label: "Partial Credit" },
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative border-2 border-foreground bg-card shadow-retro-lg p-10 flex flex-col items-center gap-6 max-w-sm w-full mx-4">
                {/* Accent bar at top */}
                <div className={`absolute top-0 left-0 right-0 h-2 ${config.bg} border-b-2 border-foreground`} />

                {/* Icon */}
                <div className={`${config.bg}/10 size-20 border-2 border-foreground flex items-center justify-center mt-2`}>
                    <Icon className={`size-10 ${config.color}`} />
                </div>

                {/* Verdict label */}
                <div className="text-center space-y-2">
                    <h2 className={`text-4xl font-black uppercase tracking-tighter ${config.color}`}>{config.label}</h2>
                    <p className="text-sm font-medium text-muted-foreground">
                        Round {lastRoundResult.roundNumber} · {lastRoundResult.executionTimeMs}ms
                    </p>
                </div>

                {/* Score delta */}
                {lastRoundResult.score > 0 && (
                    <div className="bg-accent/10 border-2 border-foreground px-6 py-2 shadow-retro-sm text-accent font-black text-xl">
                        +{lastRoundResult.score} pts
                    </div>
                )}

                {/* Countdown */}
                <div className="text-sm font-mono font-bold text-muted-foreground">
                    Next round in <span className="text-foreground">{countdown}</span>…
                </div>

                {/* Countdown progress bar */}
                <div className="w-full h-1.5 border border-foreground overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-1000 ease-linear"
                        style={{ width: `${(countdown / 3) * 100}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
