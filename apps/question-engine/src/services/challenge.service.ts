import { db } from "@logicforge/db";
import {
    ChallengeQuery,
    RandomChallengeQuery,
    SubmissionVerdict
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
            orderBy: { createdAt: 'desc' }
        })
    ]);

    return { meta: { total, page, limit }, challenges };
}

export async function getChallengeById(id: string) {
    const challenge = await db.challenge.findUnique({ where: { id } });
    return challenge;
}

export async function getRandomChallenge(query: RandomChallengeQuery) {
    const { category, difficulty, language, excludeIds = [] } = query;

    const where: any = { active: true };
    if (category) where.category = category;
    if (difficulty) where.difficulty = difficulty;
    if (language) where.language = language;

    if (excludeIds.length > 0) {
        where.id = { notIn: excludeIds };
    }

    // Count to pick a random offset
    const count = await db.challenge.count({ where });
    if (count === 0) return null;

    const randomOffset = Math.floor(Math.random() * count);
    const challenge = await db.challenge.findFirst({
        where,
        skip: randomOffset,
    });

    if (!challenge) return null;

    // Apply Semantic Randomization to defeat LLMs/cheating
    return randomizeChallenge(challenge);
}

export async function validateAnswer(challengeId: string, submittedCode: string) {
    // Real implementation will probably just enqueue it to Game API
    // Or send it to the Code Execution Engine via HTTP.
    // Question Engine shouldn't execute code, it just manages challenge data.
    // We'll stub this and do execution via Game API orchestrating with Code Runner.
    return { status: "Validating in orchestrator..." };
}
