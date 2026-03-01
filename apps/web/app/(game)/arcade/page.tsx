"use client";

import { useState } from "react";
import { MatchLobby } from "@/components/game/lobby";
import { GameArena } from "@/components/game/arena";
import { useGameEngine } from "@/hooks/use-game-engine";
import { Button } from "@/components/ui/button";

export default function ArcadeModePage() {
    const { status, connected, joinSession } = useGameEngine();
    const [hasStartedQueue, setHasStartedQueue] = useState(false);

    // Helper action to click 'Play Dual' and join directly. 
    // In a real flow, this triggers the REST /sessions api, which returns a Match ID, 
    // which is then passed into `joinSession`.
    const handleStartQueue = async () => {
        setHasStartedQueue(true);
        // Simulate Matchmaker REST delay then joining WS
        setTimeout(() => {
            // Pass a fake sessionId mock since we aren't enforcing auth completely yet
            joinSession("dual-match-" + Math.floor(Math.random() * 10000));
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-black select-none overflow-hidden flex flex-col">
            {/* Immersive Header Backdrop */}
            <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

            <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 relative z-10 flex flex-col">
                {!hasStartedQueue ? (
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

                        <Button
                            size="lg"
                            onClick={handleStartQueue}
                            disabled={!connected}
                            className="text-lg px-12 py-6 rounded-full shadow-[0_0_40px_-10px_rgba(var(--primary),0.5)] hover:shadow-[0_0_60px_-10px_rgba(var(--primary),0.8)] transition-all duration-300"
                        >
                            {connected ? "Enter the Arena" : "Connecting to Services..."}
                        </Button>
                    </div>
                ) : (
                    <>
                        {status === "LOBBY" && <MatchLobby />}
                        {status === "ACTIVE" && <GameArena />}
                        {/* Note: In full implementation, we'd have a Results overlay covering COMPLETED status too */}
                        {status === "COMPLETED" && (
                            <div className="text-center mt-32">
                                <h2 className="text-3xl font-bold text-white mb-4">Match Complete!</h2>
                                <Button onClick={() => window.location.reload()}>Play Again</Button>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
