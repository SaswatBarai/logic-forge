// apps/web/hooks/use-game-engine.ts
"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSession }  from "next-auth/react";
import { io, Socket } from "socket.io-client";
import {
    useGameStore,
    SessionJoinedPayload,
    RoundStartPayload,
    RoundResultPayload,
    TimerSyncPayload,
    SessionEndPayload,
    SessionAbortedPayload,
} from "@/store/game-store";

const GAME_WS_URL  = process.env.NEXT_PUBLIC_GAME_WS_URL  || "http://localhost:3001";
const GAME_API_URL = process.env.NEXT_PUBLIC_GAME_API_URL || "http://localhost:3001";

let _socket: Socket | null = null;

function getSocket(): Socket {
    if (!_socket) {
        _socket = io(GAME_WS_URL, {
            transports:           ["websocket", "polling"],
            reconnection:         true,
            reconnectionDelay:    2_000,
            reconnectionAttempts: 5,
            autoConnect:          true,
        });
    }
    return _socket;
}

export function useGameEngine() {
    const { data: session } = useSession();
    const identifiedRef     = useRef(false);

    const userIdRef = useRef<string | null>(null);
    userIdRef.current =
        session?.user?.email ?? session?.user?.id ?? null;

    const {
        setConnected, setSocketStatus, setMatchStatus, setQueueError,
        applySessionJoined, applyPlayerConnected,
        applyRoundStart, applyRoundResult, applyTimerSync,
        applySessionEnd, applySessionAborted,
    } = useGameStore();

    // joinSession defined early so MATCHED listener can reference it
    const joinSession = useCallback((sessionId: string, userIdOverride?: string) => {
        const userId = userIdOverride ?? userIdRef.current;
        if (!userId) {
            console.error("[joinSession] No userId available — JOIN_SESSION not emitted");
            return;
        }
        console.info("[WS] Emitting JOIN_SESSION", { sessionId, userId });
        getSocket().emit("JOIN_SESSION", { sessionId, userId });
    }, []);

    useEffect(() => {
        const socket = getSocket();

        const onConnect = () => {
            setConnected(true);
            setSocketStatus("OPEN");
            const userId = userIdRef.current;
            if (userId && !identifiedRef.current) {
                socket.emit("IDENTIFY", { userId });
            }
        };

        const onDisconnect = () => {
            setConnected(false);
            setSocketStatus("CLOSED");
            identifiedRef.current = false;
        };

        if (socket.connected) {
            setConnected(true);
            setSocketStatus("OPEN");
        }

        socket.on("connect",       onConnect);
        socket.on("disconnect",    onDisconnect);
        socket.on("connect_error", () => setSocketStatus("ERROR"));

        socket.on("IDENTIFIED",       () => {
            identifiedRef.current = true;
            console.info("[WS] Identified");
        });

        // ✅ THE FIX — waiting player receives MATCHED via socket and joins
        socket.on("MATCHED", (p: { status: string; sessionId: string }) => {
            console.info("[WS] MATCHED via socket", p);
            const userId = userIdRef.current ?? crypto.randomUUID();
            setMatchStatus("MATCHED");
            joinSession(p.sessionId, userId);
        });

        socket.on("SESSION_JOINED",   (p: SessionJoinedPayload)  => applySessionJoined(p));
        socket.on("PLAYER_CONNECTED", (p: { userId: string })    => applyPlayerConnected(p.userId));
        socket.on("ROUND_START",      (p: RoundStartPayload)     => applyRoundStart(p));
        socket.on("ROUND_RESULT",     (p: RoundResultPayload)    => applyRoundResult(p));
        socket.on("TIMER_SYNC",       (p: TimerSyncPayload)      => applyTimerSync(p));
        socket.on("SESSION_END",      (p: SessionEndPayload)     => applySessionEnd(p));
        socket.on("SESSION_ABORTED",  (p: SessionAbortedPayload) => applySessionAborted(p));
        socket.on("ERROR",            (p: { message: string })   => console.error("[WS] Error:", p.message));

        return () => {
            socket.off("connect",          onConnect);
            socket.off("disconnect",       onDisconnect);
            socket.off("connect_error");
            socket.off("IDENTIFIED");
            socket.off("MATCHED");           // ✅ cleanup
            socket.off("SESSION_JOINED");
            socket.off("PLAYER_CONNECTED");
            socket.off("ROUND_START");
            socket.off("ROUND_RESULT");
            socket.off("TIMER_SYNC");
            socket.off("SESSION_END");
            socket.off("SESSION_ABORTED");
            socket.off("ERROR");
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [joinSession]);

    useEffect(() => {
        const socket = getSocket();
        const userId = userIdRef.current;
        if (!socket.connected || !userId || identifiedRef.current) return;
        socket.emit("IDENTIFY", { userId });
        identifiedRef.current = true;
    }, [session]);

    const submitAnswer = useCallback((
        sessionId: string, challengeId: string, answer: string
    ) => {
        const userId = userIdRef.current;
        if (!userId) {
            console.error("[submitAnswer] No userId — SUBMIT not emitted");
            return;
        }
        getSocket().emit("SUBMIT", { sessionId, userId, challengeId, answer });
    }, []);

    const enterQueue = useCallback(async (payload: {
        playerFormat: "SINGLE" | "DUAL";
        sessionType:  "TIMER" | "LIVE";
        category:     string | null;
    }) => {
        const socket = getSocket();
        const userId = userIdRef.current ?? crypto.randomUUID();

        setQueueError(null);

        // Ensure socket is connected and server has registered this user (IDENTIFIED)
        // so the matchmaker can find our socket when another player matches
        if (!identifiedRef.current) {
            if (!socket.connected) {
                await new Promise<void>((resolve, reject) => {
                    const t = setTimeout(() => reject(new Error("Connection timeout")), 8000);
                    socket.once("connect", () => {
                        clearTimeout(t);
                        resolve();
                    });
                    socket.once("connect_error", () => {
                        clearTimeout(t);
                        reject(new Error("Failed to connect"));
                    });
                });
            }
            await new Promise<void>((resolve, reject) => {
                const t = setTimeout(() => resolve(), 3000); // proceed after 3s even if no ack
                socket.once("IDENTIFIED", () => {
                    clearTimeout(t);
                    resolve();
                });
                socket.emit("IDENTIFY", { userId });
            });
        }

        try {
            const res = await fetch(`${GAME_API_URL}/api/v1/sessions`, {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({
                    mode: "ARCADE",
                    ...payload,
                    userId,
                }),
            });

            if (!res.ok) {
                const errBody = await res.json().catch(() => ({}));
                throw new Error(
                    errBody?.error?.message
                    ?? `Matchmaker error: ${res.status}`
                );
            }

            const { data } = await res.json();
            console.info("[enterQueue] response:", data);

            if (data.status === "MATCHED") {
                setMatchStatus("MATCHED");
                joinSession(data.sessionId, userId);
            } else {
                // DUAL mode — waiting for MATCHED socket event
                setMatchStatus("QUEUED");
            }
        } catch (err: any) {
            console.error("[enterQueue] failed:", err);
            setQueueError(err.message ?? "Failed to enter queue");
        }
    }, [setMatchStatus, setQueueError, joinSession]);

    const state = useGameStore();

    return {
        connected:            state.connected,
        socketStatus:         state.socketStatus,
        matchStatus:          state.matchStatus,
        queueError:           state.queueError,
        sessionId:            state.sessionId,
        sessionStatus:        state.sessionStatus,
        config:               state.config,
        players:              state.players,
        currentRound:         state.currentRound,
        totalRounds:          state.totalRounds,
        challenge:            state.challenge,
        lastResult:           state.lastResult,
        showResultOverlay:    state.showResultOverlay,
        timeRemaining:        state.timeRemaining,
        roundHistory:         state.roundHistory,
        myLives:              state.myLives,
        abortReason:          state.abortReason,
        enterQueue,
        joinSession,
        readyUp:              () => getSocket().emit("READY", {}),
        submitAnswer,
        dismissResultOverlay: state.dismissResultOverlay,
        reset:                state.reset,
    };
}
