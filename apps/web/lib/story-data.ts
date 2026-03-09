import { BookOpen, Cog, Shield, Star, Crown, Flame } from "lucide-react";
import { ARCHIVE_CITADEL_ACTS } from "@/lib/story-zones/archive-citadel";
import { FORGE_VILLAGE_ACTS } from "@/lib/story-zones/forge-village";
import { WALL_OF_GATES_ACTS } from "@/lib/story-zones/wall-of-gates";

export type ChoiceTier = 1 | 2 | 3 | 4;

export interface StoryScar {
    name: string;
    description: string;
}

export interface StoryDebt {
    name: string;
    description: string;
    triggersAt: string;
}

export interface StoryChoice {
    id: string;
    text: string;
    tier: ChoiceTier;
    xp: number;
    consequence: string;
    scar?: StoryScar;
    debt?: StoryDebt;
}

export type SceneMood = "calm" | "tense" | "danger" | "victory" | "sad";

/**
 * A single dialogue step within a scene.
 * - narrator: full-width NarratorBox, no portrait, italic gold text
 * - character: NpcDialogue with pixel portrait, uses the zone's primary character config
 */
export type SceneLine =
  | { type: "narrator"; text: string }
  | { type: "character"; name: string; text: string };

export interface StoryAct {
    actNumber: number;
    title: string;
    /** Ordered list of narrator / character dialogue steps shown one at a time. */
    lines: SceneLine[];
    question: string;
    choices: StoryChoice[];
    mood: SceneMood;
}

export interface StoryZoneData {
    zoneId: string;
    title: string;
    acts: StoryAct[];
}

export const storyData: Record<string, StoryZoneData> = {
    ARCHIVE_CITADEL: {
        zoneId: "ARCHIVE_CITADEL",
        title: "The Archive Citadel",
        acts: ARCHIVE_CITADEL_ACTS,
    },
    FORGE_VILLAGE: {
        zoneId: "FORGE_VILLAGE",
        title: "The Forge Village",
        acts: FORGE_VILLAGE_ACTS,
    },
    WALL_OF_GATES: {
        zoneId: "WALL_OF_GATES",
        title: "The Wall of Gates",
        acts: WALL_OF_GATES_ACTS,
    },
};

export const STORY_ACHIEVEMENTS = [
    { id: "index_master", title: "Index Master", desc: "Complete Archive Citadel with 0 scars", zone: "ARCHIVE_CITADEL" as const, icon: BookOpen },
    { id: "deadlock_breaker", title: "Deadlock Breaker", desc: "Complete Forge Village with energy > 50", zone: "FORGE_VILLAGE" as const, icon: Cog },
    { id: "gate_defender", title: "Gate Defender", desc: "Complete Wall of Gates with 0 debts at Boss", zone: "WALL_OF_GATES" as const, icon: Shield },
    { id: "perfect_run", title: "Perfect Run", desc: "Complete any zone choosing all tier-1 answers", zone: null, icon: Star },
    { id: "ironclad", title: "Ironclad", desc: "Complete all three zones", zone: null, icon: Crown },
    { id: "streak_5", title: "Untouchable", desc: "5-act streak without a scar", zone: null, icon: Flame },
];
