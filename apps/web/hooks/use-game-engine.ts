"use client";

import { useEffect, useCallback } from "react";
import { useGameStore } from "@/store/game-store";

export function useGameEngine() {
    const {
        connect,
        disconnect,
        sendMessage,
        status,
        sessionId,
        error,
        connected,
        challenge,
        totalScore,
        opponentScore,
        remainingMs,
        clearRoundResult,
        retryConnection,
        _reconnectAttempt,
    } = useGameStore();

    useEffect(() => {
        // Determine WS protocol depending on if we have HTTPS
        const wsUrl = process.env.NEXT_PUBLIC_GAME_API_WS || "ws://localhost:3001";
        connect(`${wsUrl}/api/v1/sessions/socket`); // Connect broadly

        // Start ping heartbeat
        const interval = setInterval(() => {
            if (useGameStore.getState().connected) {
                sendMessage({ type: "PING", timestamp: Date.now() });
            }
        }, 15000);

        return () => {
            clearInterval(interval);
            disconnect();
        };
    }, [connect, disconnect, sendMessage]);

    const joinSession = useCallback((sid: string) => {
        sendMessage({ type: "JOIN_SESSION", sessionId: sid, token: "mock-auth" });
    }, [sendMessage]);

    const identify = useCallback((userId: string) => {
        sendMessage({ type: "IDENTIFY", userId });
    }, [sendMessage]);

    const submitCode = useCallback((code: string) => {
        const state = useGameStore.getState();
        if (state.sessionId && state.currentRound > 0) {
            sendMessage({
                type: "SUBMIT_ANSWER",
                sessionId: state.sessionId,
                roundNumber: state.currentRound,
                code
            });
        }
    }, [sendMessage]);

    const readyUp = useCallback(() => {
        const state = useGameStore.getState();
        if (state.sessionId) {
            sendMessage({ type: "READY", sessionId: state.sessionId });
        }
    }, [sendMessage]);

    return {
        joinSession,
        identify,
        submitCode,
        readyUp,
        clearRoundResult,
        retryConnection,
        reconnectAttempt: _reconnectAttempt,
        status,
        sessionId,
        error,
        connected,
        challenge,
        scores: {
            player: totalScore,
            opponent: opponentScore
        },
        timeRemaining: remainingMs
    };
}
