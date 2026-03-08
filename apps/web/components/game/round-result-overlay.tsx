"use client";

import { useGameStore } from "@/store/game-store";
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Clock, Zap, Heart } from "lucide-react";

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
    // ✅ Correct store field names
    const lastResult = useGameStore((s) => s.lastResult);
    const showResultOverlay = useGameStore((s) => s.showResultOverlay);
    const dismissResultOverlay = useGameStore((s) => s.dismissResultOverlay);
    const sessionStatus = useGameStore((s) => s.sessionStatus);
    const myLives = useGameStore((s) => s.myLives);
    const config = useGameStore((s) => s.config);
    const currentRound = useGameStore((s) => s.currentRound);

    const isLiveMode = config?.sessionType === "LIVE";
    const isDualTimer = config?.playerFormat === "DUAL" && config?.sessionType === "TIMER";
    const livesEnabled = config?.livesEnabled ?? false;

    const [countdown, setCountdown] = useState(3);

    // In Timer Mode dual sessions, the overlay stays visible until the next
    // ROUND_START fires (which calls applyRoundStart → showResultOverlay=false).
    // In every other mode, auto-dismiss after 3 s.
    const autoDisable = isDualTimer;

    // Visible when overlay flag is set AND session is still active (not completed)
    const visible = showResultOverlay && !!lastResult && sessionStatus !== "COMPLETED";

    useEffect(() => {
        if (!visible) return;
        if (autoDisable) return; // Timer-dual: hold until next ROUND_START

        setCountdown(3);

        const interval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    dismissResultOverlay();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [visible, autoDisable, dismissResultOverlay]);

    // For Timer-dual mode: also read opponent progress to show opponent status
    const opponentProgress = useGameStore((s) => s.opponentProgress);
    const opponentAnswered = isDualTimer ? (opponentProgress?.answered ?? false) : false;

    if (!visible || !lastResult) return null;

    const verdictCfg = VERDICT_CONFIG[lastResult.verdict] ?? VERDICT_CONFIG.INCORRECT;
    const Icon = verdictCfg.icon;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative border-2 border-foreground bg-card shadow-retro-lg p-10 flex flex-col items-center gap-6 max-w-sm w-full mx-4">
                {/* Accent bar */}
                <div className={`absolute top-0 left-0 right-0 h-2 ${verdictCfg.bg} border-b-2 border-foreground`} />

                {/* Icon */}
                <div className={`${verdictCfg.bg}/10 size-20 border-2 border-foreground flex items-center justify-center mt-2`}>
                    <Icon className={`size-10 ${verdictCfg.color}`} />
                </div>

                {/* Verdict label */}
                <div className="text-center space-y-2">
                    <h2 className={`text-4xl font-black uppercase tracking-tighter ${verdictCfg.color}`}>
                        {verdictCfg.label}
                    </h2>
                    <p className="text-sm font-semibold text-foreground/85">
                        Round {currentRound} · {lastResult.executionTimeMs > 0 ? `${lastResult.executionTimeMs}ms` : "—"}
                    </p>
                </div>

                {/* Score delta */}
                {lastResult.points > 0 && (
                    <div className="bg-accent/10 border-2 border-foreground px-6 py-2 shadow-retro-sm text-accent font-black text-xl">
                        +{lastResult.points} pts
                    </div>
                )}

                {/* ✅ Lives — only show in Live mode with livesEnabled */}
                {isLiveMode && livesEnabled && (
                    <div className="flex items-center gap-2">
                        {Array.from({ length: config?.lives ?? 3 }).map((_, i) => (
                            <Heart
                                key={i}
                                className={`size-6 ${i < myLives ? "text-destructive fill-destructive" : "text-muted-foreground"}`}
                            />
                        ))}
                        <span className="text-xs font-black uppercase tracking-widest text-foreground/85 ml-1">
                            {myLives} remaining
                        </span>
                    </div>
                )}

                {/* Countdown / waiting-for-opponent */}
                {isDualTimer ? (
                    // Timer Mode dual: show opponent status while waiting
                    <div className="flex flex-col items-center gap-1">
                        <div className="text-sm font-mono font-bold text-foreground/85">
                            {opponentAnswered ? (
                                <span className="text-accent font-black">Opponent finished! Starting next round…</span>
                            ) : (
                                <span className="animate-pulse">Waiting for opponent<span className="">…</span></span>
                            )}
                        </div>
                        {/* Pulsing dot indicator */}
                        {!opponentAnswered && (
                            <div className="flex gap-1 mt-1">
                                {[0, 1, 2].map((i) => (
                                    <span
                                        key={i}
                                        className="size-1.5 rounded-full bg-primary animate-bounce"
                                        style={{ animationDelay: `${i * 0.15}s` }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    // Live Mode / Solo: countdown
                    <div className="text-sm font-mono font-bold text-foreground/85">
                        Next round in <span className="text-foreground font-black">{countdown}</span>…
                    </div>
                )}

                {/* Countdown bar — only shown in auto-dismiss modes */}
                {!isDualTimer && (
                    <div className="w-full h-1.5 border border-foreground overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-1000 ease-linear"
                            style={{ width: `${(countdown / 3) * 100}%` }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
