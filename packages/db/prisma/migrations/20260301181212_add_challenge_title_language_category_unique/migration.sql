-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('TIMER', 'LIVE');

-- CreateEnum
CREATE TYPE "PlayerFormat" AS ENUM ('SINGLE', 'DUAL');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('LOBBY', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "RoundStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'SKIPPED', 'TIMED_OUT');

-- CreateEnum
CREATE TYPE "SubmissionVerdict" AS ENUM ('CORRECT', 'INCORRECT', 'PARTIAL', 'TIMEOUT', 'RUNTIME_ERROR', 'COMPILE_ERROR');

-- CreateEnum
CREATE TYPE "ChallengeCategory" AS ENUM ('THE_MISSING_LINK', 'THE_BOTTLENECK_BREAKER', 'STATE_TRACING', 'SYNTAX_ERROR_DETECTION');

-- CreateEnum
CREATE TYPE "StoryChapter" AS ENUM ('THE_ARCHIVE', 'THE_SHIELD_GENERATOR', 'THE_AETHER_STREAM');

-- CreateEnum
CREATE TYPE "GameMode" AS ENUM ('ARCADE', 'STORY');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('JAVA', 'CPP', 'PYTHON');

-- CreateTable
CREATE TABLE "GameSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mode" "GameMode" NOT NULL,
    "sessionType" "SessionType",
    "playerFormat" "PlayerFormat" NOT NULL DEFAULT 'SINGLE',
    "category" "ChallengeCategory",
    "language" "Language",
    "status" "SessionStatus" NOT NULL DEFAULT 'LOBBY',
    "totalScore" INTEGER NOT NULL DEFAULT 0,
    "livesRemaining" INTEGER,
    "currentRound" INTEGER NOT NULL DEFAULT 1,
    "maxRounds" INTEGER NOT NULL DEFAULT 5,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "GameSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Round" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "challengeId" TEXT NOT NULL,
    "status" "RoundStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "timeLimitMs" INTEGER NOT NULL DEFAULT 60000,
    "score" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Round_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Challenge" (
    "id" TEXT NOT NULL,
    "category" "ChallengeCategory" NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "codeTemplate" TEXT NOT NULL,
    "solution" JSONB NOT NULL,
    "testCases" JSONB NOT NULL,
    "hints" JSONB,
    "language" "Language" NOT NULL,
    "semanticTokens" JSONB NOT NULL,
    "timeLimitMs" INTEGER NOT NULL DEFAULT 60000,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "verdict" "SubmissionVerdict" NOT NULL,
    "executionTimeMs" INTEGER,
    "memoryUsedKb" INTEGER,
    "compilerOutput" TEXT,
    "testResults" JSONB,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoryProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chapter" "StoryChapter" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "score" INTEGER NOT NULL DEFAULT 0,
    "data" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "StoryProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DualMatch" (
    "id" TEXT NOT NULL,
    "player1Id" TEXT NOT NULL,
    "player2Id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'WAITING',
    "winnerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DualMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskScore" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "windowFocusLoss" INTEGER NOT NULL DEFAULT 0,
    "keystrokeFlagsCount" INTEGER NOT NULL DEFAULT 0,
    "timeAnomalyCount" INTEGER NOT NULL DEFAULT 0,
    "aggregateScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "rawEvents" JSONB,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GameSession_userId_idx" ON "GameSession"("userId");

-- CreateIndex
CREATE INDEX "GameSession_status_idx" ON "GameSession"("status");

-- CreateIndex
CREATE INDEX "GameSession_mode_idx" ON "GameSession"("mode");

-- CreateIndex
CREATE INDEX "Round_challengeId_idx" ON "Round"("challengeId");

-- CreateIndex
CREATE UNIQUE INDEX "Round_sessionId_roundNumber_key" ON "Round"("sessionId", "roundNumber");

-- CreateIndex
CREATE INDEX "Challenge_category_difficulty_idx" ON "Challenge"("category", "difficulty");

-- CreateIndex
CREATE INDEX "Challenge_language_idx" ON "Challenge"("language");

-- CreateIndex
CREATE INDEX "Challenge_active_idx" ON "Challenge"("active");

-- CreateIndex
CREATE UNIQUE INDEX "Challenge_title_language_category_key" ON "Challenge"("title", "language", "category");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_roundId_key" ON "Submission"("roundId");

-- CreateIndex
CREATE INDEX "StoryProgress_userId_idx" ON "StoryProgress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StoryProgress_userId_chapter_key" ON "StoryProgress"("userId", "chapter");

-- CreateIndex
CREATE UNIQUE INDEX "DualMatch_player1Id_key" ON "DualMatch"("player1Id");

-- CreateIndex
CREATE UNIQUE INDEX "DualMatch_player2Id_key" ON "DualMatch"("player2Id");

-- CreateIndex
CREATE UNIQUE INDEX "RiskScore_sessionId_key" ON "RiskScore"("sessionId");

-- AddForeignKey
ALTER TABLE "Round" ADD CONSTRAINT "Round_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Round" ADD CONSTRAINT "Round_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DualMatch" ADD CONSTRAINT "DualMatch_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DualMatch" ADD CONSTRAINT "DualMatch_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "GameSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskScore" ADD CONSTRAINT "RiskScore_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
