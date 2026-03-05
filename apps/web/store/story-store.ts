// apps/web/store/story-store.ts

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

// ── Types ─────────────────────────────────────────────────────────────────

export type StoryZone = "ARCHIVE_CITADEL" | "FORGE_VILLAGE" | "WALL_OF_GATES";
export type StoryRank = "Squire" | "Knight" | "Champion" | "Grand Marshal" | "Legend";

export interface Scar {
    name: string;
    description: string;
    zone: StoryZone;
    act: number;
}

export interface Debt {
    name: string;
    description: string;
    triggersAt: string;     // e.g. "Boss Gate" or "Act 3"
    zone: StoryZone;
    act: number;
}

export interface StoryMessage {
    role: "system" | "user" | "assistant";
    content: string;
    timestamp: number;
}

export interface StoryState {
    // ── Session ──
    zone: StoryZone | null;
    act: number;
    isActive: boolean;

    // ── Stats ──
    xp: number;
    rank: StoryRank;
    scars: Scar[];
    debts: Debt[];
    energyMeter: number | null;     // Zone 2 only (0–100)

    // ── Chat ──
    messages: StoryMessage[];
    isStreaming: boolean;
    streamingText: string;          // Current partial response

    // ── Choices ──
    choices: string[] | null;       // Parsed choice options from AI
    waitingForChoice: boolean;

    // ── Actions ──
    startZone: (zone: StoryZone) => void;
    setStreaming: (v: boolean) => void;
    setStreamingText: (text: string) => void;
    appendStreamingText: (chunk: string) => void;
    commitAssistantMessage: () => void;
    addUserMessage: (content: string) => void;
    setChoices: (choices: string[] | null) => void;
    setWaitingForChoice: (v: boolean) => void;
    updateXP: (delta: number) => void;
    setRank: (rank: StoryRank) => void;
    addScar: (scar: Scar) => void;
    addDebt: (debt: Debt) => void;
    resolveDebt: (name: string) => void;
    setEnergyMeter: (value: number | null) => void;
    setAct: (act: number) => void;
    reset: () => void;
}

// ── Rank thresholds ───────────────────────────────────────────────────────

const RANK_THRESHOLDS: [number, StoryRank][] = [
    [0, "Squire"],
    [200, "Knight"],
    [500, "Champion"],
    [900, "Grand Marshal"],
    [1400, "Legend"],
];

function computeRank(xp: number): StoryRank {
    let rank: StoryRank = "Squire";
    for (const [threshold, r] of RANK_THRESHOLDS) {
        if (xp >= threshold) rank = r;
    }
    return rank;
}

// ── Initial state ─────────────────────────────────────────────────────────

const initialState = {
    zone: null as StoryZone | null,
    act: 1,
    isActive: false,
    xp: 0,
    rank: "Squire" as StoryRank,
    scars: [] as Scar[],
    debts: [] as Debt[],
    energyMeter: null as number | null,
    messages: [] as StoryMessage[],
    isStreaming: false,
    streamingText: "",
    choices: null as string[] | null,
    waitingForChoice: false,
};

// ── Store ─────────────────────────────────────────────────────────────────

export const useStoryStore = create<StoryState>()(
    immer((set) => ({
        ...initialState,

        startZone: (zone) => set((s) => {
            s.zone = zone;
            s.act = 1;
            s.isActive = true;
            s.xp = 0;
            s.rank = "Squire";
            s.scars = [];
            s.debts = [];
            s.messages = [];
            s.energyMeter = zone === "FORGE_VILLAGE" ? 72 : null;
        }),

        setStreaming: (v) => set((s) => { s.isStreaming = v; }),
        setStreamingText: (text) => set((s) => { s.streamingText = text; }),
        appendStreamingText: (chunk) => set((s) => { s.streamingText += chunk; }),

        commitAssistantMessage: () => set((s) => {
            if (s.streamingText.trim()) {
                s.messages.push({
                    role: "assistant",
                    content: s.streamingText,
                    timestamp: Date.now(),
                });
            }
            s.streamingText = "";
            s.isStreaming = false;
        }),

        addUserMessage: (content) => set((s) => {
            s.messages.push({ role: "user", content, timestamp: Date.now() });
        }),

        setChoices: (choices) => set((s) => { s.choices = choices; }),
        setWaitingForChoice: (v) => set((s) => { s.waitingForChoice = v; }),

        updateXP: (delta) => set((s) => {
            s.xp = Math.max(0, s.xp + delta);
            s.rank = computeRank(s.xp);
        }),

        setRank: (rank) => set((s) => { s.rank = rank; }),
        addScar: (scar) => set((s) => { s.scars.push(scar); }),
        addDebt: (debt) => set((s) => { s.debts.push(debt); }),

        resolveDebt: (name) => set((s) => {
            s.debts = s.debts.filter((d) => d.name !== name);
        }),

        setEnergyMeter: (value) => set((s) => { s.energyMeter = value; }),
        setAct: (act) => set((s) => { s.act = act; }),

        reset: () => set(() => ({ ...initialState })),
    }))
);
