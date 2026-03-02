"use client";

import { useGameStore } from "@/store/game-store";
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Clock, Zap } from "lucide-react";

type Verdict = "CORRECT" | "PARTIAL" | "INCORRECT" | "COMPILE_ERROR" | "RUNTIME_ERROR" | "TIMEOUT";

const VERDICT_CONFIG: Record<Verdict | string, {
    icon: React.ElementType;
    color: string;
    bg: string;
    label: string;
    sub?: string;
}> = {
    CORRECT: { icon: CheckCircle2, color: "text-accent", bg: "bg-accent", label: "Correct!" },
    PARTIAL: { icon: Zap, color: "text-primary", bg: "bg-primary", label: "Partial Credit", sub: "+50 pts" },
    INCORRECT: { icon: XCircle, color: "text-destructive", bg: "bg-destructive", label: "Incorrect" },
    TIMEOUT: { icon: Clock, color: "text-primary", bg: "bg-primary", label: "Time's Up" },
    COMPILE_ERROR: { icon: XCircle, color: "text-destructive", bg: "bg-destructive", label: "Compile Error" },
    RUNTIME_ERROR: { icon: XCircle, color: "text-destructive", bg: "bg-destructive", label: "Runtime Error" },
};

export function RoundResultOverlay() {
    // Use the actual store field names: lastResult + showResultOverlay + dismissResultOverlay
    const lastResult = useGameStore((s) => s.lastResult);
    const showResultOverlay = useGameStore((s) => s.showResultOverlay);
    const dismiss = useGameStore((s) => s.dismissResultOverlay);

    const [countdown, setCountdown] = useState(3);

    const visible = showResultOverlay && !!lastResult;

    useEffect(() => {
        if (!visible) return;
        setCountdown(3);

        const interval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0; // pure — no side effects here
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [visible]);

    // Trigger the global store update in the commit phase, not the render phase
    useEffect(() => {
        if (visible && countdown === 0) {
            dismiss();
        }
    }, [countdown, visible, dismiss]);

    if (!visible || !lastResult) return null;

    const verdict = (lastResult.verdict ?? (lastResult.passed ? "CORRECT" : "INCORRECT")) as Verdict;
    const config = VERDICT_CONFIG[verdict] ?? VERDICT_CONFIG.INCORRECT;
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
                        {lastResult.executionTimeMs > 0
                            ? `Executed in ${lastResult.executionTimeMs}ms`
                            : verdict === "COMPILE_ERROR" ? "Syntax / compile error"
                                : verdict === "RUNTIME_ERROR" ? "Program crashed at runtime"
                                    : verdict === "TIMEOUT" ? "Execution time limit exceeded"
                                        : "No execution data"}
                    </p>
                </div>

                {/* Score delta */}
                {lastResult.points > 0 && (
                    <div className="bg-accent/10 border-2 border-foreground px-6 py-2 shadow-retro-sm text-accent font-black text-xl">
                        +{lastResult.points} pts
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
