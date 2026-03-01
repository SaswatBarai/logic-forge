import { create } from "zustand";
import { WsClientMessage, WsServerMessage } from "@logicforge/types";

export interface GameState {
    // Connection state
    connected: boolean;
    socket: WebSocket | null;
    error: string | null;

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

    // Actions
    connect: (url: string) => void;
    disconnect: () => void;
    sendMessage: (msg: WsClientMessage) => void;
    joinQueue: () => void;
    submitAnswer: (code: string) => void;
    setError: (err: string) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
    connected: false,
    socket: null,
    error: null,
    sessionId: null,
    opponentId: null,
    status: "LOBBY",
    currentRound: 0,
    maxRounds: 0,
    remainingMs: null,
    challenge: null,
    totalScore: 0,
    opponentScore: 0,

    connect: (url: string) => {
        if (get().socket?.readyState === WebSocket.OPEN) return;

        const ws = new WebSocket(url);

        ws.onopen = () => {
            set({ connected: true, socket: ws, error: null });
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
        };

        ws.onerror = () => {
            set({ error: "Failed to connect to game server" });
        };
    },

    disconnect: () => {
        const { socket } = get();
        if (socket) {
            socket.close();
            set({ connected: false, socket: null });
        }
    },

    sendMessage: (msg: WsClientMessage) => {
        const { socket, connected } = get();
        if (socket && connected && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(msg));
        }
    },

    joinQueue: () => {
        // For now we assume clicking 'Play Dual' invokes the Matchmaker API.
        // The matchmaker returns a Session ID. We'll do that before calling `joinSession`.
    },

    submitAnswer: (code: string) => {
        const { sessionId, currentRound } = get();
        if (!sessionId) return;

        get().sendMessage({
            type: "SUBMIT_ANSWER",
            sessionId,
            roundNumber: currentRound,
            code
        });
    },

    setError: (error: string) => set({ error })
}));

// Internal handler mapping messages from server to state
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
            });
            break;

        case "TIMER_SYNC":
            // Smooth timer sync, maybe don't overwrite if discrepancy is very small 
            // to avoid visual judder, but simple for now:
            set({ remainingMs: msg.remainingMs });
            break;

        case "ROUND_RESULT":
            // Show results overlay! The new challenge will arrive next via ROUND_START.
            set({
                totalScore: msg.totalScore,
                status: "LOBBY" // Wait in lobby state between rounds
            });
            break;

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
            // Latency calculation could be done here
            break;
    }
}
