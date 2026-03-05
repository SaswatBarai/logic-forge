"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useGameEngine } from "@/hooks/use-game-engine";
import { Loader2, Swords, CheckCircle2, User, Users } from "lucide-react";

export default function MatchLobby() {
    const { sessionStatus, sessionId, config, readyUp } = useGameEngine();
    const [isReady, setIsReady] = useState(false);
    const [countdown, setCountdown] = useState(2);

    const isSingle = config?.playerFormat === "SINGLE";

    // ── SINGLE: auto-ready after a brief lobby display ───────────────────
    useEffect(() => {
        if (!sessionId || !isSingle) return;

        // Countdown ticker
        const ticker = setInterval(() => {
            setCountdown((c) => Math.max(0, c - 1));
        }, 1000);

        // Auto-fire PLAYER_READY after 2s
        const t = setTimeout(() => {
            setIsReady(true);
            readyUp();
        }, 2000);

        return () => {
            clearInterval(ticker);
            clearTimeout(t);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId, isSingle]);

    if (sessionStatus === "ACTIVE") return null;

    const handleReadyClick = () => {
        if (isReady) return;
        setIsReady(true);
        readyUp();
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 lg:py-24 max-w-7xl mx-auto w-full">
            <motion.div
                className="flex flex-col items-center gap-10"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
                {/* Icon */}
                <motion.div
                    className="bg-primary/10 size-28 border-2 border-foreground flex items-center justify-center shadow-retro-lg"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                >
                    <Swords className="size-14 text-primary" />
                </motion.div>

                {/* Mode badge */}
                <div className="flex items-center gap-2 px-4 py-2 border-2 border-foreground bg-card shadow-retro-sm">
                    {isSingle
                        ? <User className="size-4 text-primary" />
                        : <Users className="size-4 text-primary" />}
                    <span className="text-xs font-black uppercase tracking-widest">
                        {isSingle ? "Solo Run" : "Dual Engine"}
                    </span>
                </div>

                {/* Title */}
                <div className="text-center space-y-3">
                    <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">
                        {isSingle
                            ? "Arena Ready"
                            : sessionId ? "Opponent Found" : "Searching Arena"}
                    </h2>
                    <div className="border-2 border-foreground p-4 bg-card shadow-retro max-w-md mx-auto">
                        <p className="text-sm font-medium leading-relaxed">
                            {isSingle
                                ? "Your solo session is locked in. Entering arena…"
                                : sessionId
                                    ? "Opponent located. Both players must ready up to begin."
                                    : "Scanning the matchmaker queue for opponents of similar skill level…"}
                        </p>
                    </div>
                </div>

                {/* ── SINGLE: auto-countdown ── */}
                {isSingle && (
                    <motion.div
                        className="flex flex-col items-center gap-3"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        {!isReady ? (
                            <>
                                <div className="text-6xl font-black font-mono text-primary">
                                    {countdown}
                                </div>
                                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                                    Starting in…
                                </p>
                            </>
                        ) : (
                            <div className="flex items-center gap-3 px-5 py-3 border-2 border-foreground bg-accent shadow-retro-sm">
                                <CheckCircle2 className="size-5 text-accent-foreground" />
                                <span className="text-sm font-black uppercase tracking-widest text-accent-foreground">
                                    Launching Arena…
                                </span>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* ── DUAL: searching pulse ── */}
                {!isSingle && !sessionId && (
                    <motion.div
                        className="flex items-center gap-3 px-5 py-3 border-2 border-foreground bg-card shadow-retro-sm"
                        animate={{ opacity: [1, 0.6, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                    >
                        <Loader2 className="size-4 animate-spin text-primary" />
                        <span className="text-xs font-black uppercase tracking-widest">
                            Matchmaker Queued
                        </span>
                    </motion.div>
                )}

                {/* ── DUAL: ready up button ── */}
                {!isSingle && sessionId && (
                    <motion.button
                        className={`arcade-btn px-10 py-5 border-2 border-foreground shadow-retro text-lg font-black uppercase tracking-widest flex items-center gap-3 ${isReady
                                ? "bg-accent text-accent-foreground cursor-default"
                                : "bg-primary cursor-pointer"
                            }`}
                        whileHover={!isReady ? { scale: 1.05, boxShadow: "6px 6px 0px 0px hsl(var(--navy))" } : {}}
                        whileTap={!isReady ? { scale: 0.95, x: 2, y: 2, boxShadow: "0px 0px 0px 0px hsl(var(--navy))" } : {}}
                        onClick={handleReadyClick}
                        disabled={isReady}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        {isReady ? (
                            <>
                                <CheckCircle2 className="size-5" />
                                Waiting for Opponent…
                            </>
                        ) : (
                            "Ready Up"
                        )}
                    </motion.button>
                )}
            </motion.div>
        </div>
    );
}
