FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate
WORKDIR /app

# ── Stage 1: Install deps ──────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/db/package.json ./packages/db/
COPY packages/config/package.json ./packages/config/
COPY packages/logger/package.json ./packages/logger/
COPY packages/types/package.json ./packages/types/
COPY packages/tsconfig/package.json ./packages/tsconfig/
RUN pnpm install --frozen-lockfile

# ── Stage 2: Build ─────────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/ ./

# Copy full source of all workspace packages
COPY packages/config/    ./packages/config/
COPY packages/db/        ./packages/db/
COPY packages/logger/    ./packages/logger/
COPY packages/types/     ./packages/types/
COPY packages/tsconfig/  ./packages/tsconfig/
COPY packages/auth/      ./packages/auth/    

COPY apps/web/ ./apps/web/

ENV NEXT_TELEMETRY_DISABLED=1

ARG NEXT_PUBLIC_GAME_API_URL
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_GAME_API_URL=$NEXT_PUBLIC_GAME_API_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

RUN cd packages/db && npx prisma generate --config ./prisma.config.ts
RUN pnpm --filter @logicforge/web run build

# ── Stage 3: Runtime ───────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
