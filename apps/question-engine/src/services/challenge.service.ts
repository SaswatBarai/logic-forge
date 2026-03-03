import { db } from "@logicforge/db";
import {
    ChallengeQuery,
    RandomChallengeQuery,
} from "@logicforge/types";
import { randomizeChallenge } from "../randomizer/semantic.randomizer";

export async function getChallenges(query: ChallengeQuery) {
    const { category, difficulty, language, page = 1, limit = 10 } = query;
    const where: any = { active: true };
    if (category) where.category = category;
    if (difficulty) where.difficulty = difficulty;
    if (language) where.language = language;

    const [total, challenges] = await Promise.all([
        db.challenge.count({ where }),
        db.challenge.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: "desc" },
        }),
    ]);

    return { meta: { total, page, limit }, challenges: challenges.map(sanitizeChallenge) };
}

export async function getChallengeById(id: string) {
    // Returns FULL challenge including solution — used by game-api internally only
    const challenge = await db.challenge.findUnique({ where: { id } });
    return challenge;
}

export async function getRandomChallenge(query: RandomChallengeQuery) {
    const { category, difficulty, language, excludeIds = [] } = query;
    const where: any = { active: true };
    if (category) where.category = category;
    if (difficulty) where.difficulty = difficulty;
    if (language) where.language = language;
    if (excludeIds.length > 0) where.id = { notIn: excludeIds };

    const count = await db.challenge.count({ where });
    if (count === 0) return null;

    const randomOffset = Math.floor(Math.random() * count);
    const challenge = await db.challenge.findFirst({ where, skip: randomOffset });
    if (!challenge) return null;

    // ── Extract mcqOptions BEFORE randomizeChallenge strips solution ──
    const solution = challenge.solution as any;
    const mcqOptions: Record<string, string> | null =
        solution?.type === "MCQ" ? (solution.options ?? null) : null;

    // randomizeChallenge strips solution + semanticTokens internally
    const randomized = randomizeChallenge(challenge);

    // Inject mcqOptions back into the safe response
    return { ...randomized, mcqOptions };
}

export async function validateAnswer(challengeId: string, submittedCode: string) {
    return { status: "Validating in orchestrator..." };
}

// ── Used by getChallenges (list endpoint) only ────────────────────────────────
function sanitizeChallenge(challenge: any) {
    const solution = challenge.solution as any;
    const mcqOptions: Record<string, string> | null =
        solution?.type === "MCQ" ? (solution.options ?? null) : null;
    const { solution: _sol, semanticTokens: _st, ...safe } = challenge;
    return { ...safe, mcqOptions };
}
