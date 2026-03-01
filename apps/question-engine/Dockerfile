# ─── Question Engine Dockerfile ───────────────────────────────────────
# Build context must be the monorepo root (context: .)
# ──────────────────────────────────────────────────────────────────────

# ── Stage 1: Base ─────────────────────────────────────────────────────
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate
WORKDIR /app

# ── Stage 2: Install dependencies ────────────────────────────────────
FROM base AS deps

# Copy workspace structure files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./

# Copy package.json for each workspace package this app needs
COPY apps/question-engine/package.json ./apps/question-engine/
COPY packages/config/package.json ./packages/config/
COPY packages/db/package.json ./packages/db/
COPY packages/logger/package.json ./packages/logger/
COPY packages/types/package.json ./packages/types/
COPY packages/tsconfig/package.json ./packages/tsconfig/

RUN pnpm install --frozen-lockfile

# ── Stage 3: Source ──────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/ ./

# Copy source for workspace packages
COPY packages/config/ ./packages/config/
COPY packages/db/ ./packages/db/
COPY packages/logger/ ./packages/logger/
COPY packages/types/ ./packages/types/
COPY packages/tsconfig/ ./packages/tsconfig/

# Copy question-engine source + challenge data
COPY apps/question-engine/ ./apps/question-engine/

# Generate Prisma client
RUN pnpm --filter @logicforge/db run db:generate

# ── Stage 4: Runtime (use tsx to avoid ESM directory-import issues) ───
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/ ./

EXPOSE 3002

CMD ["pnpm", "--filter", "@logicforge/question-engine", "exec", "tsx", "src/index.ts"]