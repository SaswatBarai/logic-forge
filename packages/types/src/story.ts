// ─── Story Mode Types ────────────────────────────────────────────────
import { z } from "zod";

export const StoryChapterEnum = z.enum([
    "THE_ARCHIVE",
    "THE_SHIELD_GENERATOR",
    "THE_AETHER_STREAM",
]);
export type StoryChapter = z.infer<typeof StoryChapterEnum>;

export const StoryProgressStatusEnum = z.enum(["IN_PROGRESS", "COMPLETED"]);

// ─── Story Progress Response ─────────────────────────────────────────
export const StoryProgressResponseSchema = z.object({
    id: z.string().uuid(),
    userId: z.string(),
    chapter: StoryChapterEnum,
    status: StoryProgressStatusEnum,
    score: z.number().int(),
    startedAt: z.string().datetime(),
    completedAt: z.string().datetime().nullable(),
});
export type StoryProgressResponse = z.infer<typeof StoryProgressResponseSchema>;

// ─── Chapter Descriptions (for lobby UI) ─────────────────────────────
export interface ChapterMeta {
    chapter: StoryChapter;
    title: string;
    subtitle: string;
    description: string;
    estimatedMinutes: number;
    skills: string[];
}

export const CHAPTER_METADATA: ChapterMeta[] = [
    {
        chapter: "THE_ARCHIVE",
        title: "The Archive",
        subtitle: "Database Normalization",
        description:
            "Repair corrupted data entries, decompose into Third Normal Form, and define primary and foreign key relationships.",
        estimatedMinutes: 30,
        skills: ["Relational modeling", "3NF decomposition", "Data integrity"],
    },
    {
        chapter: "THE_SHIELD_GENERATOR",
        title: "The Shield Generator",
        subtitle: "OOP and System Design",
        description:
            "Refactor a tightly coupled codebase by introducing interfaces, applying Dependency Injection, and implementing the Strategy Pattern.",
        estimatedMinutes: 35,
        skills: [
            "Interface design",
            "Dependency Injection",
            "Strategy Pattern",
            "SOLID principles",
        ],
    },
    {
        chapter: "THE_AETHER_STREAM",
        title: "The Aether-Stream",
        subtitle: "Networking",
        description:
            "Reorder out-of-sequence packets, verify checksums for data integrity, and identify and filter malicious payloads before the stream timer expires.",
        estimatedMinutes: 25,
        skills: [
            "Packet ordering",
            "Checksum verification",
            "Security awareness",
            "Time pressure management",
        ],
    },
];
