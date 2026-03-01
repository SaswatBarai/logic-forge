import { getRedisClient } from "@logicforge/config";
import { db } from "@logicforge/db";
import { logger } from "../app";
import { getRoundChallenge } from "./round.service";

const QUESTION_ENGINE_URL =
    process.env.QUESTION_ENGINE_URL || "http://localhost:3002";
const CODE_RUNNER_URL =
    process.env.CODE_RUNNER_URL || "http://localhost:3004";

// ---------------------------------------------------------------------------
// Session join / state hydration
// ---------------------------------------------------------------------------

/**
 * Joins a user into a game session.
 * Initialises Redis state if it's the first time joining.
 */
export async function joinSession(sessionId: string, userId: string) {
    const redis = await getRedisClient();
    const cacheKey = `session:${sessionId}`;

    const stateStr = await redis.get(cacheKey);
    if (!stateStr) {
        const sessionDoc = await db.gameSession.findUnique({
            where: { id: sessionId },
        });

        if (!sessionDoc) {
            throw new Error(`Session ${sessionId} not found in DB`);
        }
        if (sessionDoc.status === "COMPLETED" || sessionDoc.status === "ABANDONED") {
            throw new Error(`Session is already ${sessionDoc.status}`);
        }

        // Cast to any because Prisma client types may be stale until `db:generate` is re-run
        const doc = sessionDoc as any;
        const initialState = {
            id: doc.id,
            mode: doc.mode,
            status: doc.status,
            currentRound: doc.currentRound,
            maxRounds: doc.maxRounds,
            startedAt: doc.startedAt,
            roundStartTime: null,
            roundTimeLimit: 60_000,
        };

        await redis.set(cacheKey, JSON.stringify(initialState));
        await redis.expire(cacheKey, 3600);
        return initialState;
    }

    return JSON.parse(stateStr);
}

// ---------------------------------------------------------------------------
// Real submission pipeline
// ---------------------------------------------------------------------------

/**
 * Handles an incoming code submission via WS:
 *   1. Fetch challenge + test cases from Question Engine
 *   2. Send code to Code Runner → get verdict
 *   3. Persist Submission to Postgres
 *   4. Return structured result for socket.handler to use
 */
export async function recordSubmission(
    sessionId: string,
    roundNumber: number,
    userId: string,
    code: string
): Promise<{
    verdict: string;
    score: number;
    executionTimeMs: number;
    testResults: Array<{ passed: boolean; input: string; expectedOutput: string; actualOutput: string }>;
}> {
    logger.info({ sessionId, roundNumber, userId }, "Processing code submission");

    // 1. Retrieve round context (challengeId + language) from Redis
    const roundCtx = await getRoundChallenge(sessionId);
    if (!roundCtx) {
        logger.warn({ sessionId }, "No round context found in cache — defaulting to PENDING");
        return { verdict: "PENDING", score: 0, executionTimeMs: 0, testResults: [] };
    }

    let testCases: Array<{ input: string; expectedOutput: string }> = [];
    let language = roundCtx.language;

    // 2. Fetch full challenge details from Question Engine (for testCases)
    try {
        const challengeRes = await fetch(
            `${QUESTION_ENGINE_URL}/api/v1/challenges/${roundCtx.challengeId}`
        );
        if (challengeRes.ok) {
            const { data: challenge } = await challengeRes.json();
            testCases = Array.isArray(challenge.testCases) ? challenge.testCases : [];
            language = challenge.language ?? language;
        } else {
            logger.warn(
                { challengeId: roundCtx.challengeId },
                "Failed to fetch challenge from QE — using empty testCases"
            );
        }
    } catch (err) {
        logger.error({ err }, "Error fetching challenge from Question Engine");
    }

    // 3. Send to Code Runner
    let verdict = "RUNTIME_ERROR";
    let executionTimeMs = 0;
    let testResults: Array<{
        passed: boolean;
        input: string;
        expectedOutput: string;
        actualOutput: string;
    }> = [];

    try {
        const execRes = await fetch(`${CODE_RUNNER_URL}/api/v1/execute`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                language,
                code,
                testCases,
                timeLimitMs: roundCtx.timeLimitMs,
            }),
        });

        if (execRes.ok) {
            const execData = await execRes.json();
            verdict = execData.verdict ?? "RUNTIME_ERROR";
            executionTimeMs = execData.totalExecutionTimeMs ?? 0;
            testResults = execData.testResults ?? [];
        } else {
            logger.warn({ status: execRes.status }, "Code Runner returned non-200");
        }
    } catch (err) {
        logger.error({ err }, "Error calling Code Runner");
        verdict = "RUNTIME_ERROR";
    }

    // 4. Compute score: 100 for CORRECT, 0 otherwise
    const score = verdict === "CORRECT" ? 100 : 0;

    // 5. Persist Round + Submission to Postgres (best effort — don't block response)
    persistSubmission(sessionId, roundNumber, roundCtx.challengeId, roundCtx.startedAt, code, verdict, score, executionTimeMs, testResults);

    logger.info({ sessionId, roundNumber, verdict, score }, "Submission processed");
    return { verdict, score, executionTimeMs, testResults };
}

/**
 * Fire-and-forget persistence so WS response is not delayed by DB writes.
 */
async function persistSubmission(
    sessionId: string,
    roundNumber: number,
    challengeId: string,
    roundStartedAt: number,
    code: string,
    verdict: string,
    score: number,
    executionTimeMs: number,
    testResults: unknown[]
) {
    try {
        // Upsert Round row — cast db to any since Prisma client may be stale until db:generate
        const dbAny = db as any;
        const round = await dbAny.round.upsert({
            where: { sessionId_roundNumber: { sessionId, roundNumber } },
            update: { status: "COMPLETED", endedAt: new Date(), score },
            create: {
                sessionId,
                roundNumber,
                challengeId,
                status: "COMPLETED",
                score,
                startedAt: new Date(roundStartedAt),
                endedAt: new Date(),
            },
        });

        // Create Submission linked to the Round
        await dbAny.submission.create({
            data: {
                roundId: round.id,
                code,
                verdict: verdict as any,
                executionTimeMs,
                testResults: testResults as any,
            },
        });
    } catch (err) {
        logger.error({ err, sessionId, roundNumber }, "Failed to persist Submission to DB");
    }
}

// ---------------------------------------------------------------------------
// Forfeit / disconnect
// ---------------------------------------------------------------------------

/**
 * Explicit forfeit or timeout when a player disconnects.
 */
export async function forfeitSession(sessionId: string, userId: string | undefined) {
    if (!userId) return;

    logger.debug({ sessionId, userId }, "Forfeiting session due to LEAVE/Disconnect");

    await db.gameSession.update({
        where: { id: sessionId },
        data: { status: "ABANDONED", endedAt: new Date() },
    });

    const redis = await getRedisClient();
    await redis.del(`session:${sessionId}`);
}
