import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma-mongo/mongo.prisma",
  datasource: {
    url: env("MONGO_DATABASE_URL"),
  },
});
