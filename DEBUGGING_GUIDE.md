# Debugging Guide: Missing Question Issue

## Problem Statement
After answering a question, the next question is not appearing. The game stays on the same question instead of advancing to the next round.

## Root Cause Analysis

The issue occurs in the **round advancement flow**:

1. **Player submits answer** → `SUBMIT_ANSWER` event
2. **Server evaluates answer** → `ROUND_RESULT` event emitted
3. **All players submit** → Server calls `startRound()` for next round
4. **Client receives `ROUND_START`** → Should update UI with new question
5. **❌ BUG**: Client doesn't receive `ROUND_START` or receives it but doesn't process it correctly

## Logging Added for Debugging

### Backend Logs (apps/game-api/src/services/round.service.ts)

#### 1. prepareNextRound() - Line 376
```typescript
logger.info(
    { sessionId, roundNumber: state.currentRound, totalRounds: config.totalRounds, challengeId: challenge.id },
    "prepareNextRound: about to emit ROUND_START"
);
```
**What it shows**: Confirms the server is preparing the next round with the correct challenge.

#### 2. startRound() - Line 390
```typescript
logger.info(
    { sessionId, roundNumber, payloadRoundNumber: payload.roundNumber, challengeId: payload.challenge.id },
    "startRound: about to emit ROUND_START"
);
```
**What it shows**: Confirms the ROUND_START event is being emitted with correct data.

#### 3. handleSubmission() - Line 572
```typescript
logger.info(
    { sessionId, userId, roundNumber, challengeId, submittedCount: state.submittedUserIds.size },
    "handleSubmission: evaluating answer"
);
```
**What it shows**: Tracks when answers are being evaluated.

#### 4. handleSubmission() - Line 583
```typescript
logger.info(
    { sessionId, userId, roundNumber, allSubmitted, submittedCount: state.submittedUserIds.size, totalPlayers },
    "handleSubmission: checking if all submitted"
);
```
**What it shows**: Confirms whether all players have submitted (critical for advancing).

#### 5. handleSubmission() - Line 600
```typescript
logger.info(
    { sessionId, roundNumber, isTerminated: result.roundState.isTerminated },
    "handleSubmission: all submitted, checking termination"
);
```
**What it shows**: Confirms the session hasn't terminated and next round should start.

#### 6. handleSubmission() - Line 610
```typescript
logger.info(
    { sessionId, roundNumber, nextRound: result.roundState.currentRound },
    "handleSubmission: scheduling next round"
);
```
**What it shows**: Confirms the next round is being scheduled (3.5s delay).

#### 7. handleSubmission() - Line 616
```typescript
logger.info(
    { sessionId, nextRound: liveState.currentRound },
    "handleSubmission: calling startRound for next round"
);
```
**What it shows**: Confirms startRound is being called for the next round.

### Frontend Logs (apps/web/hooks/use-game-engine.ts)

#### 1. ROUND_START Handler - Line 128
```typescript
socket.off("ROUND_START").on("ROUND_START", (p: RoundStartPayload) => {
    console.info("[WS] ROUND_START received", { roundNumber: p.roundNumber, totalRounds: p.totalRounds, challengeId: p.challenge.id });
    applyRoundStart(p);
});
```
**What it shows**: Confirms the client received the ROUND_START event with the new challenge.

#### 2. ROUND_RESULT Handler - Line 126
```typescript
socket.off("ROUND_RESULT").on("ROUND_RESULT", (p: RoundResultPayload) => {
    console.info("[WS] ROUND_RESULT received", { userId: p.userId, verdict: p.verdict, roundNumber: p.roundState.currentRound });
    applyRoundResult(p);
});
```
**What it shows**: Confirms the client received the result and is processing it.

### Store Logs (apps/web/store/game-store.ts)

#### 1. applyRoundStart() - Line 209
```typescript
console.info("[Store] applyRoundStart", { roundNumber: payload.roundNumber, totalRounds: payload.totalRounds, challengeId: payload.challenge.id });
```
**What it shows**: Confirms the store is updating with the new round data.

#### 2. applyRoundResult() - Line 227
```typescript
console.info("[Store] applyRoundResult", { roundNum, userId: payload.userId, verdict: payload.verdict, payloadRoundState: payload.roundState.currentRound });
```
**What it shows**: Confirms the store is processing the result.

#### 3. applyRoundResult() - Duplicate Check - Line 232
```typescript
if (alreadyRecorded) {
    console.warn("[Store] applyRoundResult: already recorded", { roundNum, userId: payload.userId });
    return;
}
```
**What it shows**: Warns if a duplicate result is being ignored (could hide missing questions).

#### 4. applyRoundResult() - After Recording - Line 260
```typescript
console.info("[Store] applyRoundResult: recorded", { roundNum, userId: payload.userId, historyLength: s.roundHistory.length });
```
**What it shows**: Confirms the result was recorded and shows total history length.

## How to Debug

### Step 1: Open Browser DevTools
- Press `F12` or `Ctrl+Shift+I`
- Go to **Console** tab

### Step 2: Play a Game
- Start a game session
- Answer a question
- Watch the console logs

### Step 3: Check the Log Sequence

**Expected sequence:**
```
[WS] ROUND_RESULT received { userId: "...", verdict: "CORRECT", roundNumber: 1 }
[Store] applyRoundResult { roundNum: 1, userId: "...", verdict: "CORRECT", ... }
[Store] applyRoundResult: recorded { roundNum: 1, userId: "...", historyLength: 1 }
[WS] ROUND_START received { roundNumber: 2, totalRounds: 5, challengeId: "..." }
[Store] applyRoundStart { roundNumber: 2, totalRounds: 5, challengeId: "..." }
```

