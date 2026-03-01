"use client";

import { useState } from "react"; // 1. Import useState
import { useGameEngine } from "@/hooks/use-game-engine";
import { Loader2, Swords, CheckCircle2 } from "lucide-react"; // 2. Add CheckCircle2 for better UI
import { Button } from "@/components/ui/button";

export function MatchLobby() {
    // 3. Extract the readyUp function we mapped in the hook previously
    const { status, sessionId, readyUp } = useGameEngine();
    
    // 4. Track if the current player has clicked ready
    const [isReady, setIsReady] = useState(false);

    // If we have an active match that is about to begin
    if (status === "ACTIVE") {
        return null;
    }

    // 5. Create a handler to fire the WS event and update UI
    const handleReadyClick = () => {
        setIsReady(true);
        readyUp(); 
    };

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
                <Button 
                    variant={isReady ? "outline" : "secondary"} 
                    className={`animate-in fade-in slide-in-from-bottom-4 duration-500 transition-all ${isReady ? "border-green-500/50 text-green-400" : ""}`}
                    onClick={handleReadyClick} // 6. Attach the wires!
                    disabled={isReady} // 7. Prevent spamming the ready button
                >
                    {isReady ? (
                        <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Waiting for opponent...
                        </>
                    ) : (
                        "Ready Up"
                    )}
                </Button>
            )}
        </div>
    );
}