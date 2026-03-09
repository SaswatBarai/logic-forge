/**
 * Character config for story mode — portrait image paths, colors, and display names.
 * Used by npc-dialogue and choice-cards for the DialogueUI-style portrait panel.
 * Images are expected in public/character/; fallback to initials if missing.
 */

import type { StoryZone } from "@/store/story-store";

export interface CharacterConfig {
  name: string;
  color: string;
  borderColor: string;
  image: string;
  initials: string;
}

export const CHARACTER_CONFIG: Record<StoryZone, CharacterConfig> = {
  ARCHIVE_CITADEL: {
    name: "Elder Query",
    color: "#C9A84C",
    borderColor: "#8B6914",
    image: "/character/elder-query.png",
    initials: "EQ",
  },
  FORGE_VILLAGE: {
    name: "Ferron",
    color: "#D97706",
    borderColor: "#92400E",
    image: "/character/ferron.png",
    initials: "FE",
  },
  WALL_OF_GATES: {
    name: "The King",
    color: "#EAB308",
    borderColor: "#854D0E",
    image: "/character/king.png",
    initials: "KI",
  },
};

/**
 * Per-name character overrides for characters that are NOT the zone's primary character.
 * NpcDialogue falls back to the zone config if the name isn't listed here.
 */
export const SPEAKER_CONFIG: Record<string, Omit<CharacterConfig, "image">> = {
  "Sir Axiom":    { name: "Sir Axiom",    color: "#7EB8D4", borderColor: "#3A7A9C", initials: "SA" },
  "Nullus":       { name: "Nullus",       color: "#A855F7", borderColor: "#6B21A8", initials: "NU" },
  "Forge Master": { name: "Forge Master", color: "#F97316", borderColor: "#9A3412", initials: "FM" },
  "Engineer":     { name: "Engineer",     color: "#84CC16", borderColor: "#3F6212", initials: "EN" },
  "Ferro":        { name: "Ferro",        color: "#FB923C", borderColor: "#9A3412", initials: "FO" },
  "Anvila":       { name: "Anvila",       color: "#34D399", borderColor: "#065F46", initials: "AV" },
  "Deadlock":     { name: "Deadlock",     color: "#F43F5E", borderColor: "#9F1239", initials: "DL" },
  "The King":     { name: "The King",     color: "#EAB308", borderColor: "#854D0E", initials: "KI" },
  "Overflow":     { name: "Overflow",     color: "#64748B", borderColor: "#1E293B", initials: "OV" },
  "The Messenger":{ name: "The Messenger",color: "#94A3B8", borderColor: "#334155", initials: "ME" },
  "Vael":         { name: "Vael",         color: "#A78BFA", borderColor: "#5B21B6", initials: "VA" },
};