### Step 4: Identify the Break Point

- **If ROUND_START never appears**: Server isn't emitting it. Check backend logs.
- **If ROUND_START appears but applyRoundStart doesn't**: Socket event handler issue.
- **If applyRoundStart appears but UI doesn't update**: React component issue.

### Step 5: Check Backend Logs

If frontend logs show ROUND_START is missing:
1. Check server logs for `"startRound: about to emit ROUND_START"`
2. Check if `"handleSubmission: all submitted"` shows `allSubmitted: true`
3. Check if `"handleSubmission: scheduling next round"` appears

## Common Issues

### Issue 1: ROUND_START Never Emitted
**Cause**: `allSubmitted` is false (not all players submitted)
**Fix**: Check `handleSubmission: checking if all submitted` log

### Issue 2: ROUND_START Emitted But Not Received
**Cause**: Socket connection issue or event handler not registered
**Fix**: Check browser console for connection errors

### Issue 3: ROUND_START Received But UI Not Updated
**Cause**: React component not re-rendering
**Fix**: Check if `applyRoundStart` is being called and store is updating

## Testing Checklist

- [ ] Single player mode: Answer question → Next question appears
- [ ] Dual player mode: Both answer → Next question appears
- [ ] Last round (round 5): Answer → Results screen appears
- [ ] Check console logs for complete sequence
- [ ] Check backend logs for all emit points
- [ ] Verify challenge IDs are different for each round
- [ ] Verify round numbers increment correctly

## New Logging for Challenge Tracking

### Backend Challenge Fetch Logs (apps/game-api/src/services/round.service.ts)

#### 1. fetchChallenge() - Start - Line 200
```typescript
logger.info(
    { sessionId, round: state.currentRound, usedChallengeCount: state.usedChallengeIds.length, usedIds: state.usedChallengeIds },
    "fetchChallenge: starting fetch"
);
```
**What it shows**: Lists all previously used challenge IDs before fetching the next one.

#### 2. fetchChallenge() - URL - Line 213
```typescript
logger.info(
    { sessionId, round: state.currentRound, url: url.toString() },
    "fetchChallenge: request URL"
);
```
**What it shows**: The exact API request being sent (includes excludeIds parameter).

#### 3. fetchChallenge() - Success - Line 248
```typescript
logger.info(
    { sessionId, round: state.currentRound, category, language, challengeId: data.id, totalUsedCount: state.usedChallengeIds.length },
    "Challenge fetched"
);
```
**What it shows**: The new challenge ID and total count of used challenges.

### Backend Round Advancement Logs (apps/game-api/src/services/round.service.ts)

#### 1. recordResult() - Check - Line 266
```typescript
logger.info(
    { sessionId, currentRound: state.currentRound, totalRounds: config.totalRounds },
    "recordResult: checking if session should terminate"
);
```
**What it shows**: Current round vs total rounds before deciding to advance.

#### 2. recordResult() - Advance - Line 280
```typescript
logger.info(
    { sessionId, newRound: state.currentRound, totalRounds: config.totalRounds },
    "recordResult: advancing to next round"
);
```
**What it shows**: Confirms round was incremented.

### Frontend Challenge Display Logs (apps/web/store/game-store.ts)

#### 1. applyRoundStart() - Enhanced - Line 209
```typescript
console.info("[Store] applyRoundStart", {
    roundNumber: payload.roundNumber,
    totalRounds: payload.totalRounds,
    challengeId: payload.challenge.id,
    challengeTitle: payload.challenge.title,
    previousRound: s.currentRound,
    previousChallenge: s.challenge?.id
});
```
**What it shows**: Compares previous and new challenge IDs to detect if the same challenge is being shown.

## Debugging the "Same Question on Round 4" Issue

### Expected Behavior
- Round 1: Challenge A
- Round 2: Challenge B (different from A)
- Round 3: Challenge C (different from A and B)
- Round 4: Challenge D (different from A, B, and C)
- Round 5: Challenge E (different from A, B, C, and D)

### If Round 4 Shows Challenge C Again

**Check these logs in order:**

1. **Backend fetchChallenge() logs**:
   - Look for `"fetchChallenge: starting fetch"` for round 4
   - Check `usedIds` array - should have 3 challenge IDs
   - Check `"fetchChallenge: request URL"` - should have `excludeIds=A&excludeIds=B&excludeIds=C`

2. **Backend Challenge fetched log**:
   - Check if the returned `challengeId` is different from previous ones
   - If it's the same as round 3, the Question Engine is returning duplicates

3. **Frontend applyRoundStart() log**:
   - Check `challengeId` vs `previousChallenge`
   - If they're the same, the server sent the wrong challenge

### Common Causes

1. **Question Engine has limited challenges**: If there are only 3 unique challenges in a category, round 4 will get a duplicate
2. **excludeIds not being sent**: Check the URL in the logs
3. **Challenge ID not being tracked**: Check if `usedChallengeIds` array is growing

## Performance Notes

- 3.5 second delay between rounds is intentional (for result overlay display)
- LIVE mode has 15 second auto-advance timer if second player doesn't submit
- TIMER mode has per-round time limits (60s - 5s per round, min 20s)
