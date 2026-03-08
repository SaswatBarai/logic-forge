"use client";

import { useEffect, useRef } from "react";
import { useGameStore } from "@/store/game-store";
import { motion } from "framer-motion";

interface OpponentTelemetryProps {
    /** Your progress 0..1 (e.g. codeLength / templateLength) */
    myProgress?: number;
    /** Your current code length (for display) */
    myCodeLength?: number;
    /** Callback when opponent progress jumps by more than threshold (for SFX) */
    onOpponentProgressJump?: () => void;
}

const PROGRESS_JUMP_THRESHOLD = 0.2;

export function OpponentTelemetry({
    myProgress = 0,
    myCodeLength = 0,
    onOpponentProgressJump,
}: OpponentTelemetryProps) {
    const opponentTelemetry = useGameStore((s) => s.opponentTelemetry);
    const prevProgressRef = useRef<number>(0);

    useEffect(() => {
        if (opponentTelemetry == null) return;
        const prev = prevProgressRef.current;
        const next = opponentTelemetry.progress;
        if (next - prev >= PROGRESS_JUMP_THRESHOLD && onOpponentProgressJump) {
            onOpponentProgressJump();
        }
        prevProgressRef.current = next;
    }, [opponentTelemetry?.progress, opponentTelemetry, onOpponentProgressJump]);

    const myPct = Math.min(100, Math.max(0, (myProgress ?? 0) * 100));
    const oppPct = opponentTelemetry
        ? Math.min(100, Math.max(0, opponentTelemetry.progress * 100))
        : 0;
    const showTypingIndicator = opponentTelemetry != null && !opponentTelemetry.submitted && opponentTelemetry.wpm > 80;

    return (
        <div className="flex flex-col gap-2 w-full max-w-xs">
            <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-widest text-foreground/50">
                <span>You</span>
                <span>{Math.round(myPct)}%</span>
            </div>
            <div className="h-2 w-full bg-foreground/10 border border-foreground/20 overflow-hidden">
                <motion.div
                    className="h-full bg-primary"
                    initial={false}
                    animate={{ width: `${myPct}%` }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                />
            </div>

            <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-widest text-foreground/50">
                <span>Opponent</span>
                {opponentTelemetry?.submitted ? (
                    <span className="text-accent font-bold">{opponentTelemetry.verdict ?? "Done"}</span>
                ) : (
                    <span>{Math.round(oppPct)}%</span>
                )}
            </div>
            <div className="h-2 w-full bg-foreground/10 border border-foreground/20 overflow-hidden">
                <motion.div
                    className="h-full bg-destructive/80"
                    initial={false}
                    animate={{ width: `${oppPct}%` }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                />
            </div>

            {showTypingIndicator && (
                <motion.div
                    className="flex items-center gap-1.5 text-[9px] font-mono text-foreground/60"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.span
                        className="w-1.5 h-1.5 rounded-full bg-destructive"
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                    />
                    <span>Typing…</span>
                    <span className="text-foreground/40">{opponentTelemetry.wpm} wpm</span>
                </motion.div>
            )}

            {opponentTelemetry?.submitted && opponentTelemetry.verdict && (
                <div className="text-[9px] font-mono uppercase tracking-wide text-foreground/60">
                    Opponent submitted: {opponentTelemetry.verdict}
                </div>
            )}
        </div>
    );
}
