# Logic Forge — Story Mode Documentation

**Single markdown reference for the Story Mode ("Ironclad Chronicles"): narrative, point system, gameplay flow, and architecture.**

---

## 1. Overview

Story Mode is an interactive, choice-driven educational experience inside Logic Forge. The player becomes **Sir Axiom**, a knight of the Kingdom of Bitfeld, and fights three ancient threats by making **Computer Science decisions** that have real consequences in the story. There are no explicit "correct/incorrect" labels; the world reacts to choices through narrative fallout (consequences, scars, debts).

- **Product name:** IRONCLAD CHRONICLES  
- **Entry route:** `/story` (Story Mode)  
- **Tech:** Next.js (App Router), Zustand, static story data + optional AI (Gemini) via `/api/story/chat`

---

## 2. Narrative Universe

### 2.1 Setting

- **Player:** Sir Axiom, knight of the Kingdom of Bitfeld.  
- **Stakes:** The kingdom is under siege from three forces. Each force is tied to a **zone** and a **CS domain**.

| Zone | Realm | Guardian | Enemy | CS Domain |
|------|--------|----------|--------|-----------|
| **The Archive Citadel** | Database | Elder Query (blind scholar) | Nullus the Dread Wyrm | Databases (SQL, JOINs, indexing, normalization) |
| **The Forge Village** | Operating Systems | Ferron the Iron Golem | Deadlock | OS (scheduling, deadlock, memory, paging) |
| **The Wall of Gates** | Computer Networks | Gate Commander | Overflow (Shadow Mob) | Networks (routing, verification, flood control) |

### 2.2 Core Philosophy

- Every choice is an **in-world action** (no raw CS jargon in options).  
- Consequences are **dramatic and narrative** first; CS reasoning is revealed in-world (e.g. via Elder Query or the engineer).  
- **Scars** and **Debts** carry across acts and affect later encounters (including Boss Gates).

---

## 3. Stories (Zones) — Full Detail

Stories are implemented as **zones** with multiple **acts**. Each act has a scene, a question, and 4–5 **choices** with hidden **tiers** that drive XP, scars, and debts.

### 3.1 Zone 1 — The Archive Citadel (Databases)

- **Id:** `ARCHIVE_CITADEL`  
- **Hook:** Nullus cannot be killed by normal blades. The only weapon is hidden in the Great Archive (10 million tomes). Elder Query can only answer precise queries (relational DB). The player must learn to “speak his language.”  
- **World map (conceptual):** Wings as tables — e.g. WING_WEAPONS, WING_AUTHORS, WING_FORBIDDEN, WING_INDEX, WING_COPIES, WING_VISITORS.

**Acts (from `story-data.ts`):**

| Act | Title | Focus | Boss |
|-----|--------|--------|------|
| 1 | The Index of Shadows | Searching authors (filtering, LIKE, ORDER BY) | — |
| 2 | The JOIN of Fates | Combining two wings (INNER vs LEFT vs RIGHT vs CROSS JOIN) | — |
| 3 | The Cursed Duplicates | Finding the true tome (GROUP BY, HAVING COUNT) | — |
| 4 | Boss Gate: The Living Index | Targeting Nullus’s primary key | Yes |

**Example — Act 1 choices (simplified):**

- **Tier 1 (optimal):** “Ask Elder Query to list all authors whose names contain 'Mord', sorted by era.” → +100 XP, clean success.  
- **Tier 2:** “Pull weapons after Third War and authors with 'Mord', match manually.” → +60 XP, debt (e.g. “Manual Exhaustion” at Boss Gate).  
- **Tier 3:** “Find authors named exactly 'Mord'.” → +25 XP, scar (e.g. “The Missed Shadow”).  
- **Tier 4:** “Search every wing one by one.” → +0 XP, scar (e.g. “The Fallen Tower”), major narrative cost.

---

### 3.2 Zone 2 — The Forge Village (Operating Systems)

- **Id:** `FORGE_VILLAGE`  
- **Hook:** Ferron the Iron Golem is dying from **mismanaged energy** (CPU/memory metaphor). Sir Axiom is Forge Warden. Too little energy → Ferron freezes; too much → overload; wrong distribution → partial failure.  
- **Special mechanic:** **Energy meter** (0–100%). Starts at 72%. Choices move it; Boss Gate and endings depend on final energy.

