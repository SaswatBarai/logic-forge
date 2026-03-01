# LogicForge — Phase Planner & Development Handoff

> **Last Updated**: 2026-03-01  
> **Status**: Phases 1–5 COMPLETE | Phases 6–8 PENDING  
> **Stack**: Turborepo · pnpm · Next.js 14 · Express · Go (Gin) · Prisma · Redis · Docker

---

## Architecture Overview

```mermaid
graph LR
    subgraph Frontend
        WEB["Next.js Web App<br/>:3000"]
    end
    subgraph Backend Services
        GA["Game API<br/>Express+WS :3001"]
        QE["Question Engine<br/>Express :3002"]
        AC["Anti-Cheat Engine<br/>Express :3003"]
        CR["Code Runner<br/>Go/Gin :3004 (Docker)"]
    end
    subgraph Infrastructure
        PG[(PostgreSQL :5432)]
        MG[(MongoDB :27017)]
        RD[(Redis :6379)]
    end

    WEB -->|REST + WS| GA
    GA -->|HTTP| QE
    GA -->|HTTP| CR
    GA -->|HTTP| AC
    GA --> PG
    GA --> RD
    QE --> PG
    AC --> PG
    WEB -->|NextAuth| MG
```

---

## Phase Summary

| # | Phase | Status | Port | Key Files |
|---|-------|--------|------|-----------|
| 1 | Foundation & Shared Infrastructure | ✅ DONE | — | `packages/{types,config,logger,db}` |
| 2 | Question Engine Service | ✅ DONE | 3002 | `apps/question-engine/src/` |
| 3 | Game API (Session Orchestration) | ✅ DONE | 3001 | `apps/game-api/src/` |
| 4 | Code Execution Engine | ✅ DONE | 3004 | `apps/code-runner/` (Go, Docker) |
| 5 | Arcade Mode Frontend | ✅ DONE | 3000 | `apps/web/{store,hooks,components/game}` |
| 6 | Anti-Cheat Security Engine | 🔴 TODO | 3003 | `apps/anti-cheat/src/` (empty scaffold) |
| 7 | Story Mode (Campaign Chapters) | 🔴 TODO | — | Extends Game API + Web |
| 8 | Recruiter Dashboard & Admin | 🔴 TODO | — | Extends Web |

---

## ✅ PHASE 1 — Foundation & Shared Infrastructure (COMPLETE)

### What Was Built

#### `packages/db` — Prisma ORM
- **`prisma/schema.prisma`**: 8 models + 10 enums covering full PRD data model
  - Models: `GameSession`, `Round`, `Challenge`, `Submission`, `StoryProgress`, `DualMatch`, `RiskScore`
  - Enums: `SessionType`, `PlayerFormat`, `SessionStatus`, `Difficulty`, `RoundStatus`, `SubmissionVerdict`, `ChallengeCategory`, `StoryChapter`
- **`src/index.ts`**: Re-exports Prisma client (`db`), all Prisma types, Mongoose auth adapter
- DB is pushed and live against local Postgres via Docker Compose

#### `packages/types` — Shared Zod Schemas & TS Types
- **`session.ts`**: `CreateSessionSchema`, `SessionResponseSchema`, mode/format enums
- **`challenge.ts`**: `ChallengeQuerySchema`, `ChallengeResponseSchema`, category/difficulty enums
- **`submission.ts`**: `SubmitCodeSchema`, `CodeExecutionResponseSchema`, `TestResultSchema`
- **`websocket.ts`**: Discriminated union `WsClientMessage` (Zod-validated) + `WsServerMessage` TS types
  - Client→Server: `JOIN_SESSION`, `READY`, `SUBMIT_ANSWER`, `PING`, `LEAVE_SESSION`
  - Server→Client: `SESSION_JOINED`, `MATCH_FOUND`, `ROUND_START`, `TIMER_SYNC`, `ROUND_RESULT`, `OPPONENT_SUBMITTED`, `SESSION_COMPLETE`, `PONG`, `ERROR`
