-- CreateEnum: MatchGameMode (if not exists)
DO $$ BEGIN
  CREATE TYPE "MatchGameMode" AS ENUM ('ARCADE_SINGLE', 'ARCADE_DUAL', 'STORY');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum: MatchOutcome (if not exists)
DO $$ BEGIN
  CREATE TYPE "MatchOutcome" AS ENUM ('WIN', 'LOSS', 'DRAW', 'COMPLETED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable: MatchRecord
CREATE TABLE IF NOT EXISTS "MatchRecord" (
    "id"          TEXT              NOT NULL,
    "userId"      TEXT              NOT NULL,
    "gameMode"    "MatchGameMode"   NOT NULL,
    "outcome"     "MatchOutcome"    NOT NULL,
    "scoreEarned" INTEGER           NOT NULL,
    "stats"       JSONB             NOT NULL,
    "createdAt"   TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchRecord_pkey" PRIMARY KEY ("id")
);

-- Indexes for MatchRecord
CREATE INDEX IF NOT EXISTS "MatchRecord_userId_idx"           ON "MatchRecord"("userId");
CREATE INDEX IF NOT EXISTS "MatchRecord_createdAt_idx"        ON "MatchRecord"("createdAt");
CREATE INDEX IF NOT EXISTS "MatchRecord_userId_createdAt_idx" ON "MatchRecord"("userId", "createdAt");

-- CreateTable: UserScore
CREATE TABLE IF NOT EXISTS "UserScore" (
    "id"          TEXT      NOT NULL,
    "userId"      TEXT      NOT NULL,
    "globalScore" INTEGER   NOT NULL DEFAULT 0,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserScore_pkey" PRIMARY KEY ("id")
);

-- Indexes for UserScore
CREATE UNIQUE INDEX IF NOT EXISTS "UserScore_userId_key"       ON "UserScore"("userId");
CREATE        INDEX IF NOT EXISTS "UserScore_globalScore_idx"  ON "UserScore"("globalScore");

-- CreateTable: TelemetryEvent
CREATE TABLE IF NOT EXISTS "TelemetryEvent" (
    "id"          TEXT         NOT NULL,
    "sessionId"   TEXT         NOT NULL,
    "candidateId" TEXT         NOT NULL,
    "eventType"   TEXT         NOT NULL,
    "timestamp"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload"     JSONB,

    CONSTRAINT "TelemetryEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "TelemetryEvent_sessionId_idx"   ON "TelemetryEvent"("sessionId");
CREATE INDEX IF NOT EXISTS "TelemetryEvent_candidateId_idx" ON "TelemetryEvent"("candidateId");
CREATE INDEX IF NOT EXISTS "TelemetryEvent_timestamp_idx"   ON "TelemetryEvent"("timestamp");

-- CreateTable: SessionFlag
CREATE TABLE IF NOT EXISTS "SessionFlag" (
    "id"          TEXT         NOT NULL,
    "sessionId"   TEXT         NOT NULL,
    "candidateId" TEXT         NOT NULL,
    "riskScore"   INTEGER      NOT NULL,
    "flagLevel"   TEXT         NOT NULL,
    "timestamp"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "events"      JSONB,

    CONSTRAINT "SessionFlag_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SessionFlag_sessionId_idx"   ON "SessionFlag"("sessionId");
CREATE INDEX IF NOT EXISTS "SessionFlag_candidateId_idx" ON "SessionFlag"("candidateId");

-- CreateTable: SessionRiskState
CREATE TABLE IF NOT EXISTS "SessionRiskState" (
    "id"          TEXT         NOT NULL,
    "sessionId"   TEXT         NOT NULL,
    "candidateId" TEXT         NOT NULL,
    "riskScore"   INTEGER      NOT NULL DEFAULT 0,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionRiskState_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SessionRiskState_sessionId_key"   ON "SessionRiskState"("sessionId");
CREATE        INDEX IF NOT EXISTS "SessionRiskState_candidateId_idx" ON "SessionRiskState"("candidateId");
