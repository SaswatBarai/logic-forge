"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGameEngine } from "@/hooks/use-game-engine";
import { MatchLobby } from "@/components/game/lobby";

export default function LobbyPage() {
    const { status } = useGameEngine();
    const router = useRouter();

    // Redirect to arena if a round has started
    useEffect(() => {
        if (status === "ACTIVE") {
            router.push("/arcade");
        }
    }, [status, router]);

    // Redirect to home if no session is in progress
    useEffect(() => {
        if (status === "COMPLETED" || status === "ERROR") {
            router.push("/");
        }
    }, [status, router]);

    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <MatchLobby />
        </div>
    );
}
