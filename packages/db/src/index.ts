import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

// Re-export all Prisma types (enums, model types, etc.)
export * from "@prisma/client";

// Re-export Mongoose auth adapter
export { getMongooseAuthAdapter, getModels } from "./mongoose-auth";
