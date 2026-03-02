"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import Link from "next/link";
import { MatchLobby } from "@/components/game/lobby";
import { GameArena } from "@/components/game/arena";
import { ResultsScreen } from "@/components/game/results-screen";
import { useGameEngine } from "@/hooks/use-game-engine";
import { Loader2, RefreshCw, Zap, Shield, Cpu } from "lucide-react";

const GAME_API_URL = process.env.NEXT_PUBLIC_GAME_API_URL || "http://localhost:3001";

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

    // Send IDENTIFY when WebSocket connects and user session is available
    useEffect(() => {
        if (connected && session?.user?.email && !identifiedRef.current) {
            identify(session.user.email);
            identifiedRef.current = true;
        }
        if (!connected) {
            identifiedRef.current = false;
        }
    }, [connected, session?.user?.email, identify]);

    // Auto-join session when MATCH_FOUND arrives via WebSocket (queued player)
    useEffect(() => {
        if (storeSessionId && queueStatus === "QUEUED") {
            setQueueStatus("MATCHED");
            setActiveSessionId(storeSessionId);
            joinSession(storeSessionId);
        }
    }, [storeSessionId, queueStatus, joinSession]);

    // Watcher: wait for both connection and pending session
    useEffect(() => {
        if (connected && pendingSessionId) {
            setActiveSessionId(pendingSessionId);
            joinSession(pendingSessionId);
            setPendingSessionId(null);
        }
    }, [connected, pendingSessionId, joinSession]);

    // Reconnection: re-join active session
    useEffect(() => {
        if (connected && activeSessionId && !storeSessionId) {
            joinSession(activeSessionId);
        }
    }, [connected, activeSessionId, storeSessionId, joinSession]);

    const handleStartQueue = async () => {
        setIsQueuing(true);
        setQueueError(null);

        try {
            const res = await fetch(`${GAME_API_URL}/api/v1/sessions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mode: "ARCADE",
                    playerFormat: "DUAL",
                    userId: session?.user?.email ?? session?.user?.id ?? crypto.randomUUID(),
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

        } catch (err: any) {
            setQueueError(err.message || "Failed to join queue");
            setIsQueuing(false);
        }
    };

    // Connection status indicator
    const connectionStatus = connected
        ? "ONLINE"
        : reconnectAttempt > 0
            ? `RECONNECTING ${reconnectAttempt}/10`
            : "CONNECTING";

    const connectionColor = connected
        ? "bg-accent"
        : "bg-destructive animate-pulse";

    return (
        <div className="relative min-h-screen flex flex-col bg-background select-none">
            {/* ── Sticky arcade header ── */}
            <motion.header
                className="sticky top-0 z-50 px-6 py-4 border-b-2 border-foreground bg-background/95 backdrop-blur-sm"
                initial={{ y: -80 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link href="/">
                        <motion.div
                            className="flex items-center gap-2 cursor-pointer"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <div className="bg-primary p-1 border-2 border-foreground shadow-retro-sm">
                                <span className="text-foreground font-bold text-xl">⌘</span>
                            </div>
                            <h1 className="text-2xl font-black tracking-tighter uppercase">
                                LogicForge
                            </h1>
                        </motion.div>
                    </Link>

                    <div className="flex items-center gap-6">
                        {/* Connection status pill */}
                        <div className="flex items-center gap-2 px-3 py-1 border-2 border-foreground rounded-sm bg-card shadow-retro-sm">
                            <div className={`size-2 rounded-full ${connectionColor} border border-foreground`} />
                            <span className="text-[10px] font-black uppercase tracking-widest">
                                {connectionStatus}
                            </span>
                        </div>

                        {session?.user?.name && (
                            <span className="text-xs font-bold uppercase tracking-widest hidden md:block">
                                {session.user.name}
                            </span>
                        )}
                    </div>
                </div>
            </motion.header>

            <main className="flex-1 flex flex-col">
                {/* ── Pre-queue intro screen ── */}
                {!hasStartedQueue && (
                    <div className="flex-1 max-w-7xl mx-auto px-6 py-16 lg:py-24 flex flex-col items-center justify-center gap-12">
                        {/* Title */}
                        <motion.div
                            className="text-center"
                            initial={{ opacity: 0, y: -30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <h1 className="text-6xl md:text-8xl font-black leading-[0.9] tracking-tighter uppercase">
                                Dual Engine
                                <br />
                                <span className="text-primary">Arcade</span>
                            </h1>
                        </motion.div>

                        {/* Description card */}
                        <motion.div
                            className="border-2 border-foreground p-6 bg-card shadow-retro-lg max-w-xl"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            <p className="text-lg font-medium leading-relaxed text-center">
                                Compete 1v1 against a live opponent in real-time.
                                Every puzzle is uniquely scrambled to defeat LLM cheating.
                                Fastest correct implementation wins the round.
                            </p>
                        </motion.div>

                        {/* Feature pills */}
                        <motion.div
                            className="flex flex-wrap justify-center gap-4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.35 }}
                        >
                            {[
                                { icon: <Zap className="size-4" />, label: "Real-Time 1v1", color: "bg-primary" },
                                { icon: <Shield className="size-4" />, label: "AI-Proof Puzzles", color: "bg-accent" },
                                { icon: <Cpu className="size-4" />, label: "Live Code Execution", color: "bg-destructive" },
                            ].map((pill) => (
                                <div
                                    key={pill.label}
                                    className="flex items-center gap-2 px-4 py-2 border-2 border-foreground bg-card shadow-retro-sm text-xs font-black uppercase tracking-widest"
                                >
                                    <div className={`${pill.color} p-1 border border-foreground rounded-sm`}>
                                        {pill.icon}
                                    </div>
                                    {pill.label}
                                </div>
                            ))}
                        </motion.div>

                        {/* Error states */}
                        {queueError && (
                            <motion.div
                                className="border-2 border-destructive bg-destructive/10 px-6 py-3 shadow-retro-sm"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                <p className="text-sm font-bold text-destructive">
                                    {queueError} — check that game-api is running on port 3001.
                                </p>
                            </motion.div>
                        )}

                        {!connected && error?.includes("multiple attempts") && (
                            <motion.div
                                className="flex flex-col items-center gap-4"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <div className="border-2 border-destructive bg-destructive/10 px-6 py-3 shadow-retro-sm">
                                    <p className="text-sm font-bold text-destructive">
                                        Unable to reach the game server. Ensure services are running.
                                    </p>
                                </div>
                                <motion.button
                                    className="arcade-btn bg-card px-6 py-3 border-2 border-foreground shadow-retro text-sm font-black uppercase tracking-widest flex items-center gap-2"
                                    whileHover={{ scale: 1.05, boxShadow: "6px 6px 0px 0px hsl(var(--navy))" }}
                                    whileTap={{ scale: 0.95, x: 2, y: 2, boxShadow: "0px 0px 0px 0px hsl(var(--navy))" }}
                                    onClick={retryConnection}
                                >
                                    <RefreshCw className="size-4" />
                                    Retry Connection
                                </motion.button>
                            </motion.div>
                        )}

                        {/* Main CTA button */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.5 }}
                        >
                            <motion.button
                                className="arcade-btn bg-primary px-12 py-6 border-2 border-foreground shadow-retro text-2xl font-black uppercase tracking-widest flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                whileHover={connected && !isQueuing ? {
                                    scale: 1.05,
                                    boxShadow: "6px 6px 0px 0px hsl(var(--navy))",
                                } : {}}
                                whileTap={connected && !isQueuing ? {
                                    scale: 0.95,
                                    x: 2,
                                    y: 2,
                                    boxShadow: "0px 0px 0px 0px hsl(var(--navy))",
                                } : {}}
                                onClick={handleStartQueue}
                                disabled={!connected || isQueuing}
                            >
                                {isQueuing ? (
                                    <>
                                        <Loader2 className="size-6 animate-spin" />
                                        Joining Queue…
                                    </>
                                ) : connected ? (
                                    <>
                                        <span>▶</span>
                                        Enter Arena
                                    </>
                                ) : reconnectAttempt > 0 && !error?.includes("multiple attempts") ? (
                                    <>
                                        <Loader2 className="size-6 animate-spin" />
                                        Reconnecting…
                                    </>
                                ) : (
                                    <>
                                        <Loader2 className="size-6 animate-spin" />
                                        Connecting…
                                    </>
                                )}
                            </motion.button>
                        </motion.div>
                    </div>
                )}

                {/* ── In-queue / in-session views ── */}
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