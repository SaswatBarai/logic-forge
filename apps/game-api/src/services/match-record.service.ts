import { db } from "@logicforge/db";
import type { MatchGameMode } from "@logicforge/db";
import { calculateLP, type MatchStats } from "./scoring.service.js";

export interface CommitMatchInput {
  userId: string;
  mode: MatchGameMode;
  stats: MatchStats;
}

export interface CommitMatchResult {
  matchRecordId: string;
  lpEarned: number;
  newGlobalScore: number;
  outcome: string;
}

export async function commitMatchResult(
  input: CommitMatchInput
): Promise<CommitMatchResult> {
  const { userId, mode, stats } = input;
  const { lpEarned, outcome, breakdown } = calculateLP(mode, stats);

  // ── Bug fix: capture the upsert result inside the transaction so that
  // newGlobalScore is the value committed by THIS transaction, not a
  // value that could already be inflated by a concurrent match commit.
  const [matchRecord, updatedScore] = await db.$transaction([
    db.matchRecord.create({
      data: {
        userId,
        gameMode: mode,
        outcome,
        scoreEarned: lpEarned,
        stats: { ...stats, breakdown } as object,
      },
    }),
    db.userScore.upsert({
      where: { userId },
      update: { globalScore: { increment: lpEarned } },
      create: { userId, globalScore: lpEarned },
    }),
  ]);

  return {
    matchRecordId: matchRecord.id,
    lpEarned,
    newGlobalScore: updatedScore.globalScore,
    outcome,
  };
}
