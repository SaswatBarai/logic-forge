"use client";

import { useSession } from "next-auth/react";
import { useGameStore } from "@/store/game-store";
import { Heart, CheckCircle2, Loader2, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/** Renders hearts for a given live-count up to a maximum. */
function LivesRow({
    current,
    max,
    label,
    colorClass,
}: {
    current: number;
    max: number;
    label: string;
    colorClass: string;
}) {
    return (
        <div className="flex items-center gap-1.5">
            <span
                className={`text-[8px] font-black uppercase tracking-widest w-8 shrink-0 ${colorClass}`}
            >
                {label}
            </span>
            <div className="flex gap-0.5">
                {Array.from({ length: max }).map((_, i) => (
                    <Heart
                        key={i}
                        className={`size-3.5 ${i < current
                                ? `${colorClass} fill-current`
                                : "text-foreground/20"
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}

/**
 * Dual-player progress HUD — mounts inside the arena top bar.
 *
 * Timer Mode  → "You ✔ / Opponent: Still solving…" messaging.
 * Live Mode   → per-player round number + lives hearts side-by-side.
 */
export function DualProgressHud() {
    const { data: session } = useSession();
    const myUserId = session?.user?.email ?? session?.user?.id ?? "";

    const config = useGameStore((s) => s.config);
    const opponentProgress = useGameStore((s) => s.opponentProgress);
    const hasSubmittedThisRound = useGameStore((s) => s.hasSubmittedThisRound);
    const players = useGameStore((s) => s.players);
    const currentRound = useGameStore((s) => s.currentRound);
    const myLives = useGameStore((s) => s.myLives);

    // Only render for DUAL sessions
    if (config?.playerFormat !== "DUAL") return null;

    const maxLives = config.lives ?? 3;
    const isLiveMode = config.sessionType === "LIVE";

    const oppPlayer = players.find((p) => p.userId !== myUserId);
    const opponentLivesRemaining =
        opponentProgress?.livesRemaining ?? oppPlayer?.livesRemaining ?? maxLives;
    const opponentAnswered = opponentProgress?.answered ?? false;

    /* ── TIMER MODE HUD ─────────────────────────────────────────── */
    if (!isLiveMode) {
        return (
            <div className="flex items-center gap-3 px-3 py-1.5 border border-foreground/20 bg-card/50 shadow-sm">
                {/* You */}
                <div className="flex items-center gap-1.5">
                    <span className="text-[8px] font-black uppercase tracking-widest text-accent w-6">
                        You
                    </span>
                    <AnimatePresence mode="wait">
                        {hasSubmittedThisRound ? (
                            <motion.span
                                key="submitted"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-accent"
                            >
                                <CheckCircle2 className="size-3" />
                                Submitted
                            </motion.span>
                        ) : (
                            <motion.span
                                key="solving"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center gap-1 text-[9px] font-semibold text-foreground/60"
                            >
                                <Zap className="size-3" />
                                Solving…
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>

                <div className="h-5 w-px bg-foreground/20" />

                {/* Opponent */}
                <div className="flex items-center gap-1.5">
                    <span className="text-[8px] font-black uppercase tracking-widest text-destructive w-6">
                        Opp
                    </span>
                    <AnimatePresence mode="wait">
                        {opponentAnswered ? (
                            <motion.span
                                key="opp-done"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-accent"
                            >
                                <CheckCircle2 className="size-3" />
                                Done
                            </motion.span>
                        ) : (
                            <motion.span
                                key="opp-solving"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: [1, 0.5, 1] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="flex items-center gap-1 text-[9px] font-semibold text-foreground/50"
                            >
                                <Loader2 className="size-3 animate-spin" />
                                Solving…
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        );
    }

    /* ── LIVE MODE HUD ───────────────────────────────────────────── */
    const myRound = currentRound;
    const oppRound = opponentProgress?.round ?? currentRound;

    return (
        <div className="flex flex-col gap-1 px-3 py-1.5 border border-foreground/20 bg-card/50 shadow-sm min-w-[140px]">
            {/* Round numbers */}
            <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest">
                <span className="text-accent w-6">You</span>
                <span className="font-mono text-accent">R{myRound}</span>
                <span className="mx-1 text-foreground/20">|</span>
                <span className="text-destructive w-6">Opp</span>
                <span className="font-mono text-destructive">R{oppRound}</span>
            </div>

            {/* Lives rows */}
            {config.livesEnabled && (
                <div className="flex flex-col gap-0.5">
                    <LivesRow
                        current={myLives}
                        max={maxLives}
                        label="You"
                        colorClass="text-accent"
                    />
                    <LivesRow
                        current={opponentLivesRemaining}
                        max={maxLives}
                        label="Opp"
                        colorClass="text-destructive"
                    />
                </div>
            )}
        </div>
    );
}