- **`anti-cheat.ts`**: `TelemetryEventSchema`, `TelemetryBatchSchema`, `RiskScoreResponseSchema`, default signal weights
- **`api-responses.ts`**: Standard envelope `ApiSuccessSchema` / `ApiErrorSchema`, exhaustive error code registry
- **`story.ts`**: Chapter metadata, `StoryProgressSchema`

#### `packages/config` — Environment & Redis
- Zod-validated env vars with fail-fast on missing required values
- Structured config object: `ports`, `db`, `mongo`, `redis`, `auth`, `env`
- Redis client singleton via `getRedisClient()` / `closeRedisClient()`

#### `packages/logger` — Structured Logging
- Built on `pino`; pretty-printing in dev, JSON in production
- Child loggers for request-scoped context (`requestId`, `userId`)

### How To Verify
```bash
pnpm --filter @logicforge/db db:generate  # Regenerate Prisma client
pnpm --filter @logicforge/db db:push      # Push schema to DB
pnpm build                                # Build all shared packages
```

---

## ✅ PHASE 2 — Question Engine Service (COMPLETE)

### What Was Built — `apps/question-engine/`

| File | Purpose |
|------|---------|
| `src/index.ts` | Express bootstrap, middleware (CORS, JSON), routing, graceful shutdown |
| `src/routes/challenge.routes.ts` | `GET /`, `GET /:id`, `GET /random`, `POST /validate`, `POST /seed` |
| `src/routes/health.routes.ts` | `GET /health` |
| `src/handlers/challenge.handler.ts` | Request controllers with Zod validation + `asyncHandler` |
| `src/handlers/seed.handler.ts` | Triggers `seed.service.ts` |
| `src/services/challenge.service.ts` | Prisma queries with pagination, filtering, random offset, semantic randomization |
| `src/services/seed.service.ts` | Reads JSON from `data/challenges/` and upserts into Postgres |
| `src/randomizer/semantic.randomizer.ts` | Swaps variable/function names per `semanticTokens` field using synonym pools |
| `src/randomizer/token-maps.ts` | Synonym dictionaries by context (COLLECTION, PROCESS, etc.) |
| `src/middleware/error.middleware.ts` | Catches `ZodError` → standard `ApiError` format |
| `data/challenges/missing-link.json` | 2 sample seed challenges (Python + Java) |

### Verified Endpoints
```bash
# Seed challenges into DB
curl -X POST http://localhost:3002/api/v1/challenges/seed
# → {"success":true,"data":{"message":"Successfully seeded 2 new challenges","totalImported":2}}

# Fetch a random challenge (variable names randomized per call)
curl "http://localhost:3002/api/v1/challenges/random?category=THE_MISSING_LINK&language=PYTHON"
# → {"success":true,"data":{...randomized challenge...}}
```

### Known Gaps (for future dev)
- Only 2 seed challenges exist — need 40+ across all 4 categories and 3 languages
- `POST /validate` handler exists but does not yet call Code Runner
- Auth middleware (`auth.middleware.ts`) is scaffolded but not enforced
- No `bottleneck-breaker.json`, `state-tracing.json`, or `syntax-error-detection.json` seed files yet

---

## ✅ PHASE 3 — Game API Service (COMPLETE)

### What Was Built — `apps/game-api/`

| File | Purpose |
|------|---------|
| `src/app.ts` | Express app with Helmet, CORS, JSON, error middleware, session routes |
| `src/index.ts` | HTTP + WebSocket server bootstrap with graceful shutdown |
| `src/routes/session.routes.ts` | `POST /sessions` (create/matchmake), `DELETE /sessions/queue` |
| `src/websocket/socket.manager.ts` | WS lifecycle, keepalive ping/pong, `sessionRooms` Map, `broadcastToSession()` |
| `src/websocket/socket.handler.ts` | Routes validated `WsClientMessage` → session logic (join, submit, forfeit) |
| `src/services/session.service.ts` | Hybrid Redis cache + Postgres for session state (join, submit stub, forfeit) |
| `src/services/matchmaker.service.ts` | Redis Set-based queue: `findOrQueueMatch()`, `dequeueMatch()` |

