"use client";

import { motion } from "framer-motion";
import { useGameEngine } from "@/hooks/use-game-engine";
import { useGameStore }  from "@/store/game-store";
import { Loader2, Swords } from "lucide-react";

export function MatchLobby() {
    // ── Pull what actually exists in the hook + store ─────────────────────
    const { sessionStatus, matchStatus } = useGameEngine();
    const players = useGameStore((s) => s.players);

    const isMatched  = matchStatus === "MATCHED";
    const isSearching = matchStatus === "QUEUED";

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

                {/* Title */}
                <div className="text-center space-y-3">
                    <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">
                        {isMatched ? "Opponent Found" : "Searching Arena"}
                    </h2>
                    <div className="border-2 border-foreground p-4 bg-card shadow-retro max-w-md mx-auto">
                        <p className="text-sm font-medium leading-relaxed">
                            {isMatched
                                ? "Arena context loaded. Round 1 begins shortly — get ready."
                                : "Scanning the matchmaker queue…"}
                        </p>
                    </div>
                </div>

                {/* Players */}
                {players.length > 0 && (
                    <div className="flex gap-4">
                        {players.map((p) => (
                            <div
                                key={p.userId}
                                className="border-2 border-foreground bg-card px-5 py-3 text-center shadow-retro-sm"
                            >
                                <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                                    Player
                                </p>
                                <p className="font-black text-sm mt-1 truncate max-w-[120px]">{p.userId}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Searching indicator */}
                {isSearching && (
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

                {/* Matched — auto-starts, no ready-up needed */}
                {isMatched && sessionStatus === "LOBBY" && (
                    <motion.div
                        className="flex items-center gap-3 px-5 py-3 border-2 border-primary bg-primary/10 shadow-retro-sm"
                        animate={{ opacity: [1, 0.6, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                        <Loader2 className="size-4 animate-spin text-primary" />
                        <span className="text-xs font-black uppercase tracking-widest text-primary">
                            Loading Round 1…
                        </span>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}