**Acts:**

| Act | Title | Focus | Boss |
|-----|--------|--------|------|
| 1 | The Scheduling Crisis | Task order (SJF, FCFS, Round Robin, parallelism) | — |
| 2 | The Deadlock of the Twin Hearths | Breaking deadlock (hold-and-wait, preemption, ordering) | — |
| 3 | The Memory of Iron | Allocation (Best Fit, First Fit, compaction) | — |
| 4 | Boss Gate: The Deadlock Strikes | Ordered execution to prevent circular wait | Yes |

**Example — Act 1 (scheduling):**

- **Tier 1:** Shortest tasks first (SJF) → energy returns quickly, Ferron stabilizes, +100 XP.  
- **Tier 2:** Round Robin (e.g. 2 min per task) → partial progress, debt (e.g. “Context Debt”).  
- **Tier 3:** FCFS → long task blocks quick returns, Ferron weakens, +25 XP.  
- **Tier 4:** Run all tasks simultaneously → overload, scar (e.g. “The Overburn”), +0 XP.

---

### 3.3 Zone 3 — The Wall of Gates (Computer Networks)

- **Id:** `WALL_OF_GATES`  
- **Hook:** Overflow (Shadow Mob) fights with deception: fake messengers, cut roads, flood attacks. Sir Axiom is Network Warden — secure roads, verify messengers, defend gates.  
- **Concepts:** Shortest path (Dijkstra), challenge-response auth, rate limiting / firewalling.

**Acts:**

| Act | Title | Focus | Boss |
|-----|--------|--------|------|
| 1 | The Road Map of Chaos | Routing the king (shortest path vs greedy visual) | — |
| 2 | The Imposter Messenger | Verifying messenger (challenge-response vs trust seal) | — |
| 3 | Boss Gate: The Flood | Handling flood (source blocking / rate limiting vs scaling up) | Yes |

**Example — Act 1 (routing):**

- **Tier 1:** Shortest total travel time, expand shortest path first (Dijkstra) → king safe, +100 XP.  
- **Tier 2:** Split escort on two roads → redundancy without logic, debt (e.g. “Divided Guard”).  
- **Tier 4:** “Most direct” road by look → ambush, scar (e.g. “The Captured Crown”), +0 XP.

---

## 4. How the Story Flows

### 4.1 High-Level Flow

```
Zone selection (Archive / Forge / Wall)
    → Start zone (act = 1, XP = 0, scars = [], debts = [])
    → Act 1 scene + question + choices
    → Player picks one choice
    → Consequence (narrative + XP/scar/debt)
    → If more acts: show next act scene + choices; repeat
    → Boss Gate (final act): all debts can trigger; outcome depends on state
    → Zone complete → return to zone selection (or exit)
```

### 4.2 Per-Act Flow

1. **Scene:** Narrative text (and in Forge, energy meter context).  
2. **Question:** “How do you…?” in-world.  
3. **Choices:** 4–5 options, formatted as `▶ A) …`, `▶ B) …`, etc.  
4. **Player choice:** Clicks one option.  
5. **Consequence:**  
   - Narrative consequence (2–3 sentences).  
   - XP applied.  
   - Scar added if tier 3/4 with scar.  
   - Debt added if tier 2 (or 4) with debt; `triggersAt` (e.g. “Boss Gate”, “Act 3”) is stored.  
6. **Next:** Either next act (scene + choices) or “Zone complete.”

### 4.3 Boss Gates

- Final act of each zone.  
- All **debts** planted in earlier acts can “trigger” (narrative and/or difficulty impact).  
- **Scars** affect the encounter (e.g. Ferron’s state in Forge).  
- Ending tier (e.g. Legend / Champion / Knight / Squire) depends on scars, debts, and (in Forge) energy level.

---

## 5. Point System

### 5.1 Choice Tiers (Hidden)

| Tier | Name | XP | Typical outcome |
|------|------|----|------------------|
| 1 | Optimal | +100 | Best outcome, no scar/debt (or bonus only) |
| 2 | Viable but flawed | +60 | Success with cost; **debt** planted |
| 3 | Minor error | +25 | Setback; often **scar** |
| 4 | Critical error | +0 | Major failure; **scar** (and sometimes debt) |

- Tiers are **not** shown to the player. All options are written to sound plausible.  
- Exact XP and presence of scar/debt are defined per choice in `story-data.ts` (e.g. `tier`, `xp`, `scar`, `debt`).