### Verified Endpoints
```bash
# Health check
curl http://localhost:3001/api/v1/health
# → {"status":"ok","service":"game-api"}

# Join matchmaker queue (first user → QUEUED)
curl -X POST http://localhost:3001/api/v1/sessions -H "Content-Type: application/json" -d '{"mode":"ARCADE","playerFormat":"DUAL"}'
# → {"success":true,"data":{"status":"QUEUED"}}
```

### Known Gaps (for future dev)
- **Auth**: `userId` is hardcoded as `"mock-user-id"` — needs NextAuth JWT verification
- **Round orchestration**: `round.service.ts` and `timer.service.ts` do not exist yet
- **Submit flow**: `recordSubmission()` in `session.service.ts` is a stub returning `{verdict:"PENDING"}`
  - Needs to: (1) call Question Engine `/validate`, (2) call Code Runner `/execute`, (3) broadcast `ROUND_RESULT`
- **Dual Mode**: Matchmaker creates sessions but round sync between two players not implemented
- **Session start**: No `POST /sessions/:id/start` endpoint to transition LOBBY → ACTIVE

---

## ✅ PHASE 4 — Code Execution Engine (COMPLETE)

### What Was Built — `apps/code-runner/` (Go)

| File | Purpose |
|------|---------|
| `cmd/server/main.go` | Gin HTTP server on port 3004 |
| `api/execute.go` | `POST /api/v1/execute` handler with JSON binding |
| `executor/pipeline.go` | Orchestrator: creates sandbox dir → compile → run tests → cleanup |
| `sandbox/runner.go` | `os/exec` with `context.WithTimeout` for hard kill |
| `languages/strategy.go` | `LanguageStrategy` interface + file helpers |
| `languages/python.go` | Python: write `main.py` → `python3 < input.txt` |
| `languages/cpp.go` | C++: `g++ -O2 -std=c++17` → `./a.out < input.txt` |
| `languages/java.go` | Java: `javac Main.java` → `java -cp . Main < input.txt` |
| `Dockerfile` | Multi-stage: `golang:1.22-alpine` builder → `alpine:3.19` with Python3 + OpenJDK21 + g++ |

### Running via Docker
```bash
# Build and start (already in docker-compose.yml)
docker compose up -d code-runner --build

# Test Python execution
curl -X POST http://localhost:3004/api/v1/execute \
  -H "Content-Type: application/json" \
  -d '{"language":"PYTHON","code":"print(int(input())+int(input()))","testCases":[{"input":"3\n5","expectedOutput":"8"}]}'
# → {"verdict":"CORRECT","testResults":[{"passed":true,...}],"totalExecutionTimeMs":29}

# Test timeout enforcement
curl -X POST http://localhost:3004/api/v1/execute \
  -H "Content-Type: application/json" \
  -d '{"language":"PYTHON","code":"import time; time.sleep(2)","testCases":[{"input":"","expectedOutput":""}],"timeLimitMs":1000}'
# → {"verdict":"TIMEOUT",...}
```

### Verdicts Supported
`CORRECT` | `INCORRECT` | `PARTIAL` | `TIMEOUT` | `RUNTIME_ERROR` | `COMPILE_ERROR`

### Known Gaps (for future dev)
- No memory limit enforcement (needs cgroups in Docker)
- No worker pool / concurrency limiter (`pool.go` not implemented)
- Java class name hardcoded to `Main` — needs parsing from source code
- No rate limiting middleware
- `Makefile` is empty

---

## ✅ PHASE 5 — Arcade Mode Frontend (COMPLETE)

### What Was Built — `apps/web/`

