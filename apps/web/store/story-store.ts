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

export type ZoneCompletionStatus = "none" | "started" | "completed";

export interface ConsequencePayload {
    xp?: number;
    scar?: Scar;
    debt?: Debt;
}

export type BossPhase = "intro" | "combat" | "victory" | "defeat" | null;

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

    // ── Boss Combat ──
    bossHealth: number | null;
    bossPhase: BossPhase;

    // ── Gamification ──
    actStreakWithoutScar: number;
    zoneCompletion: Record<StoryZone, ZoneCompletionStatus>;
    achievements: string[];
    consequencePayload: ConsequencePayload | null;
    showRankUp: StoryRank | null;
    showBossGate: boolean;
    zoneCompleteScreen: boolean;
    allTier1: boolean;
    streakXpBonus: number | null;

    // ── Chat ──
    messages: StoryMessage[];
    isStreaming: boolean;
    streamingText: string;

    // ── Choices ──
    choices: string[] | null;
    waitingForChoice: boolean;

    // ── Audio (BGM intensity 0=calm → 3=climactic) ──
    audioIntensity: 0 | 1 | 2 | 3;
    setAudioIntensity: (level: 0 | 1 | 2 | 3) => void;

    // ── Actions ──
    startZone: (zone: StoryZone) => void;
    setZoneCompleted: (zone: StoryZone) => void;
    unlockAchievement: (id: string) => void;
    setConsequencePayload: (payload: ConsequencePayload | null) => void;
    clearConsequencePayload: () => void;
    setShowRankUp: (rank: StoryRank | null) => void;
    clearShowRankUp: () => void;
    setShowBossGate: (v: boolean) => void;
    setZoneCompleteScreen: (v: boolean) => void;
    incrementActStreak: () => void;
    setBossPhase: (phase: BossPhase) => void;
    setBossHealth: (hp: number | null) => void;
    applyEnergyDelta: (tier: number) => void;
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

export const RANK_THRESHOLDS: [number, StoryRank][] = [
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

function rankTier(rank: StoryRank): number {
    const i = RANK_THRESHOLDS.findIndex(([, r]) => r === rank);
    return i >= 0 ? i : 0;
}

// ── Initial state ─────────────────────────────────────────────────────────

const initialZoneCompletion: Record<StoryZone, ZoneCompletionStatus> = {
    ARCHIVE_CITADEL: "none",
    FORGE_VILLAGE: "none",
    WALL_OF_GATES: "none",
};

const initialState = {
    zone: null as StoryZone | null,
    act: 1,
    isActive: false,
    xp: 0,
    rank: "Squire" as StoryRank,
    scars: [] as Scar[],
    debts: [] as Debt[],
    energyMeter: null as number | null,
    bossHealth: null as number | null,
    bossPhase: null as BossPhase,
    actStreakWithoutScar: 0,
    zoneCompletion: { ...initialZoneCompletion },
    achievements: [] as string[],
    consequencePayload: null as ConsequencePayload | null,
    showRankUp: null as StoryRank | null,
    showBossGate: false,
    zoneCompleteScreen: false,
    allTier1: true,
    streakXpBonus: null as number | null,
    messages: [] as StoryMessage[],
    isStreaming: false,
    streamingText: "",
    choices: null as string[] | null,
    waitingForChoice: false,
    audioIntensity: 0 as 0 | 1 | 2 | 3,
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
            s.bossHealth = null;
            s.bossPhase = null;
            s.actStreakWithoutScar = 0;
            s.allTier1 = true;
            s.streakXpBonus = null;
            s.zoneCompletion[zone] = "started";
            s.consequencePayload = null;
            s.showRankUp = null;
            s.showBossGate = false;
            s.zoneCompleteScreen = false;
            s.audioIntensity = 0;
        }),

        setZoneCompleted: (zone) => set((s) => {
            s.zoneCompletion[zone] = "completed";
        }),

        unlockAchievement: (id) => set((s) => {
            if (!s.achievements.includes(id)) s.achievements.push(id);
        }),

        setConsequencePayload: (payload) => set((s) => {
            s.consequencePayload = payload;
        }),

        clearConsequencePayload: () => set((s) => {
            s.consequencePayload = null;
        }),

        setShowRankUp: (rank) => set((s) => {
            s.showRankUp = rank;
        }),

        clearShowRankUp: () => set((s) => {
            s.showRankUp = null;
        }),

        setShowBossGate: (v) => set((s) => {
            s.showBossGate = v;
        }),

        setZoneCompleteScreen: (v) => set((s) => {
            s.zoneCompleteScreen = v;
        }),

        incrementActStreak: () => set((s) => {
            s.actStreakWithoutScar += 1;
        }),

        setBossPhase: (phase) => set((s) => { s.bossPhase = phase; }),
        setBossHealth: (hp) => set((s) => { s.bossHealth = hp; }),

        applyEnergyDelta: (tier) => set((s) => {
            if (s.energyMeter === null) return;
            const deltas: Record<number, number> = { 1: 10, 2: 5, 3: -10, 4: -20 };
            s.energyMeter = Math.max(0, Math.min(100, s.energyMeter + (deltas[tier] ?? 0)));
            if (s.energyMeter <= 0) {
                s.scars.push({ name: "Ferron Collapse", description: "Energy hit zero — system failure.", zone: s.zone!, act: s.act });
            }
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
            const prevRank = s.rank;
            let bonus = 0;
            if (s.actStreakWithoutScar >= 2 && delta > 0) {
                bonus = Math.round(delta * 0.1);
            }
            s.streakXpBonus = bonus > 0 ? bonus : null;
            s.xp = Math.max(0, s.xp + delta + bonus);
            s.rank = computeRank(s.xp);
            if (rankTier(s.rank) > rankTier(prevRank)) s.showRankUp = s.rank;
        }),

        setRank: (rank) => set((s) => { s.rank = rank; }),
        addScar: (scar) => set((s) => {
            s.scars.push(scar);
            s.actStreakWithoutScar = 0;
            s.allTier1 = false;
        }),
        addDebt: (debt) => set((s) => { s.debts.push(debt); }),

        resolveDebt: (name) => set((s) => {
            s.debts = s.debts.filter((d) => d.name !== name);
        }),

        setEnergyMeter: (value) => set((s) => { s.energyMeter = value; }),
        setAct: (act) => set((s) => { s.act = act; }),
        setAudioIntensity: (level) => set((s) => { s.audioIntensity = level; }),

        reset: () => set((s) => ({
            ...initialState,
            zoneCompletion: { ...s.zoneCompletion },
            achievements: [...s.achievements],
        })),
    }))
);
