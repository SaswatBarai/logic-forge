import type { MatchGameMode, MatchOutcome } from "@logicforge/db";

// ── Stat shapes per mode ──────────────────────────────────────────────────────

export interface ArcadeSingleStats {
  correctAnswers:  number;
  totalRounds:     number;
  timeTakenMs:     number;
  accuracy:        number; // 0–1
}

export interface ArcadeDualStats {
  myScore:          number;
  opponentScore:    number;
  opponentId:       string;
  correctAnswers:   number;
  totalRounds:      number;
  myGlobalLp:       number;
  opponentGlobalLp: number;
}

export interface StoryStats {
  chapterId:       string;
  chapterTitle:    string;
  challengesDone:  number;
  totalChallenges: number;
}

export type MatchStats = ArcadeSingleStats | ArcadeDualStats | StoryStats;

export interface ScoringResult {
  lpEarned:  number;
  outcome:   MatchOutcome;
  breakdown: Record<string, number>;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const LP_PER_CORRECT     = 5;
const LP_SPEED_BONUS     = 3;           // per correct answer if avg < 10s
const LP_SPEED_THRESHOLD = 10_000;      // ms
const LP_ACCURACY_BONUS  = 10;          // flat if accuracy >= 80%
const LP_ACCURACY_THRESH = 0.8;

const ELO_K             = 32;
const ELO_WIN_BASE      = 20;
const ELO_LOSS_BASE     = -10;
const ELO_MIN_LOSS      = -5;           // floor per match

const STORY_FULL_REWARD    = 500;
const STORY_PARTIAL_PER_CH = 15;

// ── Elo helper ────────────────────────────────────────────────────────────────

function eloExpected(myRating: number, oppRating: number): number {
  return 1 / (1 + Math.pow(10, (oppRating - myRating) / 400));
}

// ── Per-mode calculators ──────────────────────────────────────────────────────

function calcSingle(stats: ArcadeSingleStats): ScoringResult {
  const base      = stats.correctAnswers * LP_PER_CORRECT;
  const avgMs     = stats.timeTakenMs / Math.max(stats.totalRounds, 1);
  const speed     = avgMs < LP_SPEED_THRESHOLD ? LP_SPEED_BONUS * stats.correctAnswers : 0;
  const accuracy  = stats.accuracy >= LP_ACCURACY_THRESH ? LP_ACCURACY_BONUS : 0;
  const lpEarned  = base + speed + accuracy;

  return { lpEarned, outcome: "COMPLETED", breakdown: { base, speed, accuracy } };
}

function calcDual(stats: ArcadeDualStats): ScoringResult {
  const won    = stats.myScore > stats.opponentScore;
  const drawn  = stats.myScore === stats.opponentScore;
  const outcome: MatchOutcome = won ? "WIN" : drawn ? "DRAW" : "LOSS";

  const expected  = eloExpected(stats.myGlobalLp, stats.opponentGlobalLp);
  const actual    = won ? 1 : drawn ? 0.5 : 0;
  const eloShift  = Math.round(ELO_K * (actual - expected));
  const base      = won ? ELO_WIN_BASE : drawn ? 5 : ELO_LOSS_BASE;
  const raw       = base + eloShift;
  const lpEarned  = outcome === "LOSS" ? Math.max(ELO_MIN_LOSS, raw) : raw;

  return { lpEarned, outcome, breakdown: { base, eloShift, raw, clamped: lpEarned } };
}

function calcStory(stats: StoryStats): ScoringResult {
  const complete  = stats.challengesDone >= stats.totalChallenges;
  const lpEarned  = complete
    ? STORY_FULL_REWARD
    : stats.challengesDone * STORY_PARTIAL_PER_CH;

  return { lpEarned, outcome: "COMPLETED", breakdown: { lpEarned, complete: complete ? 1 : 0 } };
}

// ── Unified dispatcher ────────────────────────────────────────────────────────

export function calculateLP(mode: MatchGameMode, stats: MatchStats): ScoringResult {
  switch (mode) {
    case "ARCADE_SINGLE": return calcSingle(stats as ArcadeSingleStats);
    case "ARCADE_DUAL":   return calcDual(stats as ArcadeDualStats);
    case "STORY":         return calcStory(stats as StoryStats);
  }
}
