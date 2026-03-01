import fs from "fs/promises";
import path from "path";
import { db } from "@logicforge/db";
import { logger } from "../index";
import { ChallengeCategory, Difficulty, Language } from "@logicforge/types";

// Helper to determine the data directory robustly
const getDataDir = () => path.join(process.cwd(), "data/challenges");

export async function seedChallenges() {
    const dataDir = getDataDir();

    // Read all json files dynamically or explicitly
    const files = ["missing-link.json"]; // Start with one category

    let totalImported = 0;

    for (const file of files) {
        const filePath = path.join(dataDir, file);
        try {
            const data = await fs.readFile(filePath, "utf-8");
            const challenges = JSON.parse(data);

            logger.info(`Seeding ${challenges.length} challenges from ${file}`);

            for (const challenge of challenges) {
                // Upsert or Create based on title + category + language 
                // We'll just create for simplicity in this seed, or check existing
                const existing = await db.challenge.findFirst({
                    where: {
                        title: challenge.title,
                        category: challenge.category,
                        language: challenge.language,
                    }
                });

                if (!existing) {
                    await db.challenge.create({
                        data: {
                            category: challenge.category as ChallengeCategory,
                            difficulty: challenge.difficulty as Difficulty,
                            language: challenge.language as Language,
                            title: challenge.title,
                            description: challenge.description,
                            codeTemplate: challenge.codeTemplate,
                            solution: challenge.solution || {},
                            testCases: challenge.testCases || [],
                            hints: challenge.hints || [],
                            semanticTokens: challenge.semanticTokens || {},
                            timeLimitMs: challenge.timeLimitMs || 60000,
                        }
                    });
                    totalImported++;
                }
            }
        } catch (err: any) {
            if (err.code === "ENOENT") {
                logger.warn(`Seed file ${file} not found at ${filePath}. Make sure you created it.`);
            } else {
                logger.error({ err, file }, "Error seeding challenge file");
                throw err;
            }
        }
    }

    return {
        message: `Successfully seeded ${totalImported} new challenges`,
        totalImported
    };
}
