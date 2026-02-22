import { PrismaClient } from "@prisma/client";
import { PrismaClient as MongoPrismaClient } from "@prisma/mongo-client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  mongoPrisma: MongoPrismaClient | undefined;
};

function createAuthDb(): MongoPrismaClient {
  if (!process.env.MONGO_URL) {
    throw new Error(
      "MONGO_URL is required for the auth database. Set it in apps/web/.env (e.g. MONGO_URL=mongodb://localhost:27017/logic_forge_auth)"
    );
  }
  return new MongoPrismaClient();
}

export const db = globalForPrisma.prisma ?? new PrismaClient();

export const authDb =
  globalForPrisma.mongoPrisma ??
  (() => {
    const client = createAuthDb();
    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.mongoPrisma = client;
    }
    return client;
  })();

export * from "@prisma/client";
