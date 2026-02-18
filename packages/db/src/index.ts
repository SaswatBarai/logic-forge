import { PrismaClient } from "@prisma/client";
import { PrismaClient as MongoPrismaClient } from "@prisma/mongo-client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  mongoPrisma: MongoPrismaClient | undefined;
};


export const db = globalForPrisma.prisma ?? new PrismaClient();


export const authDb = globalForPrisma.mongoPrisma ?? new MongoPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
  globalForPrisma.mongoPrisma = authDb;
}

export * from "@prisma/client";
