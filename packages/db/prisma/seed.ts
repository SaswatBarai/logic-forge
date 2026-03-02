import { ChallengeCategory, Language, Prisma, PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { join, resolve } from "path";
import dotenv from "dotenv";

// Load .env so DATABASE_URL is set when running: pnpm --filter @logicforge/db seed
dotenv.config();
dotenv.config({ path: resolve(process.cwd(), "../../.env") });

const prisma = new PrismaClient();

function loadSeed(filename: string) {
    const filePath = join(process.cwd(), "prisma", "seeds", "challenges", filename);
    return JSON.parse(readFileSync(filePath, "utf-8")) as unknown[];
}

async function main() {
    const files = [
        "missing-link.json",
        "bottleneck-breaker.json",
        "state-tracing.json",
        "syntax-error.json",
    ];

    const challenges = files.flatMap(loadSeed);

    console.log(`Seeding ${challenges.length} challenges...`);

    for (const challenge of challenges) {
        await prisma.challenge.upsert({
            where: {
                title_language_category: {
                    title: (challenge as Record<string, unknown>).title as string,
                    language: (challenge as Record<string, unknown>).language as Language,
                    category: (challenge as Record<string, unknown>).category as ChallengeCategory,
                },
            },
            update: challenge as Prisma.ChallengeUpdateInput,
            create: challenge as Prisma.ChallengeCreateInput,
        });
    }

    console.log("✅ Seed complete");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
