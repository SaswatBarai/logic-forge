# ─── Gateway Dockerfile ───────────────────────────────────────────────
# Build context: monorepo root (context: .)
# ─────────────────────────────────────────────────────────────────────

# ── Stage 1: Base ─────────────────────────────────────────────────────
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate
WORKDIR /app

# ── Stage 2: Install dependencies ─────────────────────────────────────
FROM base AS deps

# Copy workspace manifests
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./

# Copy only the package.json files that this service needs
COPY apps/gateway/package.json            ./apps/gateway/
COPY packages/logger/package.json         ./packages/logger/
COPY packages/types/package.json          ./packages/types/
COPY packages/tsconfig/package.json       ./packages/tsconfig/

RUN pnpm install --frozen-lockfile

# ── Stage 3: Build ────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/ ./

# Copy shared package sources
COPY packages/logger/    ./packages/logger/
COPY packages/types/     ./packages/types/
COPY packages/tsconfig/  ./packages/tsconfig/

# Copy gateway source
COPY apps/gateway/       ./apps/gateway/

# Compile TypeScript → dist/
RUN pnpm --filter @logicforge/gateway run build

# ── Stage 4: Runner ───────────────────────────────────────────────────
# Workspace packages (@logicforge/logger, @logicforge/types) expose raw
# .ts source as their main entry. Use tsx to run them seamlessly, matching
# the pattern used by game-api.
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/ ./

EXPOSE 8080

CMD ["pnpm", "--filter", "@logicforge/gateway", "exec", "tsx", "src/index.ts"]
