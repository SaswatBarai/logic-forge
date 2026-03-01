// ─── @logicforge/config — Centralized Configuration ──────────────────
import { z } from "zod";
import dotenv from "dotenv";
import path from "path";

// Load .env from monorepo root
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });

// ─── Environment Schema ──────────────────────────────────────────────
const envSchema = z.object({
    // Database
    DATABASE_URL: z.string().url("DATABASE_URL must be a valid connection string"),
    MONGO_URL: z.string().min(1, "MONGO_URL is required"),
    REDIS_URL: z.string().default("redis://localhost:6379"),

    // Auth
    NEXTAUTH_URL: z.string().url().default("http://localhost:3000"),
    NEXTAUTH_SECRET: z.string().min(1, "NEXTAUTH_SECRET is required"),

    // OAuth (optional in dev, required in prod)
    GITHUB_ID: z.string().default(""),
    GITHUB_SECRET: z.string().default(""),
    GOOGLE_CLIENT_ID: z.string().default(""),
    GOOGLE_CLIENT_SECRET: z.string().default(""),

    // Ports
    PORT_WEB: z.coerce.number().int().default(3000),
    PORT_GAME_API: z.coerce.number().int().default(3001),
    PORT_QUESTION_ENGINE: z.coerce.number().int().default(3002),
    PORT_ANTI_CHEAT: z.coerce.number().int().default(3003),
    PORT_CODE_RUNNER: z.coerce.number().int().default(3004),

    // Service URLs (for inter-service communication)
    QUESTION_ENGINE_URL: z.string().default("http://localhost:3002"),
    CODE_RUNNER_URL: z.string().default("http://localhost:3004"),
    ANTI_CHEAT_URL: z.string().default("http://localhost:3003"),

    // Environment
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

    // Inter-service auth
    INTER_SERVICE_SECRET: z.string().default("dev-inter-service-secret"),
});

type Env = z.infer<typeof envSchema>;

// ─── Parse & Validate ────────────────────────────────────────────────
let _env: Env | null = null;

function getEnv(): Env {
    if (_env) return _env;

    const result = envSchema.safeParse(process.env);
    if (!result.success) {
        const formatted = result.error.flatten().fieldErrors;
        console.error("❌ Invalid environment variables:", JSON.stringify(formatted, null, 2));
        throw new Error(`Invalid environment variables: ${Object.keys(formatted).join(", ")}`);
    }
    _env = result.data;
    return _env;
}

// ─── Structured Config Object ────────────────────────────────────────
export function getConfig() {
    const env = getEnv();

    return {
        env: env.NODE_ENV,
        isDev: env.NODE_ENV === "development",
        isProd: env.NODE_ENV === "production",
        isTest: env.NODE_ENV === "test",

        ports: {
            web: env.PORT_WEB,
            gameApi: env.PORT_GAME_API,
            questionEngine: env.PORT_QUESTION_ENGINE,
            antiCheat: env.PORT_ANTI_CHEAT,
            codeRunner: env.PORT_CODE_RUNNER,
        },

        db: {
            url: env.DATABASE_URL,
        },

        mongo: {
            url: env.MONGO_URL,
        },

        redis: {
            url: env.REDIS_URL,
        },

        auth: {
            url: env.NEXTAUTH_URL,
            secret: env.NEXTAUTH_SECRET,
            github: {
                clientId: env.GITHUB_ID,
                clientSecret: env.GITHUB_SECRET,
            },
            google: {
                clientId: env.GOOGLE_CLIENT_ID,
                clientSecret: env.GOOGLE_CLIENT_SECRET,
            },
        },

        services: {
            questionEngine: env.QUESTION_ENGINE_URL,
            codeRunner: env.CODE_RUNNER_URL,
            antiCheat: env.ANTI_CHEAT_URL,
        },

        interServiceSecret: env.INTER_SERVICE_SECRET,
    } as const;
}

export type AppConfig = ReturnType<typeof getConfig>;

// ─── Redis Client Singleton ──────────────────────────────────────────
import { createClient, type RedisClientType } from "redis";

let _redisClient: RedisClientType | null = null;

export async function getRedisClient(): Promise<RedisClientType> {
    if (_redisClient) return _redisClient;

    const config = getConfig();
    _redisClient = createClient({ url: config.redis.url });

    _redisClient.on("error", (err: Error) => {
        console.error("Redis Client Error:", err);
    });

    await _redisClient.connect();
    return _redisClient;
}

export async function closeRedisClient(): Promise<void> {
    if (_redisClient) {
        await _redisClient.quit();
        _redisClient = null;
    }
}
