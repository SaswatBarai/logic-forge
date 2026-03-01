"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { MatchLobby } from "@/components/game/lobby";
import { GameArena } from "@/components/game/arena";
import { ResultsScreen } from "@/components/game/results-screen";
import { useGameEngine } from "@/hooks/use-game-engine";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";

const GAME_API_URL = process.env.NEXT_PUBLIC_GAME_API_URL || "http://localhost:3001";

export default function ArcadeModePage() {
    const { data: session } = useSession();
    const { status, connected, joinSession, identify, sessionId: storeSessionId, error, reconnectAttempt, retryConnection } = useGameEngine();
    const [hasStartedQueue, setHasStartedQueue] = useState(false);
    const [isQueuing, setIsQueuing] = useState(false);
    const [queueStatus, setQueueStatus] = useState<string | null>(null);
    const [queueError, setQueueError] = useState<string | null>(null);
    const identifiedRef = useRef(false);

    // Send IDENTIFY when WebSocket connects and user session is available
    useEffect(() => {
        if (connected && session?.user?.email && !identifiedRef.current) {
            identify(session.user.email);
            identifiedRef.current = true;
        }
        // Reset flag if connection drops
        if (!connected) {
            identifiedRef.current = false;
        }
    }, [connected, session?.user?.email, identify]);

    // Auto-join session when MATCH_FOUND arrives via WebSocket (queued player)
    useEffect(() => {
        if (storeSessionId && queueStatus === "QUEUED") {
            setQueueStatus("MATCHED");
            joinSession(storeSessionId);
        }
    }, [storeSessionId, queueStatus, joinSession]);

    const handleStartQueue = async () => {
        setIsQueuing(true);
        setQueueError(null);

        try {
            // 1. Call REST matchmaker to create / join a session
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
                // Immediately join via WS if already matched
                joinSession(data.sessionId);
            }
            // If QUEUED, the WS server sends MATCH_FOUND which triggers joinSession
            // through the game-store's MATCH_FOUND handler (sessionId is set)
        } catch (err: any) {
            setQueueError(err.message || "Failed to join queue");
            setIsQueuing(false);
        }
    };

    return (
        <div className="min-h-screen bg-black select-none overflow-hidden flex flex-col">
            {/* Immersive backdrop gradient */}
            <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

            <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 relative z-10 flex flex-col">

                {/* ── Pre-queue intro screen ── */}
                {!hasStartedQueue && (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-1000">
                        <div className="text-center space-y-4 max-w-2xl">
                            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-500">
                                Dual Engine Arcade
                            </h1>
                            <p className="text-lg text-zinc-400">
                                Compete 1v1 against an opponent in real-time.
                                Solve algorithm puzzles uniquely scrambled to prevent LLM assistance.
                                Fastest implementation wins the round.
                            </p>
                        </div>

                        {queueError && (
                            <p className="text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-2">
                                {queueError} — check that game-api is running on port 3001.
                            </p>
                        )}

                        {/* Connection error with manual retry */}
                        {!connected && error?.includes("multiple attempts") && (
                            <div className="flex flex-col items-center gap-3">
                                <p className="text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-2">
                                    Unable to reach the game server. Ensure services are running.
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={retryConnection}
                                    className="gap-2"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    Retry Connection
                                </Button>
                            </div>
                        )}

                        <Button
                            size="lg"
                            onClick={handleStartQueue}
                            disabled={!connected || isQueuing}
                            className="text-lg px-12 py-6 rounded-full shadow-[0_0_40px_-10px_rgba(var(--primary),0.5)] hover:shadow-[0_0_60px_-10px_rgba(var(--primary),0.8)] transition-all duration-300"
                        >
                            {isQueuing ? (
                                <>
                                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                    Joining Queue…
                                </>
                            ) : connected ? (
                                "Enter the Arena"
                            ) : reconnectAttempt > 0 && !error?.includes("multiple attempts") ? (
                                <>
                                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                    Reconnecting ({reconnectAttempt}/10)…
                                </>
                            ) : (
                                <>
                                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                    Connecting to Services…
                                </>
                            )}
                        </Button>
                    </div>
                )}

                {/* ── In-queue / in-session views ── */}
                {hasStartedQueue && (
                    <>
                        {(status === "LOBBY" || status === "QUEUE") && <MatchLobby />}
                        {status === "ACTIVE" && <GameArena />}
                        {status === "COMPLETED" && <ResultsScreen />}
                    </>
                )}
            </main>
        </div>
    );
}