| File | Purpose |
|------|---------|
| `store/game-store.ts` | Zustand store: WS connection, session state, round state, scores, server message handler |
| `hooks/use-game-engine.ts` | React hook wrapping Zustand with memoized actions: `joinSession`, `submitCode`, `readyUp` |
| `components/game/code-editor.tsx` | Monaco Editor with custom `logicforge-dark` theme |
| `components/game/prompt-canvas.tsx` | HTML5 Canvas renderer for challenge text (anti-copy, right-click blocked) |
| `components/game/lobby.tsx` | Matchmaker waiting UI with animated loading state |
| `components/game/arena.tsx` | Full game layout: HUD (timer + scores) + resizable panels (prompt | editor | output) |
| `components/ui/resizable.tsx` | Radix-based resizable panel primitives |
| `app/(game)/arcade/page.tsx` | Arcade mode page: intro → queue → lobby → arena → results |

### Dependencies Added
- `zustand@^4.5.1` — lightweight reactive state
- `@monaco-editor/react@^4.6.0` — code editor
- `react-resizable-panels` — already existed

### Build Verification
```bash
pnpm --filter @logicforge/web build  # ✅ Passes (production build)
```

### Known Gaps (for future dev)
- `arena.tsx` submit button calls `submitCode()` but actual WS→Code Runner pipeline not wired end-to-end
- No `TimerBar` component with visual countdown gradient
- No `RoundTransition` animation between challenges
- No `ResultsScreen` detailed per-round breakdown page
- No `DualModeOverlay` showing opponent status
- `LivesDisplay` for Live Mode not implemented
- Lobby page (`app/(game)/lobby/`) is empty (has `.gitkeep` only)
- Results page (`app/(game)/results/`) is empty

---

## 🔴 PHASE 6 — Anti-Cheat Security Engine (TODO)

**Goal**: Build behavioral telemetry collection, risk scoring, and recruiter-facing flag system.

### Service Scaffold Status
`apps/anti-cheat/src/` directory structure exists with empty folders:
- `config/`, `handlers/`, `models/`, `routes/`, `scoring/`, `storage/`, `websocket/`
- `index.ts` — exists but empty/minimal

### Tasks To Implement

#### 6.1 Backend Service (`apps/anti-cheat/src/`)

| Priority | File to Create | What It Does |
|----------|---------------|--------------|
| 🔴 High | `index.ts` | Express bootstrap (copy pattern from `question-engine/src/index.ts`) |
| 🔴 High | `routes/telemetry.routes.ts` | `POST /api/v1/telemetry/batch` — ingest client telemetry |
| 🔴 High | `routes/risk.routes.ts` | `GET /api/v1/risk/:sessionId`, `GET /api/v1/risk/user/:userId` |
| 🔴 High | `handlers/telemetry.handler.ts` | Validate `TelemetryBatchSchema` from `@logicforge/types` |
| 🔴 High | `handlers/risk.handler.ts` | Query `RiskScore` from Prisma, compute if missing |
| 🟡 Med | `services/ingestion.service.ts` | Buffer telemetry events, batch-write to `RiskScore.rawEvents` |
| 🟡 Med | `services/risk-calculator.service.ts` | Weighted aggregation: focus loss × 0.3 + paste × 0.4 + time anomaly × 0.3 |
| 🟡 Med | `scoring/window-focus.scorer.ts` | Score based on `windowFocusLoss` count |
| 🟡 Med | `scoring/keystroke.scorer.ts` | Detect paste events + non-human inter-key intervals |
| 🟡 Med | `scoring/time-anomaly.scorer.ts` | Flag solutions faster than difficulty baseline |
| 🟢 Low | `storage/telemetry.store.ts` | Append-only write to `RiskScore` Prisma model |

#### 6.2 Frontend Telemetry Collectors (`apps/web/components/game/telemetry/`)

