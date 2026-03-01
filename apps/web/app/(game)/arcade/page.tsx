"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { MatchLobby } from "@/components/game/lobby";
import { GameArena } from "@/components/game/arena";
import { ResultsScreen } from "@/components/game/results-screen";
import { Navbar } from "@/components/Navbar";
import { useGameEngine } from "@/hooks/use-game-engine";
import { Loader2, RefreshCw, Zap, Shield, Cpu } from "lucide-react";

const GAME_API_URL = process.env.NEXT_PUBLIC_GAME_API_URL || "http://localhost:3001";

const easeLanding = [0.22, 1, 0.36, 1] as const;

export default function ArcadeModePage() {
    const { data: session } = useSession();
    const { status, connected, joinSession, identify, sessionId: storeSessionId, error, reconnectAttempt, retryConnection } = useGameEngine();
    const [hasStartedQueue, setHasStartedQueue] = useState(false);
    const [isQueuing, setIsQueuing] = useState(false);
    const [queueStatus, setQueueStatus] = useState<string | null>(null);
    const [queueError, setQueueError] = useState<string | null>(null);
    const identifiedRef = useRef(false);

    const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

    useEffect(() => {
        if (connected && session?.user?.email && !identifiedRef.current) {
            identify(session.user.email);
            identifiedRef.current = true;
        }
        if (!connected) {
            identifiedRef.current = false;
        }
    }, [connected, session?.user?.email, identify]);

    useEffect(() => {
        if (storeSessionId && queueStatus === "QUEUED") {
            setQueueStatus("MATCHED");
            setActiveSessionId(storeSessionId);
            joinSession(storeSessionId);
        }
    }, [storeSessionId, queueStatus, joinSession]);

    useEffect(() => {
        if (connected && pendingSessionId) {
            setActiveSessionId(pendingSessionId);
            joinSession(pendingSessionId);
            setPendingSessionId(null);
        }
    }, [connected, pendingSessionId, joinSession]);

    useEffect(() => {
        if (connected && activeSessionId && !storeSessionId) {
            joinSession(activeSessionId);
        }
    }, [connected, activeSessionId, storeSessionId, joinSession]);

    const handleStartQueue = async () => {
        setIsQueuing(true);
        setQueueError(null);

        const userId = session?.user?.email ?? session?.user?.id ?? crypto.randomUUID();
        identify(userId);

        try {
            const res = await fetch(`${GAME_API_URL}/api/v1/sessions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mode: "ARCADE",
                    playerFormat: "DUAL",
                    userId,
                }),
            });

            if (!res.ok) {
                throw new Error(`Matchmaker API error: ${res.status}`);
            }

            const { data } = await res.json();

            setHasStartedQueue(true);
            setQueueStatus(data.status);

            if (data.status === "MATCHED" && data.sessionId) {
                setActiveSessionId(data.sessionId);
                setPendingSessionId(data.sessionId);
            }

        } catch (err: unknown) {
            setQueueError(err instanceof Error ? err.message : "Failed to join queue");
            setIsQueuing(false);
        }
    };

    return (
        <div className="relative min-h-screen flex flex-col bg-background selection:bg-primary selection:text-primary-foreground select-none">
            <Navbar />

            <main className="flex-1 flex flex-col">
                {!hasStartedQueue && (
                    <section className="flex-1 min-h-[85vh] relative overflow-hidden">
                        {/* Subtle background pattern */}
                        <div
                            className="absolute inset-0 opacity-[0.03]"
                            style={{
                                backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
                                backgroundSize: "24px 24px",
                            }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/50 pointer-events-none" />

                        <div className="relative max-w-7xl mx-auto px-6 py-16 lg:py-24 grid lg:grid-cols-2 gap-16 lg:gap-20 items-center min-h-[85vh]">
                            {/* Left: Copy + CTA */}
                            <div className="flex flex-col gap-8 z-10 order-2 lg:order-1">
                                <motion.div
                                    initial={{ opacity: 0, x: -24 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.5, ease: easeLanding }}
                                    className="space-y-2"
                                >
                                    <p className="text-sm font-black uppercase tracking-[0.2em] text-primary">
                                        Live PvP
                                    </p>
                                    <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[0.92] tracking-tighter uppercase text-foreground">
                                        Dual Engine{" "}
                                        <motion.span
                                            className="inline-block text-primary"
                                            whileHover={{
                                                color: "hsl(43, 96%, 56%)",
                                                textShadow: "4px 4px 0px hsl(222, 47%, 11%)",
                                            }}
                                            style={{ transition: "color 0.3s, text-shadow 0.3s" }}
                                        >
                                            Arcade
                                        </motion.span>
                                    </h1>
                                    <p className="text-muted-foreground text-lg font-medium max-w-md pt-1">
                                        Find a rival. Solve the puzzle. First correct answer wins.
                                    </p>
                                </motion.div>

                                <motion.div
                                    className="border-2 border-foreground p-6 bg-card shadow-retro-lg max-w-lg"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.15, ease: easeLanding }}
                                >
                                    <p className="text-base font-medium leading-relaxed text-foreground/90">
                                        Compete 1v1 against a live opponent in real-time. Every puzzle is uniquely
                                        scrambled to defeat LLM cheating. Fastest correct implementation wins the round.
                                    </p>
                                </motion.div>

                                {/* Feature strip — HUD style */}
                                <motion.div
                                    className="flex flex-wrap gap-4"
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.25, ease: easeLanding }}
                                >
                                    {[
                                        { icon: Zap, label: "Real-Time 1v1", color: "bg-primary border-foreground text-primary-foreground" },
                                        { icon: Shield, label: "AI-Proof", color: "bg-accent border-foreground text-accent-foreground" },
                                        { icon: Cpu, label: "Live Execution", color: "bg-card border-2 border-foreground text-foreground" },
                                    ].map((item, i) => (
                                        <motion.div
                                            key={item.label}
                                            className="flex items-center gap-2.5 px-4 py-2.5 border-2 border-foreground shadow-retro-sm font-bold uppercase tracking-widest text-xs"
                                            style={{ backgroundColor: "hsl(var(--card))" }}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.35 + i * 0.06, duration: 0.4 }}
                                            whileHover={{ scale: 1.02, boxShadow: "3px 3px 0px 0px hsl(var(--foreground) / 0.2)" }}
                                        >
                                            <item.icon className="size-4 shrink-0 text-primary" />
                                            <span>{item.label}</span>
                                        </motion.div>
                                    ))}
                                </motion.div>

                                {/* Errors */}
                                {queueError && (
                                    <motion.div
                                        className="border-2 border-destructive bg-destructive/10 px-5 py-3 shadow-retro-sm max-w-lg"
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                    >
                                        <p className="text-sm font-bold text-destructive">{queueError} — check that game-api is running on port 3001.</p>
                                    </motion.div>
                                )}
                                {!connected && error?.includes("multiple attempts") && (
                                    <motion.div
                                        className="flex flex-col gap-3 max-w-lg"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                    >
                                        <div className="border-2 border-destructive bg-destructive/10 px-5 py-3 shadow-retro-sm">
                                            <p className="text-sm font-bold text-destructive">Unable to reach the game server. Ensure services are running.</p>
                                        </div>
                                        <motion.button
                                            className="arcade-btn w-fit bg-card px-5 py-2.5 border-2 border-foreground shadow-retro text-sm font-black uppercase tracking-widest flex items-center gap-2"
                                            whileHover={{ scale: 1.02, boxShadow: "4px 4px 0px 0px hsl(var(--navy))" }}
                                            whileTap={{ scale: 0.98, x: 2, y: 2, boxShadow: "0px 0px 0px 0px hsl(var(--navy))" }}
                                            onClick={retryConnection}
                                        >
                                            <RefreshCw className="size-4" />
                                            Retry Connection
                                        </motion.button>
                                    </motion.div>
                                )}

                                {/* Main CTA */}
                                <motion.div
                                    className="flex flex-wrap items-center gap-4 pt-2"
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.45, ease: easeLanding }}
                                >
                                    <motion.button
                                        className="arcade-btn bg-primary px-10 py-5 border-2 border-foreground shadow-retro text-xl font-black uppercase tracking-widest flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                                        whileHover={connected && !isQueuing ? {
                                            scale: 1.04,
                                            boxShadow: "6px 6px 0px 0px hsl(var(--navy))",
                                        } : {}}
                                        whileTap={connected && !isQueuing ? {
                                            scale: 0.97,
                                            x: 2,
                                            y: 2,
                                            boxShadow: "0px 0px 0px 0px hsl(var(--navy))",
                                        } : {}}
                                        onClick={handleStartQueue}
                                        disabled={!connected || isQueuing}
                                    >
                                        {connected && !isQueuing && (
                                            <span className="absolute inset-0 bg-primary/20 animate-pulse pointer-events-none rounded-sm" aria-hidden />
                                        )}
                                        {isQueuing ? (
                                            <>
                                                <Loader2 className="size-6 animate-spin shrink-0" />
                                                <span>Joining Queue…</span>
                                            </>
                                        ) : connected ? (
                                            <>
                                                <span className="text-2xl shrink-0">▶</span>
                                                <span>Enter Arena</span>
                                            </>
                                        ) : reconnectAttempt > 0 && !error?.includes("multiple attempts") ? (
                                            <>
                                                <Loader2 className="size-6 animate-spin shrink-0" />
                                                <span>Reconnecting…</span>
                                            </>
                                        ) : (
                                            <>
                                                <Loader2 className="size-6 animate-spin shrink-0" />
                                                <span>Connecting…</span>
                                            </>
                                        )}
                                    </motion.button>
                                </motion.div>
                            </div>

                            {/* Right: Arcade "screen" visual */}
                            <motion.div
                                className="relative order-1 lg:order-2 flex justify-center lg:justify-end"
                                initial={{ opacity: 0, x: 24 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6, delay: 0.2, ease: easeLanding }}
                            >
                                <div className="w-full max-w-md border-4 border-foreground bg-foreground shadow-retro-lg p-2 relative">
                                    {/* CRT-style frame */}
                                    <div
                                        className="aspect-[4/3] flex flex-col items-center justify-center gap-6 p-8 text-background"
                                        style={{ backgroundColor: "hsl(var(--editor-bg))" }}
                                    >
                                        <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary">
                                            Versus
                                        </div>
                                        <div className="flex items-center gap-8">
                                            <div className="w-20 h-20 rounded-full border-2 border-primary bg-primary/20 flex items-center justify-center text-2xl font-black">
                                                P1
                                            </div>
                                            <span className="text-3xl font-black text-primary">VS</span>
                                            <div className="w-20 h-20 rounded-full border-2 border-destructive bg-destructive/20 flex items-center justify-center text-2xl font-black">
                                                P2
                                            </div>
                                        </div>
                                        <p className="text-xs font-mono text-center text-white/70 max-w-[200px]">
                                            Matchmaking finds you a live opponent. First to solve wins.
                                        </p>
                                        <div className="flex gap-2">
                                            {[1, 2, 3].map((i) => (
                                                <motion.div
                                                    key={i}
                                                    className="w-2 h-2 rounded-full bg-primary"
                                                    animate={{ opacity: [0.4, 1, 0.4] }}
                                                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-2 border-r-2 border-primary/50" aria-hidden />
                                </div>
                            </motion.div>
                        </div>
                    </section>
                )}

                {hasStartedQueue && (
                    <div className="flex-1 flex flex-col">
                        {(status === "LOBBY" || status === "QUEUE") && <MatchLobby />}
                        {status === "ACTIVE" && <GameArena />}
                        {status === "COMPLETED" && <ResultsScreen />}
                    </div>
                )}
            </main>
        </div>
    );
}