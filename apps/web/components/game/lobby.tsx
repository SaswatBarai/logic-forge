"use client";

import { useGameEngine } from "@/hooks/use-game-engine";
import { Loader2, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MatchLobby() {
    const { status, sessionId } = useGameEngine();

    // If we have an active match that is about to begin
    if (status === "ACTIVE") {
        return null;
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[500px] w-full text-center space-y-6">
            <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                <Swords className="h-24 w-24 text-primary relative z-10 animate-pulse" />
            </div>

            <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-white">
                    {sessionId ? "Found Opponent" : "Looking for Match"}
                </h2>
                <p className="text-zinc-400 max-w-sm mx-auto">
                    {sessionId
                        ? "Preparing arena context. The round is about to begin in a moment..."
                        : "Queueing you up against players of similar difficulty rating in the server network."}
                </p>
            </div>

            {!sessionId && (
                <div className="flex items-center gap-2 text-zinc-300 bg-zinc-900/50 px-4 py-2 rounded-full border border-zinc-800">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm font-medium tracking-wide">MATCHMAKER QUEUED</span>
                </div>
            )}

            {sessionId && (
                <Button variant="secondary" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    Ready Up
                </Button>
            )}
        </div>
    );
}