### 5.2 XP and Ranks

- **XP** is cumulative within a zone (reset when starting a new zone).  
- **Rank** is derived from total XP in that zone:

| Rank | Min XP |
|------|--------|
| Squire | 0 |
| Knight | 200 |
| Champion | 500 |
| Grand Marshal | 900 |
| Legend | 1400 |

- Implemented in `story-store.ts` via `RANK_THRESHOLDS` and `computeRank(xp)`.

### 5.3 Scars

- **What:** Permanent narrative marks from bad choices (usually Tier 3 or 4).  
- **Effect:** Stored in `scars[]`; referenced in later narrative and can affect Boss Gate difficulty.  
- **Fields:** `name`, `description`, `zone`, `act`.  
- **Optional (from Stroymode.md):** Redemption challenges can “heal” scars.

### 5.4 Debts

- **What:** Delayed consequences from suboptimal but viable choices (usually Tier 2).  
- **Effect:** Stored in `debts[]`; “trigger” at a later beat (e.g. “Boss Gate”, “Act 3”) for narrative and/or difficulty.  
- **Fields:** `name`, `description`, `triggersAt`, `zone`, `act`.  
- When a debt triggers, it can be resolved (e.g. removed from list) and the narrative reflects it.

### 5.5 Energy Meter (Forge Village Only)

- **Range:** 0–100%.  
- **Initial:** 72% when starting `FORGE_VILLAGE`.  
- **Updated by:** Choices (e.g. good scheduling raises it, overload drops it).  
- **Meaning:**  
  - Below ~20%: Critical; Boss harder.  
  - 40–90%: Healthy.  
  - Very high spike: Overload risk.  
- **Ending:** Final energy at Boss completion influences ending tier (e.g. Legend / Champion / Knight / Squire in Stroymode.md).

---

## 6. How the Player Plays

### 6.1 Entry and Zone Selection

1. User goes to **Story Mode** (e.g. `/story`).  
2. **Zone selector** shows three zones:  
   - The Archive Citadel (Databases)  
   - The Forge Village (Operating Systems)  
   - The Wall of Gates (Computer Networks)  
3. Player picks one zone → `startZone(zone)` in the store; `act = 1`, `xp = 0`, `scars = []`, `debts = []`; Forge gets `energyMeter = 72`.

### 6.2 During a Zone

1. **HUD** (StoryHud): Zone name, Act number, XP, Rank, Scars count, Debts count; in Forge, energy meter bar.  
2. **Narrator** (StoryNarrator):  
   - Scrollable message list (system/user/assistant).  
   - On zone start, first act is formatted and “streamed” (simulated typing): scene + question + choices (`▶ A) …` etc.).  
3. **Choices:** Parsed from the last assistant message (`parseChoices`). Buttons appear when not streaming.  
4. **On click:**  
   - User message added: “I choose: A) …”.  
   - Choice is looked up in `storyData[zone].acts[act - 1].choices`.  
   - XP, scar, debt applied in store.  
   - Consequence text (and optional next act) is streamed.  
   - If there is a next act, `setAct(nextAct.actNumber)` and next scene + choices show.  
   - If no next act, “Zone complete” and prompt to return to zone selection.  
5. **Exit:** “Exit Story” calls `reset()` and returns to zone selection.

### 6.3 Data Source (Current Implementation)

- **Primary:** Static data in `apps/web/lib/story-data.ts`: `storyData` keyed by zone id, each zone has `acts[]`, each act has `sceneText`, `question`, `choices[]` with `id`, `text`, `tier`, `xp`, `consequence`, `scar`, `debt`.  
- **Optional AI:** `POST /api/story/chat` (Gemini) can drive narrative and choices; current StoryNarrator flow uses **static** acts/choices and does not require the chat API for the implemented zones.

---

## 7. Architecture

### 7.1 Folder / File Structure

```
apps/web/
  app/
    (game)/story/
      page.tsx              # Story mode page: zone select vs active story
    api/story/
      chat/
        route.ts            # Optional Gemini chat for story (SSE)
  components/story/
    zone-selector.tsx       # Zone selection UI
    story-narrator.tsx      # Chat-like narrator + choices from static data
    story-hud.tsx           # XP, rank, scars, debts, energy meter
  lib/
    story-data.ts           # Static zones, acts, choices (tiers, XP, scars, debts)
  store/
    story-store.ts          # Zustand store: zone, act, xp, rank, scars, debts, energy, messages, streaming, choices

packages/types/
  src/story.ts              # Chapter enums + CHAPTER_METADATA (lobby/chapter descriptions; can map to zones)
```

