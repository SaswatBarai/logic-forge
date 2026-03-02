"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useGameEngine } from "@/hooks/use-game-engine";
import { Loader2, Swords, CheckCircle2 } from "lucide-react";

export function MatchLobby() {
    const { sessionStatus, sessionId, config, readyUp } = useGameEngine();
    const [isReady, setIsReady] = useState(false);
    const autoReadyFiredRef = useRef(false);

    // Bug C fix: SINGLE player has no opponent to wait for — auto-fire PLAYER_READY
    // after 1.5s so the lobby shows briefly then the game starts automatically.
    useEffect(() => {
        if (
            config?.playerFormat !== "SINGLE" ||
            !sessionId ||
            sessionStatus === "ACTIVE" ||
            autoReadyFiredRef.current
        ) return;

        const timer = setTimeout(() => {
            autoReadyFiredRef.current = true;
            setIsReady(true);
            readyUp();
            console.info("[Lobby] Auto-fired PLAYER_READY for SINGLE player");
        }, 1500);

        return () => clearTimeout(timer);
    }, [sessionId, config?.playerFormat, sessionStatus, readyUp]);

    if (sessionStatus === "ACTIVE") {
        return null;
    }

    const handleReadyClick = () => {
        setIsReady(true);
        readyUp();
    };

    const isSingle = config?.playerFormat === "SINGLE";

    return (
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 lg:py-24 max-w-7xl mx-auto w-full">
            <motion.div
                className="flex flex-col items-center gap-10"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
                {/* Animated icon */}
                <motion.div
                    className="bg-primary/10 size-28 border-2 border-foreground flex items-center justify-center shadow-retro-lg"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                >
                    <Swords className="size-14 text-primary" />
                </motion.div>

                {/* Title */}
                <div className="text-center space-y-3">
                    <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">
                        {isSingle
                            ? "Solo Challenge Ready"
                            : sessionId ? "Opponent Found" : "Searching Arena"}
                    </h2>
                    <div className="border-2 border-foreground p-4 bg-card shadow-retro max-w-md mx-auto">
                        <p className="text-sm font-medium leading-relaxed">
                            {isSingle
                                ? "Arena loading. Your challenge begins in a moment…"
                                : sessionId
                                    ? "Preparing arena context. The duel is about to begin — get ready."
                                    : "Scanning the matchmaker queue for opponents of similar skill level…"}
                        </p>
                    </div>
                </div>

                {/* Status indicator */}
                {!sessionId && (
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

                {/* Ready button — only for DUAL players; SINGLE auto-fires via useEffect */}
                {sessionId && !isSingle && (
                    <motion.button
                        className={`arcade-btn px-10 py-5 border-2 border-foreground shadow-retro text-lg font-black uppercase tracking-widest flex items-center gap-3 ${isReady
                            ? "bg-accent text-accent-foreground cursor-default"
                            : "bg-primary"
                            }`}
                        whileHover={!isReady ? {
                            scale: 1.05,
                            boxShadow: "6px 6px 0px 0px hsl(var(--navy))",
                        } : {}}
                        whileTap={!isReady ? {
                            scale: 0.95,
                            x: 2,
                            y: 2,
                            boxShadow: "0px 0px 0px 0px hsl(var(--navy))",
                        } : {}}
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