| Priority | File to Create | What It Does |
|----------|---------------|--------------|
| 🔴 High | `TelemetryProvider.tsx` | React context wrapping game session, manages collector lifecycle |
| 🔴 High | `collectors/focus.collector.ts` | `document.visibilitychange` + `window.blur/focus` listeners |
| 🔴 High | `collectors/keystroke.collector.ts` | Keydown/keyup timing arrays + `paste` event detection |
| 🟡 Med | `collectors/timing.collector.ts` | Time-to-first-input, time-to-submit per round |
| 🟡 Med | `transport.ts` | Batch + send via WS (primary) or REST (fallback) to anti-cheat service |

#### 6.3 Integration Points
- **Game API** must forward `sessionId` context to anti-cheat on session start/end
- **Frontend Arena** must wrap game components in `<TelemetryProvider>`
- **Recruiter Dashboard** (Phase 8) will read risk scores via `GET /risk/:sessionId`

#### 6.4 Critical Constraints
- Use `@logicforge/types/anti-cheat` schemas (already defined):
  - `TelemetryEventSchema`, `TelemetryBatchSchema`, `RiskScoreResponseSchema`
  - Default signal weights: `{ windowFocusLoss: 0.3, pasteDetection: 0.4, timeAnomaly: 0.3 }`
- Telemetry must NOT degrade game performance — batch and debounce (200ms minimum)
- Prisma model `RiskScore` already exists in schema with all required fields
- Anti-cheat runs on port **3003** (defined in `@logicforge/config`)

---

## 🔴 PHASE 7 — Story Mode (Campaign Chapters) (TODO)

**Goal**: Build 3 narrative-driven evaluation chapters with extended interaction models.

### Tasks To Implement

#### 7.1 Chapter Engine (`apps/game-api/src/services/story/`)

| Priority | File to Create | What It Does |
|----------|---------------|--------------|
| 🔴 High | `story.service.ts` | Chapter lifecycle: start, progress, complete. Uses `StoryProgress` Prisma model |
| 🔴 High | `chapters/archive.chapter.ts` | Ch1 "The Archive": Database normalization puzzles |
| 🔴 High | `chapters/shield-generator.chapter.ts` | Ch2 "Shield Generator": OOP refactoring |
| 🔴 High | `chapters/aether-stream.chapter.ts` | Ch3 "Aether Stream": Networking/packet processing |
| 🟡 Med | `evaluators/archive.evaluator.ts` | Validate 3NF decomposition + FK/PK selections |
| 🟡 Med | `evaluators/shield.evaluator.ts` | Validate interface extraction + dependency injection |
| 🟡 Med | `evaluators/aether.evaluator.ts` | Validate packet reordering + checksum logic |
| 🟡 Med | `scoring/story-scoring.service.ts` | Multi-step partial credit scoring |

#### 7.2 Frontend Components (`apps/web/components/game/story/`)

| Priority | File to Create | What It Does |
|----------|---------------|--------------|
| 🔴 High | `StoryLobby.tsx` | Chapter selection with narrative intro + unlock status |
| 🔴 High | `ChapterRenderer.tsx` | Extended canvas renderer for story content |
| 🟡 Med | `InteractiveSchema.tsx` | Ch1: Drag-and-drop schema builder |
| 🟡 Med | `CodeRefactorEditor.tsx` | Ch2: Side-by-side before/after code view |
| 🟡 Med | `PacketStreamVisualizer.tsx` | Ch3: Animated packet stream display |
| 🟡 Med | `NarrativeOverlay.tsx` | Story text with typewriter animation |
| 🟢 Low | `StoryResults.tsx` | Chapter completion feedback screen |

#### 7.3 Routes
- `apps/web/app/(game)/story/page.tsx` — Story mode lobby (chapter selection)
- `apps/web/app/(game)/story/[chapterId]/page.tsx` — Active chapter gameplay

#### 7.4 Critical Constraints
- Prisma model `StoryProgress` already exists with `userId`, `chapter`, `status`, `score`, `data`
- Enum `StoryChapter` has 3 values: `THE_ARCHIVE`, `THE_SHIELD_GENERATOR`, `THE_AETHER_STREAM`
- Types defined in `@logicforge/types/story` (chapter metadata, progress schemas)
- Story mode sessions use `mode: "STORY"` in `GameSession`