### 7.2 State (Zustand — story-store.ts)

| Field | Type | Purpose |
|-------|------|--------|
| `zone` | `StoryZone \| null` | Current zone id or null (zone select) |
| `act` | number | Current act (1-based) |
| `isActive` | boolean | True after a zone is started |
| `xp` | number | Cumulative XP in this zone |
| `rank` | StoryRank | Squire / Knight / Champion / Grand Marshal / Legend |
| `scars` | Scar[] | Permanent scars this run |
| `debts` | Debt[] | Pending debts (trigger later) |
| `energyMeter` | number \| null | Forge only; 0–100 |
| `messages` | StoryMessage[] | Chat history (user/assistant) |
| `isStreaming` | boolean | Narrator is “typing” |
| `streamingText` | string | Current chunk being streamed |
| `choices` | string[] \| null | Parsed choice strings from last assistant message |
| `waitingForChoice` | boolean | Reserved for future use |

Actions include: `startZone`, `setAct`, `updateXP`, `addScar`, `addDebt`, `resolveDebt`, `setEnergyMeter`, message/streaming helpers, `reset`.

### 7.3 Data Flow

```
Zone Select
  → startZone(zone) → act=1, xp=0, scars=[], debts=[], energyMeter (Forge only)

Story start (useEffect in StoryNarrator)
  → storyData[zone].acts[0] → formatActText(act) → simulateStream(initialText)
  → Messages get last assistant block with ▶ A) … lines
  → parseChoices(latestAssistant.content) → show choice buttons

Player picks choice
  → handleChoice(choiceString)
  → addUserMessage("I choose: …")
  → Look up choice in storyData[zone].acts[act-1].choices
  → updateXP(xp), addScar(scar), addDebt(debt) if present
  → formatConsequenceText(choice) (+ next act if any) → simulateStream(responseText)
  → If next act: setAct(nextAct.actNumber); else zone complete
```

### 7.4 API — POST /api/story/chat

- **Role:** Optional: drive narrative with Gemini (e.g. custom intros or branches).  
- **Input:** `messages`, `zone`, `playerState` (xp, rank, scars, debts, act, energyMeter).  
- **Behavior:** Uses `SYSTEM_PROMPT` (condensed from Stroymode.md) and `ZONE_INTROS[zone]` for first message; sends to Gemini; returns SSE with `text`.  
- **Note:** Current zone flows use **static** `story-data.ts`; the narrator does not have to call this API for the three implemented zones.

### 7.5 Types (packages/types)

- `StoryChapter` (e.g. THE_ARCHIVE, THE_SHIELD_GENERATOR, THE_AETHER_STREAM) and `CHAPTER_METADATA` describe chapters for lobby/UI (estimated time, skills).  
- App story zones use string ids `ARCHIVE_CITADEL`, `FORGE_VILLAGE`, `WALL_OF_GATES` in `story-store` and `story-data`.

---

## 8. Summary Table

| Topic | Detail |
|-------|--------|
| **Stories** | 3 zones: Archive Citadel (DB), Forge Village (OS), Wall of Gates (Networks). Each has 3–4 acts + Boss Gate. |
| **Flow** | Zone select → Act 1 → choices → consequences → next act → … → Boss Gate → Zone complete → select again or exit. |
| **Points** | XP per choice (0 / 25 / 60 / 100 by tier). Ranks: Squire → Knight → Champion → Grand Marshal → Legend. |
| **Scars** | Permanent marks from bad choices; affect narrative and Boss. |
| **Debts** | Delayed consequences; trigger at later act or Boss Gate. |
| **Play** | Choose zone → read scene → pick ▶ A)–E) → see consequence and next scene until zone complete. |
| **Architecture** | Zustand store + static `story-data.ts` + Story page, ZoneSelector, StoryNarrator, StoryHud; optional Gemini `/api/story/chat`. |

This document is the single reference for how each story is structured, how the story flows, how the point system works, how the player plays, and how the feature is implemented in the codebase.
