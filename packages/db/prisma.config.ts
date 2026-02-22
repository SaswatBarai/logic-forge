import path from "path";
import dotenv from "dotenv";

// Load root and web app .env so DATABASE_URL/MONGO_URL are available when running from packages/db
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });
dotenv.config({ path: path.resolve(process.cwd(), "../../apps/web/.env") });

import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL ?? "",
  },
});