---

## 🔴 PHASE 8 — Recruiter Dashboard & Admin (TODO)

**Goal**: Build the recruiter-facing analytics dashboard, session review, export tools, and admin panel.

### Tasks To Implement

#### 8.1 Backend Routes (extend `apps/game-api/`)

| Priority | File to Create | What It Does |
|----------|---------------|--------------|
| 🔴 High | `routes/admin.routes.ts` | CRUD for challenges, user management |
| 🔴 High | `routes/analytics.routes.ts` | Aggregate stats: pass rates, avg times, flagged sessions |
| 🟡 Med | `services/analytics.service.ts` | Prisma aggregations across sessions, rounds, submissions |
| 🟡 Med | `services/export.service.ts` | Generate CSV/PDF reports for recruiter download |

#### 8.2 Frontend Pages (`apps/web/app/dashboard/`)

| Priority | File to Create | What It Does |
|----------|---------------|--------------|
| 🔴 High | `page.tsx` | Main recruiter dashboard with overview cards |
| 🔴 High | `candidates/page.tsx` | Candidate list with search, filter, risk flags |
| 🔴 High | `sessions/[id]/page.tsx` | Session deep-dive: per-round replay, anti-cheat flags |
| 🟡 Med | `analytics/page.tsx` | Charts: pass rate trends, difficulty distribution, cheating rates |
| 🟡 Med | `admin/challenges/page.tsx` | Challenge CRUD interface |
| 🟢 Low | `settings/page.tsx` | Platform configuration (thresholds, categories, etc.) |

#### 8.3 Critical Constraints
- Dashboard pages must be protected by NextAuth session check (recruiter role)
- Anti-cheat risk scores displayed alongside session reviews (depends on Phase 6)
- Export formats: CSV for data, PDF for reports

---

## Environment Setup

### Prerequisites
- Node.js 20+, pnpm 9+
- Docker Desktop (for Postgres, MongoDB, Redis, Code Runner)
- No Go compiler needed locally (Code Runner builds inside Docker)

### Quick Start
```bash
# 1. Start infrastructure
docker compose up -d

# 2. Install dependencies
pnpm install

# 3. Generate Prisma client + push schema
pnpm --filter @logicforge/db db:generate
pnpm --filter @logicforge/db db:push

# 4. Seed question data
pnpm --filter @logicforge/question-engine dev  # start QE first
curl -X POST http://localhost:3002/api/v1/challenges/seed

# 5. Start all services
pnpm dev
```

### Service Ports
| Service | Port | Command |
|---------|------|---------|
| Web (Next.js) | 3000 | `pnpm --filter @logicforge/web dev` |
| Game API | 3001 | `pnpm --filter @logicforge/game-api dev` |
| Question Engine | 3002 | `pnpm --filter @logicforge/question-engine dev` |
| Anti-Cheat | 3003 | `pnpm --filter @logicforge/anti-cheat dev` |
| Code Runner | 3004 | `docker compose up code-runner` |

### Key Environment Variables (`.env`)
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/logicforge
MONGO_URL=mongodb://admin:password@localhost:27017/logicforge?authSource=admin
REDIS_URL=redis://localhost:6379
NEXTAUTH_SECRET=your-secret
PORT_GAME_API=3001
PORT_QUESTION_ENGINE=3002
PORT_ANTI_CHEAT=3003
PORT_CODE_RUNNER=3004
```

---

## Dependency Graph for Remaining Phases

```
Phase 6 (Anti-Cheat) ← depends on Phase 3 (Game API) + Phase 5 (Frontend)
Phase 7 (Story Mode) ← depends on Phase 3 (Game API) + Phase 5 (Frontend)
Phase 8 (Dashboard)  ← depends on Phase 6 (Anti-Cheat) + Phase 7 (Story Mode)
```

> **Phases 6 and 7 can be built in parallel.** Phase 8 depends on both.
