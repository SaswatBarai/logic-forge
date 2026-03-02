"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
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

const GAME_WS_URL = process.env.NEXT_PUBLIC_GAME_WS_URL || "http://localhost:3001";
const GAME_API_URL = process.env.NEXT_PUBLIC_GAME_API_URL || "http://localhost:3001";

let _socket: Socket | null = null;

function getSocket(): Socket {
    if (!_socket) {
        _socket = io(GAME_WS_URL, {
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionDelay: 2_000,
            reconnectionAttempts: 5,
            autoConnect: true,
        });
    }
    return _socket;
}

export function useGameEngine() {
    const { data: session } = useSession();
    const identifiedRef = useRef(false);
    const lastIdentifiedUserIdRef = useRef<string | null>(null);
    const prevUserIdRef = useRef<string | null>(null);

    const userIdRef = useRef<string | null>(null);
    userIdRef.current =
        session?.user?.email ?? session?.user?.id ?? null;

    const {
        setConnected, setSocketStatus, setMatchStatus, setQueueError,
        applyMatched, setQueuedUserId, applySessionJoined, applyPlayerConnected,
        applyRoundStart, applyRoundResult, applyTimerSync,
        applySessionEnd, applySessionAborted,
    } = useGameStore();

    const joinSession = useCallback((sessionId: string, userIdOverride?: string) => {
        const store = useGameStore.getState();
        const userId = userIdOverride ?? userIdRef.current ?? store.pendingUserId;
        if (!userId) {
            console.error("[joinSession] No userId — JOIN_SESSION not emitted");
            return;
        }
        console.info("[WS] Emitting JOIN_SESSION", { sessionId, userId });
        const socket = getSocket();
        socket.emit("JOIN_SESSION", { sessionId, userId }, (ack?: { ok: boolean; payload?: object; error?: string }) => {
            if (ack?.ok && ack.payload) {
                console.info("[WS] JOIN_SESSION ack success — applying SESSION_JOINED");
                applySessionJoined(ack.payload as Parameters<typeof applySessionJoined>[0]);
            } else if (ack && !ack.ok) {
                console.error("[WS] JOIN_SESSION ack error:", ack.error);
                setQueueError(ack.error ?? "Failed to join session");
            }
        });
    }, [applySessionJoined, setQueueError]);

    useEffect(() => {
        const socket = getSocket();

        const onConnect = () => {
            setConnected(true);
            setSocketStatus("OPEN");
            const userId = userIdRef.current;
            if (userId) {
                identifiedRef.current = false;
                socket.emit("IDENTIFY", { userId });
                console.info("[WS] Emitting IDENTIFY on connect", { userId });
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

        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);
        socket.on("connect_error", () => setSocketStatus("ERROR"));

        socket.on("IDENTIFIED", () => {
            identifiedRef.current = true;
            lastIdentifiedUserIdRef.current = userIdRef.current;
            console.info("[WS] Identified as", userIdRef.current);
        });

        socket.on("MATCHED", (p: { status: string; sessionId: string }) => {
            console.info("[WS] MATCHED via socket", p);
            const store = useGameStore.getState();
            const userId = store.pendingUserId ?? userIdRef.current;
            if (!userId) {
                console.error("[WS] MATCHED received but userId is unknown");
                return;
            }
            applyMatched(p.sessionId, userId);
            joinSession(p.sessionId, userId);
        });

        socket.on("SESSION_ERROR", (p: { message: string }) => {
            console.error("[WS] SESSION_ERROR:", p.message);
            setQueueError(p.message ?? "Failed to join session");
        });

        // ✅ Step 3 — .off() before .on() to prevent listener stacking
        socket.off("SESSION_JOINED").on("SESSION_JOINED",     (p: SessionJoinedPayload)  => applySessionJoined(p));
        socket.off("PLAYER_CONNECTED").on("PLAYER_CONNECTED", (p: { userId: string })    => applyPlayerConnected(p.userId));
        socket.off("ROUND_START").on("ROUND_START",           (p: RoundStartPayload)     => applyRoundStart(p));
        socket.off("ROUND_RESULT").on("ROUND_RESULT",         (p: RoundResultPayload)    => applyRoundResult(p));
        socket.off("TIMER_SYNC").on("TIMER_SYNC",             (p: TimerSyncPayload)      => applyTimerSync(p));
        socket.off("SESSION_END").on("SESSION_END",           (p: SessionEndPayload)     => applySessionEnd(p));
        socket.off("SESSION_ABORTED").on("SESSION_ABORTED",   (p: SessionAbortedPayload) => applySessionAborted(p));
        socket.off("ERROR").on("ERROR",                       (p: { message: string })   => console.error("[WS] Error:", p.message));

        socket.on("TIMER_EXPIRED", (p: { roundNumber: number }) => {
            console.warn("[WS] TIMER_EXPIRED for round", p.roundNumber);
            applyTimerSync({ roundNumber: p.roundNumber, remainingMs: 0, serverTimestamp: Date.now() });
        });

        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
            socket.off("connect_error");
            socket.off("IDENTIFIED");
            socket.off("MATCHED");
            socket.off("SESSION_ERROR");
            socket.off("SESSION_JOINED");
            socket.off("PLAYER_CONNECTED");
            socket.off("ROUND_START");
            socket.off("ROUND_RESULT");
            socket.off("TIMER_SYNC");
            socket.off("TIMER_EXPIRED");
            socket.off("SESSION_END");
            socket.off("SESSION_ABORTED");
            socket.off("ERROR");
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [joinSession]);

    useEffect(() => {
        const userId = userIdRef.current;
        if (!userId || userId === prevUserIdRef.current) return;
        prevUserIdRef.current = userId;
        const socket = getSocket();
        if (!socket.connected) return;
        identifiedRef.current = false;
        socket.emit("IDENTIFY", { userId });
        console.info("[WS] Re-identifying — userId changed", { userId });
    }, [session]);

    const submitAnswer = useCallback((
        sessionId: string, challengeId: string, answer: string
    ) => {
        const userId = userIdRef.current;
        const roundNumber = useGameStore.getState().currentRound;
        if (!userId) {
            console.error("[submitAnswer] No userId — SUBMIT_ANSWER not emitted");
            return;
        }
        getSocket().emit("SUBMIT_ANSWER", { sessionId, userId, challengeId, answer, roundNumber });
    }, []);

    const enterQueue = useCallback(async (payload: {
        playerFormat: "SINGLE" | "DUAL";
        sessionType: "TIMER" | "LIVE";
        category: string | null;
    }) => {
        const socket = getSocket();
        const userId = userIdRef.current ?? crypto.randomUUID();

        setQueueError(null);

        if (!identifiedRef.current) {
            if (!socket.connected) {
                await new Promise<void>((resolve, reject) => {
                    const t = setTimeout(() => reject(new Error("Connection timeout")), 8000);
                    socket.once("connect", () => { clearTimeout(t); resolve(); });
                    socket.once("connect_error", () => { clearTimeout(t); reject(new Error("Failed to connect")); });
                });
            }
            await new Promise<void>((resolve) => {
                const t = setTimeout(() => resolve(), 3000);
                socket.once("IDENTIFIED", () => { clearTimeout(t); resolve(); });
                socket.emit("IDENTIFY", { userId });
            });
        }

        try {
            const socketId = socket.connected ? socket.id : undefined;
            const res = await fetch(`${GAME_API_URL}/api/v1/sessions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mode: "ARCADE", ...payload, userId, socketId }),
            });

            if (!res.ok) {
                const errBody = await res.json().catch(() => ({}));
                throw new Error(errBody?.error?.message ?? `Matchmaker error: ${res.status}`);
            }

            const { data } = await res.json();
            console.info("[enterQueue] response:", data);

            if (data.status === "MATCHED") {
                applyMatched(data.sessionId, userId);
                joinSession(data.sessionId, userId);
            } else {
                setMatchStatus("QUEUED");
                setQueuedUserId(userId);
            }
        } catch (err: any) {
            console.error("[enterQueue] failed:", err);
            setQueueError(err.message ?? "Failed to enter queue");
        }
    }, [applyMatched, setQueuedUserId, setQueueError, joinSession]);

    const state = useGameStore();

    return {
        connected: state.connected,
        socketStatus: state.socketStatus,
        matchStatus: state.matchStatus,
        queueError: state.queueError,
        sessionId: state.sessionId,
        sessionStatus: state.sessionStatus,
        config: state.config,
        players: state.players,
        currentRound: state.currentRound,
        totalRounds: state.totalRounds,
        challenge: state.challenge,
        lastResult: state.lastResult,
        showResultOverlay: state.showResultOverlay,
        timeRemaining: state.timeRemaining,
        roundHistory: state.roundHistory,
        myLives: state.myLives,
        abortReason: state.abortReason,
        enterQueue,
        joinSession,
        readyUp: useCallback(() => {
            const s = useGameStore.getState();
            const userId = userIdRef.current ?? s.pendingUserId;
            if (!s.sessionId || !userId) {
                console.warn("[WS] readyUp called but sessionId or userId missing", { sessionId: s.sessionId, userId });
                return;
            }
            console.info("[WS] Emitting PLAYER_READY", { sessionId: s.sessionId, userId });
            getSocket().emit("PLAYER_READY", { sessionId: s.sessionId, userId });
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []),
        submitAnswer,
        dismissResultOverlay: state.dismissResultOverlay,
        reset: state.reset,
    };
}
