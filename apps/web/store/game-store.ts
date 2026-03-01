import { create } from "zustand";
import { WsClientMessage, WsServerMessage } from "@logicforge/types";

const MAX_RECONNECT_ATTEMPTS = 10;
const BASE_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 30000;

export interface RoundResult {
    roundNumber: number;
    verdict: string;
    score: number;
    executionTimeMs: number;
}

export interface GameState {
    // Connection state
    connected: boolean;
    socket: WebSocket | null;
    error: string | null;

    // Reconnection state
    _wsUrl: string | null;
    _reconnectAttempt: number;
    _reconnectTimeoutId: ReturnType<typeof setTimeout> | null;
    _intentionalDisconnect: boolean;

    // Session state
    sessionId: string | null;
    opponentId: string | null;
    status: "LOBBY" | "ACTIVE" | "COMPLETED" | "ERROR" | "QUEUE";

    // Round state
    currentRound: number;
    maxRounds: number;
    remainingMs: number | null;
    challenge: {
        id: string;
        title: string;
        description: string;
        codeTemplate: string;
        timeLimitMs: number;
    } | null;

    // Scores
    totalScore: number;
    opponentScore: number;

    // Round result (populated on ROUND_RESULT, cleared on next ROUND_START)
    lastRoundResult: RoundResult | null;

    // Per-session history for ResultsScreen
    roundHistory: RoundResult[];

    // Actions
    connect: (url: string) => void;
    disconnect: () => void;
    sendMessage: (msg: WsClientMessage) => void;
    joinQueue: () => void;
    submitAnswer: (code: string) => void;
    setError: (err: string) => void;
    clearRoundResult: () => void;
    retryConnection: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
    connected: false,
    socket: null,
    error: null,
    _wsUrl: null,
    _reconnectAttempt: 0,
    _reconnectTimeoutId: null,
    _intentionalDisconnect: false,
    sessionId: null,
    opponentId: null,
    status: "LOBBY",
    currentRound: 0,
    maxRounds: 0,
    remainingMs: null,
    challenge: null,
    totalScore: 0,
    opponentScore: 0,
    lastRoundResult: null,
    roundHistory: [],

    connect: (url: string) => {
        if (get().socket?.readyState === WebSocket.OPEN) return;

        // Clear any pending reconnect timer
        const prevTimeout = get()._reconnectTimeoutId;
        if (prevTimeout) clearTimeout(prevTimeout);

        set({ _wsUrl: url, _intentionalDisconnect: false, _reconnectTimeoutId: null });

        const ws = new WebSocket(url);

        ws.onopen = () => {
            set({ connected: true, socket: ws, error: null, _reconnectAttempt: 0 });
        };

        ws.onmessage = (event) => {
            try {
                const message: WsServerMessage = JSON.parse(event.data);
                handleServerMessage(message, set, get);
            } catch (err) {
                console.error("Failed to parse WS message", event.data);
            }
        };

        ws.onclose = () => {
            set({ connected: false, socket: null });
            scheduleReconnect(set, get);
        };

        ws.onerror = () => {
            set({ error: "Failed to connect to game server" });
        };
    },

    disconnect: () => {
        const { socket, _reconnectTimeoutId } = get();
        // Mark as intentional so onclose doesn't auto-reconnect
        set({ _intentionalDisconnect: true });
        if (_reconnectTimeoutId) clearTimeout(_reconnectTimeoutId);
        if (socket) {
            socket.close();
            set({ connected: false, socket: null, _reconnectTimeoutId: null, _reconnectAttempt: 0 });
        }
    },

    sendMessage: (msg: WsClientMessage) => {
        const { socket, connected } = get();
        if (socket && connected && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(msg));
        }
    },

    joinQueue: () => {
        // matchmaking is triggered via REST /sessions, handled in arcade/page.tsx
    },

    submitAnswer: (code: string) => {
        const { sessionId, currentRound } = get();
        if (!sessionId) return;
        get().sendMessage({
            type: "SUBMIT_ANSWER",
            sessionId,
            roundNumber: currentRound,
            code,
        });
    },

    setError: (error: string) => set({ error }),

    clearRoundResult: () => set({ lastRoundResult: null }),

    retryConnection: () => {
        const { _wsUrl } = get();
        if (!_wsUrl) return;
        set({ _reconnectAttempt: 0, _intentionalDisconnect: false, error: null });
        get().connect(_wsUrl);
    },
}));

// ─── Reconnection with exponential backoff ───────────────────────────
function scheduleReconnect(
    set: (partial: Partial<GameState>) => void,
    get: () => GameState
) {
    const { _intentionalDisconnect, _reconnectAttempt, _wsUrl } = get();

    // Don't reconnect if user explicitly disconnected or no URL stored
    if (_intentionalDisconnect || !_wsUrl) return;

    // Give up after max attempts
    if (_reconnectAttempt >= MAX_RECONNECT_ATTEMPTS) {
        set({ error: "Unable to connect after multiple attempts. Click retry." });
        return;
    }

    const delay = Math.min(
        BASE_RECONNECT_DELAY_MS * Math.pow(2, _reconnectAttempt),
        MAX_RECONNECT_DELAY_MS
    );

    const nextAttempt = _reconnectAttempt + 1;
    set({ _reconnectAttempt: nextAttempt });

    const timeoutId = setTimeout(() => {
        // Re-check: user may have disconnected while timer was pending
        if (get()._intentionalDisconnect) return;
        get().connect(_wsUrl);
    }, delay);

    set({ _reconnectTimeoutId: timeoutId });
}

// Internal handler mapping WS server messages to Zustand state
function handleServerMessage(
    msg: WsServerMessage,
    set: (partial: Partial<GameState>) => void,
    get: () => GameState
) {
    switch (msg.type) {
        case "SESSION_JOINED":
            set({
                sessionId: msg.sessionId,
                currentRound: msg.currentRound,
                maxRounds: msg.maxRounds,
                status: (msg.status as any) || "LOBBY",
            });
            break;

        case "MATCH_FOUND":
            set({
                opponentId: msg.opponentId,
                sessionId: msg.sessionId,
                status: "LOBBY",
            });
            break;

        case "ROUND_START":
            set({
                status: "ACTIVE",
                currentRound: msg.roundNumber,
                challenge: msg.challenge,
                remainingMs: msg.challenge.timeLimitMs,
                lastRoundResult: null, // Clear any previous round result overlay
            });
            break;

        case "TIMER_SYNC":
            set({ remainingMs: msg.remainingMs });
            break;

        case "ROUND_RESULT": {
            const result: RoundResult = {
                roundNumber: msg.roundNumber,
                verdict: msg.verdict,
                score: msg.score,
                executionTimeMs: msg.executionTimeMs ?? 0,
            };
            const prev = get();
            set({
                totalScore: msg.totalScore,
                status: "LOBBY", // Between rounds — wait for next ROUND_START
                lastRoundResult: result,
                roundHistory: [...prev.roundHistory, result],
            });
            break;
        }

        case "OPPONENT_SUBMITTED":
            set({ opponentScore: msg.opponentScore });
            break;

        case "SESSION_COMPLETE":
            set({ status: "COMPLETED", totalScore: msg.totalScore });
            break;

        case "ERROR":
            set({ error: msg.message });
            break;

        case "PONG":
            break;
    }
}
