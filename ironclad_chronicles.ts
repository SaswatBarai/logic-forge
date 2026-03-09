// ═══════════════════════════════════════════════════════════════════════════════
// IRONCLAD CHRONICLES — COMPLETE GAME SCRIPT (TypeScript)
// Based strictly on the Ironclad Chronicles Game Master Document
// Kingdom of Bitfeld | Sir Axiom | Three Zones, Three Wars, One Knight
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// TYPES & ENUMS
// ─────────────────────────────────────────────────────────────────────────────

export type Zone = "ARCHIVE_CITADEL" | "FORGE_VILLAGE" | "WALL_OF_GATES";

export type CharacterID =
  | "NARRATOR"       // The Game Master — omniscient, dramatic, poetic
  | "SIR_AXIOM"      // Player character — the knight of Bitfeld
  | "ELDER_QUERY"    // Blind archive scholar — Zone 1 guide
  | "NULLUS"         // Dread Wyrm — Zone 1 boss (defeated through Databases)
  | "FERRON"         // The Iron Golem — Zone 2 protagonist/protector
  | "FORGE_MASTER"   // Stout veteran woman who manages Ferron's hearths
  | "ENGINEER"       // Young wiry technical advisor, Zone 2
  | "FERRO"          // Left hearth spirit inside Ferron
  | "ANVILA"         // Right hearth spirit inside Ferron
  | "DEADLOCK"       // The Iron Golem in boss state — Zone 2 boss name
  | "OVERFLOW"       // The Shadow Mob — Zone 3 boss (defeated through Networks)
  | "MIRA_ZONE3"     // Rebel spy character, referenced in Zone 3 (imposter)
  | "VAEL"           // Inner gate agent — Zone 3 spy
  | "KING";          // The King of Bitfeld — Zone 3 convoy principal

export type ChoiceTier = "TIER_1_OPTIMAL" | "TIER_2_VIABLE" | "TIER_3_MINOR_ERROR" | "TIER_4_CRITICAL_ERROR";

export type XPReward = 0 | 10 | 25 | 50 | 100 | 150;

export type EndingTier =
  | "LEGEND"       // 0 Scars, 0-1 Debts
  | "CHAMPION"     // 0 Scars, 2-3 Debts
  | "KNIGHT"       // 1 Scar, any Debts
  | "SQUIRE"       // 2+ Scars
  | "SECRET";      // All Redemptions completed → The Architect of Bitfeld

export interface Scar {
  id: string;
  name: string;
  effect: string;
  redemptionChallenge: string;
}

export interface Debt {
  id: string;
  description: string;
  surfacesAt: string; // scene ID where debt triggers
  consequence: string;
}

export interface Choice {
  label: "A" | "B" | "C" | "D" | "E";
  inWorldText: string;          // Never raw CS terms — always in-world phrasing
  tier: ChoiceTier;
  csConceptExplained: string;   // Hidden from player — for GM reference
  narrativeConsequence: string; // 2–3 dramatic sentences played out FIRST
  npcReveal: string;            // How NPC/world explains the CS reasoning in-world
  xp: XPReward;
  leadsTo?: string;             // Next scene ID
  scarEarned?: Scar;
  debtPlanted?: Debt;
  bonusUnlocked?: string;
}

export interface DialogueLine {
  character: CharacterID;
  line: string;
}

export interface Scene {
  id: string;
  zone: Zone;
  act: number;
  title: string;
  energyMeter?: string;          // Zone 2 only — Ferron's energy display
  narratorOpen: string;
  dialogue: DialogueLine[];
  momentOfTruth: string;         // The exact decision at stake, in-world language
  pressureElement: string;       // Countdown / visual urgency line
  choices: Choice[];
  postChoiceHook: string;        // Cliffhanger that ends the scene
}

// ─────────────────────────────────────────────────────────────────────────────
// CHARACTER VOICE PROFILES
// ─────────────────────────────────────────────────────────────────────────────

export const CHARACTER_VOICES: Record<CharacterID, { name: string; voiceStyle: string; exampleLine: string }> = {
  NARRATOR: {
    name: "The Narrator / Game Master",
    voiceStyle: "Omniscient. Dramatic. Poetic prose — D&D dungeon master energy. Sets every scene, reacts to every choice with visceral consequence description. Gen Z hype energy crossed with epic fantasy gravity.",
    exampleLine: "The silence that followed was not peace — it was the held breath of a world about to break.",
  },
  SIR_AXIOM: {
    name: "Sir Axiom",
    voiceStyle: "The player knight of Bitfeld. Stoic, capable, responds to direction. Speaks through action. The player IS Sir Axiom — second-person narration. Never speaks dialogue; acts on the player's choices.",
    exampleLine: "[Player acts. The knight moves. The world responds.]",
  },
  ELDER_QUERY: {
    name: "Elder Query",
    voiceStyle: "Ancient blind scholar. Speaks with weary precision. Every word measured. Loves the archive deeply — gets quietly emotional when it is disrespected or used poorly. Reveals CS reasoning through in-world metaphor.",
    exampleLine: "The index serves those who ask precisely. You searched too narrow. The shadow hides in parts of names, not whole names.",
  },
  NULLUS: {
    name: "Nullus the Dread Wyrm",
    voiceStyle: "Ancient. Contemptuous. Speaks rarely — mostly through the environment. When it speaks, it is slow and final, like a sentence that was decided long ago.",
    exampleLine: "You wander while I grow. Every wasted hour is a gate tower I take.",
  },
  FERRON: {
    name: "Ferron the Iron Golem",
    voiceStyle: "Ancient, deep, few words. He communicates mostly through physical state — glowing, moving, trembling, going dark. When he does speak, it is with the blunt gravity of someone who has protected this village for centuries.",
    exampleLine: "I cannot coordinate. Give me order. Without order, I am only weight.",
  },
  FORGE_MASTER: {
    name: "The Forge Master",
    voiceStyle: "Gruff, direct, deeply loyal to Ferron. Military competence without military rank. Speaks in urgent practical terms. Will grab you by the arm if you're wrong. No patience for theory — only results.",
    exampleLine: "He needs a full drink, not drips. These interruptions cost him more than they give.",
  },
  ENGINEER: {
    name: "The Engineer",
    voiceStyle: "Young, wiry, fast-talking genius. Nervous energy. Carries blueprints everywhere. Explains technical fallout in awed whispers. Occasionally says something brilliant without realizing it.",
    exampleLine: "You didn't just fix today's deadlock. You prevented every future one.",
  },
  FERRO: {
    name: "Ferro (Left Hearth Spirit)",
    voiceStyle: "Terse, stubborn, made of controlled blue fire. Speaks in short declarations. Refuses to yield — it's not stubbornness, it's his nature. Cannot change without a rule change.",
    exampleLine: "I hold the Hammer Circuit. I wait for Anvila. That is what I do.",
  },
  ANVILA: {
    name: "Anvila (Right Hearth Spirit)",
    voiceStyle: "More fluid than Ferro, but equally locked. Speaks with a kind of sad awareness that the situation is wrong but she cannot break it alone.",
    exampleLine: "I hold the Anvil Channel. I wait for Ferro. We will wait forever at this rate.",
  },
  DEADLOCK: {
    name: "Deadlock the Iron Golem (Boss State)",
    voiceStyle: "Ferron broken. Erratic, dangerous, no longer protective. Does not speak — thrashes. His 'voice' is pure environmental chaos.",
    exampleLine: "[FERRON THRASHES. He does not speak. He cannot. The Golem that protected has become the threat.]",
  },
  OVERFLOW: {
    name: "Overflow the Shadow Mob",
    voiceStyle: "Not one voice — thousands. Whispers layered over each other. Speaks in fragmented phrases. Never in full sentences. Always implying, never stating. The voice of a flood.",
    exampleLine: "Let us in... we are already in... the gate is... the gate was always...",
  },
  MIRA_ZONE3: {
    name: "The Imposter Messenger",
    voiceStyle: "Perfectly rehearsed. Too smooth. Speaks with the practiced warmth of someone who has studied how trustworthy people sound. Cracks only when directly cornered.",
    exampleLine: "Of course the seal is real. I rode three days from the Northern Fort. Check the wax if you must.",
  },
  VAEL: {
    name: "Vael (Inner Gate Agent)",
    voiceStyle: "Soldier's discipline masking guilt. Speaks in clipped military syntax. When exposed, drops the mask entirely — becomes exhausted and almost relieved.",
    exampleLine: "The eastern gate. Three hours before dawn. That was the plan.",
  },
  KING: {
    name: "The King of Bitfeld",
    voiceStyle: "Dignified but road-worn. Commands with gravity but carries visible stress. Speaks in full sentences, considers before responding. The voice of someone who used to be confident.",
    exampleLine: "You are asking me to trust a road I cannot see. Tell me why I should.",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// SCARS REGISTRY
// ─────────────────────────────────────────────────────────────────────────────

export const SCARS: Record<string, Scar> = {
  // Zone 1 Scars
  FULL_SCAN_SCAR: {
    id: "FULL_SCAN_SCAR",
    name: "The Wandering Eye",
    effect: "Nullus attacks the outer wall while you are lost in the archive. One gate tower falls. Boss gate gains an additional challenge round.",
    redemptionChallenge: "At the Boss Gate, correctly execute a filtered search with JOIN to redeem this scar.",
  },
  NARROW_SEARCH_SCAR: {
    id: "NARROW_SEARCH_SCAR",
    name: "The Empty Hand",
    effect: "Zero results returned. You report back empty-handed. 30 minutes lost. Nullus inches closer.",
    redemptionChallenge: "Correctly apply wildcard logic in a Boss Gate search to redeem.",
  },
  CROSS_JOIN_SCAR: {
    id: "CROSS_JOIN_SCAR",
    name: "The Flooded Archive",
    effect: "Thousands of meaningless pairings flood the archive floor. Three shelves collapse. A guard is injured. Nullus grows visibly stronger.",
    redemptionChallenge: "Use a precise INNER JOIN at the Boss Gate with zero wasted pairings to redeem.",
  },
  WRONG_TOME_SCAR: {
    id: "WRONG_TOME_SCAR",
    name: "The Burned Gauntlet",
    effect: "You read the wrong incantation. Nullus partially heals. Your sword hand is weakened for the boss fight — one attack reduced.",
    redemptionChallenge: "Use GROUP BY + HAVING COUNT perfectly in the Boss Gate to redeem.",
  },
  // Zone 2 Scars
  COLD_EMBER: {
    id: "COLD_EMBER",
    name: "The Cold Ember",
    effect: "Ferron's left arm is permanently sluggish. All Act 3 memory tasks have reduced tolerance. Boss requires higher energy floor.",
    redemptionChallenge: "In the Boss Gate Round 1, correctly sequence tasks shortest-first to redeem.",
  },
  OVERBURN: {
    id: "OVERBURN",
    name: "The Overburn",
    effect: "Ferron's energy ceiling is permanently reduced. Acts 3 and 4 start in elevated fragility.",
    redemptionChallenge: "In the Boss Gate, keep Ferron's energy between 40–90% through all three rounds to redeem.",
  },
  LONG_WAIT: {
    id: "LONG_WAIT",
    name: "The Long Wait",
    effect: "Ferron's recovery from any future stall takes twice as long. Boss gate spawns an additional deadlock challenge.",
    redemptionChallenge: "Solve the Boss Gate deadlock using resource ordering to redeem.",
  },
  SHATTERED_CORE: {
    id: "SHATTERED_CORE",
    name: "The Shattered Core",
    effect: "Ferron's capacity is permanently reduced by 20 units. Acts 4 and boss gate begin with compounding fragmentation.",
    redemptionChallenge: "In the Boss Gate, run Best Fit allocation with zero stalled processes to redeem.",
  },
  IMPOSSIBLE_ASK: {
    id: "IMPOSSIBLE_ASK",
    name: "The Impossible Ask",
    effect: "Ferron begins the boss gate with 2 active memory slots instead of 3. One was damaged in the crash.",
    redemptionChallenge: "In the Boss Gate, achieve minimum page faults using LRU to redeem.",
  },
  // Zone 3 Scars
  CAPTURED_CROWN: {
    id: "CAPTURED_CROWN",
    name: "The Captured Crown",
    effect: "The king is briefly captured. The final boss has reinforcements — Overflow gains one additional attack wave.",
    redemptionChallenge: "In the Boss Gate, correctly route using shortest-path logic to redeem.",
  },
  BROKEN_SEAL: {
    id: "BROKEN_SEAL",
    name: "The Broken Seal",
    effect: "The eastern gate is left undefended. All future authentication challenges become harder.",
    redemptionChallenge: "Correctly implement both challenge-response and TTL verification at the Boss Gate to redeem.",
  },
  INFILTRATED_VILLAGE: {
    id: "INFILTRATED_VILLAGE",
    name: "The Infiltrated Village",
    effect: "Overflow creatures reach the forge, archive, and armory. Boss encounter starts with internal enemies active.",
    redemptionChallenge: "In the Boss Gate, successfully combine rate limiting and IP blocking to redeem.",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// DEBTS REGISTRY
// ─────────────────────────────────────────────────────────────────────────────

export const DEBTS: Record<string, Debt> = {
  // Zone 1 Debts
  MANUAL_MATCH_DEBT: {
    id: "MANUAL_MATCH_DEBT",
    description: "You found the author but spent 4 hours matching by hand instead of using a JOIN.",
    surfacesAt: "Z1_BOSS_GATE",
    consequence: "Elder Query reminds you: 'Last time you matched by hand — we cannot afford that again.' Boss Gate time limit is shortened.",
  },
  LEFT_JOIN_NOISE_DEBT: {
    id: "LEFT_JOIN_NOISE_DEBT",
    description: "Uncursed weapons cluttered your results. You nearly picked the wrong tome.",
    surfacesAt: "Z1_ACT3",
    consequence: "A villager carries the wrong weapon to battle. During Act 3, one guard is misarmed and unavailable.",
  },
  BRUTE_FORCE_JOIN_DEBT: {
    id: "BRUTE_FORCE_JOIN_DEBT",
    description: "You matched wing data manually instead of using any JOIN.",
    surfacesAt: "Z1_BOSS_GATE",
    consequence: "At the Boss Gate, the time pressure doubles. The manual approach cost you here.",
  },
  DISTINCT_MISAPPLIED_DEBT: {
    id: "DISTINCT_MISAPPLIED_DEBT",
    description: "You narrowed to two copies instead of one — uncertain which tome is real.",
    surfacesAt: "Z1_BOSS_GATE",
    consequence: "The wrong tome causes a minor curse during the boss encounter. One of Nullus's resistances is active.",
  },
  // Zone 2 Debts
  FORGE_DELAY_DEBT: {
    id: "FORGE_DELAY_DEBT",
    description: "Quick-return tasks waited while Task A bled Ferron dry. Ferron enters Act 2 weakened.",
    surfacesAt: "Z2_ACT2",
    consequence: "Ferron starts Act 2 at 28% energy instead of a stable baseline. One hearth is already cold.",
  },
  CONTEXT_DEBT: {
    id: "CONTEXT_DEBT",
    description: "Round Robin interruptions cost Ferron more than they gave. One forge runs at 80% efficiency.",
    surfacesAt: "Z2_ACT3",
    consequence: "In Act 3, one forge is operating at reduced efficiency — allocation options are one step tighter.",
  },
  HALF_CHANNEL_DEBT: {
    id: "HALF_CHANNEL_DEBT",
    description: "FERRO's channel was wiped to resolve the deadlock. Ferron runs on one lung.",
    surfacesAt: "Z2_BOSS_GATE",
    consequence: "Ferron's left arm fires at half strength during the Boss Gate. Round 1 damage output reduced.",
  },
  BOTTLENECK_REGULATOR_DEBT: {
    id: "BOTTLENECK_REGULATOR_DEBT",
    description: "The centralized regulator resolves conflicts but becomes a bottleneck for all future handoffs.",
    surfacesAt: "Z2_ACT3",
    consequence: "The regulator is unavailable during the Act 3 memory crisis. Resource allocation must be done without arbitration.",
  },
  FIRST_FIT_DEBT: {
    id: "FIRST_FIT_DEBT",
    description: "KARN's structural reinforcement stalled. Ferron walks but his left side is unbraced.",
    surfacesAt: "Z2_BOSS_GATE",
    consequence: "The Boss Gate causes Ferron structural damage on the first hit. He takes increased damage in Round 1.",
  },
  COMPACTION_GAP_DEBT: {
    id: "COMPACTION_GAP_DEBT",
    description: "The 45-minute compaction halt let the outer fence breach and two watchtowers burn.",
    surfacesAt: "Z2_BOSS_GATE",
    consequence: "Boss encounter starts with outer wall already damaged. Overflow has a pre-existing entry point.",
  },
  FIFO_TIRED_DEBT: {
    id: "FIFO_TIRED_DEBT",
    description: "9 page faults. Ferron stalls 9 times. He arrives at the Boss Gate tired.",
    surfacesAt: "Z2_BOSS_GATE",
    consequence: "Boss Gate begins with Ferron at reduced energy. Amber glow instead of gold.",
  },
  LFU_DEPLETED_DEBT: {
    id: "LFU_DEPLETED_DEBT",
    description: "11 page faults. Ferron staggers into the Boss Gate barely glowing.",
    surfacesAt: "Z2_BOSS_GATE",
    consequence: "Boss Gate starts with Ferron in amber state — significantly below optimal entry energy.",
  },
  // Zone 3 Debts
  REDUNDANT_ESCORT_DEBT: {
    id: "REDUNDANT_ESCORT_DEBT",
    description: "One escort group is delayed on the longer path. Half the royal guard is absent.",
    surfacesAt: "Z3_ACT3",
    consequence: "Half the royal guard is absent for the DDoS/flood defense in Act 3.",
  },
  ACK_DELAY_DEBT: {
    id: "ACK_DELAY_DEBT",
    description: "ACK-based verification took 2 hours. The firewall setup in Act 3 is rushed.",
    surfacesAt: "Z3_ACT3",
    consequence: "The firewall in Act 3 has a gap — one filtering rule is missing under time pressure.",
  },
  NULL_ROUTE_DEBT: {
    id: "NULL_ROUTE_DEBT",
    description: "The gate was closed entirely. A supply convoy carrying medicine was locked out.",
    surfacesAt: "Z3_BOSS_GATE",
    consequence: "An NPC falls ill. At the Boss Gate, one ally is unavailable due to illness.",
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// ZONE 1 — THE ARCHIVE CITADEL (Database)
// Enemies: Nullus the Dread Wyrm
// Guide: Elder Query
// CS Topics: SELECT/LIKE, JOIN types, GROUP BY / HAVING
// ═══════════════════════════════════════════════════════════════════════════════

export const ZONE_1_SCENES: Scene[] = [

  // ─────────────────────────────────────────────────────────────────────
  // ZONE 1 — ACT 1: "The Index of Shadows"
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "Z1_ACT1_INDEX_OF_SHADOWS",
    zone: "ARCHIVE_CITADEL",
    act: 1,
    title: "The Index of Shadows",
    narratorOpen: `The Archive Citadel rises before you like a mountain of frozen thought — ten million tomes stacked behind its stone walls, catalogued by a system so old even the walls remember it. The weapon that slays Nullus the Dread Wyrm is in here. Somewhere. Elder Query — blind scholar, keeper of every seal and shelf — cannot walk you to it. He can only describe. You must learn to speak his language, and quickly. Outside, Nullus tests the outer wall. You can hear it. Low. Rhythmic. Patient. It has been waiting a very long time.`,
    dialogue: [
      {
        character: "ELDER_QUERY",
        line: "The weapon that slays Nullus was forged by a traitor. Their name carries the shadow of death — 'Mord' in the old tongue. The weapon was made after the Third War. Begin with the authors, Sir Axiom. Begin with the names.",
      },
      {
        character: "SIR_AXIOM",
        line: "[You stand before the six great Wings of the Archive. The wings stretch in every direction. Elder Query waits, head tilted, fingers resting on the index stone.]",
      },
      {
        character: "ELDER_QUERY",
        line: "The archive rewards precision. It punishes wandering. Ask the right question and the shelves answer. Ask the wrong one and you will still be walking when the wyrm has taken the last tower.",
      },
      {
        character: "NULLUS",
        line: "[From outside, a low reverberation. One gate tower cracks. Dust falls from the archive ceiling.]",
      },
    ],
    momentOfTruth: "How do you search the archive for the author whose name contains 'Mord', forged after the Third War?",
    pressureElement: "The archive lanterns flicker. A distant boom. Something massive just hit the eastern wall. Elder Query's hands tighten on his staff. You have minutes — not hours.",
    choices: [
      {
        label: "A",
        inWorldText: "Search every wing one by one, reading all scrolls until you find any mention of 'Mord' anywhere in the archive.",
        tier: "TIER_4_CRITICAL_ERROR",
        csConceptExplained: "Full table scan with no index, no filter, no WHERE clause. O(n) across every row in every table.",
        narrativeConsequence: "You begin at the first shelf. The archive is vast — incomprehensibly vast. An hour passes. Two. You find mentions of 'Mord' in cooking recipes, in weather records, in a travelogue about a village called Mordwick. Elder Query stands motionless, listening to your footsteps grow more frantic. Outside, a sound like thunder. Not thunder. Nullus has taken the eastern gate tower. It is gone.",
        npcReveal: "Elder Query speaks without turning: 'You searched everywhere and found nothing useful. The archive does not reward wandering — it punishes it. A name searched in parts of names, narrowed to a time, returned in one breath. You searched with your feet instead of your mind.'",
        xp: 0,
        scarEarned: SCARS.FULL_SCAN_SCAR,
        leadsTo: "Z1_ACT2_JOIN_OF_FATES",
      },
      {
        label: "B",
        inWorldText: "Ask Elder Query to list all authors whose names contain 'Mord' anywhere — beginning, middle, or end — then show them sorted by the era they worked in.",
        tier: "TIER_1_OPTIMAL",
        csConceptExplained: "SELECT with LIKE '%Mord%' + ORDER BY era. Correct wildcard, correct column, proper sort.",
        narrativeConsequence: "The index stone hums. Elder Query's fingers trace the air and three names rise in the dust — clear, ordered, glowing faintly at the edges. Mordekath the Exile. Asmorden the Blind. Vordmun of the Third Age. The archive exhales. The shelves around you settle. Something that was tightening in the ceiling beams — releases.",
        npcReveal: "Elder Query says quietly: 'The index serves those who ask precisely. A name searched with wildcard — partial match, both sides — returns what is hidden inside other names. Sorted by era, the Third War author rises to the top. You spoke the archive's language, Sir Axiom.'",
        xp: 100,
        leadsTo: "Z1_ACT2_JOIN_OF_FATES",
      },
      {
        label: "C",
        inWorldText: "Find authors whose name is exactly and completely 'Mord' — full match only, so there are no false results from similar-sounding names.",
        tier: "TIER_3_MINOR_ERROR",
        csConceptExplained: "LIKE 'Mord' with no wildcard — exact match only, misses partial name matches like 'Mordekath'.",
        narrativeConsequence: "The index stone goes quiet. Zero names surface. The dust settles with nothing written in it. You return to Elder Query empty-handed. A guard near the western entrance glances at you with poorly concealed contempt. Thirty minutes. Gone. The wyrm does not wait.",
        npcReveal: "Elder Query sighs — long, deliberate. 'You searched too narrow, Sir Axiom. The shadow hides in parts of names, not whole names. Mordekath is not called Mord. Asmorden is not called Mord. The name must be searched with open ends — here, and here — to catch what hides inside other words.'",
        xp: 10,
        leadsTo: "Z1_ACT2_JOIN_OF_FATES",
      },
      {
        label: "D",
        inWorldText: "Pull all weapons forged after the Third War first, then separately find all authors with 'Mord' in their name, and manually match them yourself by cross-referencing both lists.",
        tier: "TIER_2_VIABLE",
        csConceptExplained: "Correct approach but no JOIN — manual matching instead of relational query. Two separate SELECTs, then brute-force cross-reference.",
        narrativeConsequence: "You find the author. Mordekath the Exile. His name appears in WING_AUTHORS, and one of his weapons appears in WING_WEAPONS post-Third War. But finding this took four hours — four hours of you carrying scrolls back and forth, matching seal numbers by hand on the floor of the archive. Elder Query says nothing the entire time. He just listens.",
        npcReveal: "As you finally confirm the name, Elder Query speaks: 'The connection between author and weapon is a relationship sealed in this archive — weapon_id links them. You could have asked me to find both together in one breath. Instead you matched by hand. We found the truth. But the cost was time, and time is the one thing Nullus does not need more of.'",
        xp: 50,
        debtPlanted: DEBTS.MANUAL_MATCH_DEBT,
        leadsTo: "Z1_ACT2_JOIN_OF_FATES",
      },
      {
        label: "E",
        inWorldText: "Ask Elder Query to show every book ever checked out by visitors in the last 100 years — if you trace what was popular, you can find the famous weapon.",
        tier: "TIER_3_MINOR_ERROR",
        csConceptExplained: "Querying WING_VISITORS when you need WING_AUTHORS — completely wrong table, irrelevant data.",
        narrativeConsequence: "The index stone surfaces a vast scroll of names. Visitors. Thousands of them. Merchants, scholars, pilgrims, children dragged to the archive by their tutors. None of it connects to any weapon, any author, any curse. A young guard leans over your shoulder and snorts. 'Those are the library's borrowing records.' You have spent thirty minutes generating a list of tourists.",
        npcReveal: "Elder Query pinches the bridge of his nose. 'The visitors wing holds who has been here, not what they sought. You needed the authors wing — names, eras, allegiances. Different shelf. Very different question. The archive has six wings for a reason, Sir Axiom. The right question must find the right wing first.'",
        xp: 10,
        leadsTo: "Z1_ACT2_JOIN_OF_FATES",
      },
    ],
    postChoiceHook: "Three candidate names. One is the traitor. The weapon they forged is split across two wings of the archive — and one of the records may no longer exist. Elder Query points deeper into the citadel. The second act of the search begins.",
  },

  // ─────────────────────────────────────────────────────────────────────
  // ZONE 1 — ACT 2: "The JOIN of Fates"
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "Z1_ACT2_JOIN_OF_FATES",
    zone: "ARCHIVE_CITADEL",
    act: 2,
    title: "The JOIN of Fates",
    narratorOpen: `Three candidate tomes found — but each is split across two wings. The weapon's true name lives in WING_WEAPONS. The curse that makes it lethal to Nullus lives in WING_FORBIDDEN. They share one common seal: weapon_id. But there is a complication. One of the forbidden scrolls has a weapon_id that no longer exists in WING_WEAPONS — it was destroyed in a fire a century ago. Elder Query tells you this without emotion, as if fires that consume irreplaceable records are simply a category of event he has filed appropriately.`,
    dialogue: [
      {
        character: "ELDER_QUERY",
        line: "The weapon and its curse are in separate wings. They must be brought together. The seal they share — weapon_id — is the connection. But one connection in the cursed wing has no partner in the weapon wing. That record burned. It is ash. Whatever you retrieve from that pairing will be nothing.",
      },
      {
        character: "SIR_AXIOM",
        line: "[You study the two wings. WING_WEAPONS on the left. WING_FORBIDDEN on the right. The connection is there — but how you combine them determines what you get.]",
      },
      {
        character: "ELDER_QUERY",
        line: "Ask well, Sir Axiom. The wrong combination will flood you with noise, or pull you toward a record that no longer has a body to stand on.",
      },
    ],
    momentOfTruth: "How do you combine WING_WEAPONS and WING_FORBIDDEN to find the one weapon that is both real and cursed?",
    pressureElement: "A crack runs across the ceiling above the western stacks. Nullus is pressing the outer wall. Dust falls in thin lines. The archive moans. How you join these two wings — right now — determines whether you walk out with the weapon or with rubble.",
    choices: [
      {
        label: "A",
        inWorldText: "Retrieve only the weapons that have a matching curse entry — if there is no curse record for a weapon, ignore it entirely.",
        tier: "TIER_1_OPTIMAL",
        csConceptExplained: "INNER JOIN — returns only rows with matching weapon_id in both tables. Eliminates the orphaned curse record automatically.",
        narrativeConsequence: "The index stone produces a clean, exact result. One weapon. One curse. They align perfectly on the parchment — weapon_id shared, seal intact, names matching. The cursed weapon glows faintly in the archive light. It has been waiting here for three hundred years to be correctly retrieved.",
        npcReveal: "Elder Query stands very still. Then: 'You understand relationships, Sir Axiom. A weapon without a curse is not what you need. A curse without a weapon cannot harm a wyrm. You asked for only those with both — and that is exactly what the archive returned. This is the JOIN of matched purpose.'",
        xp: 100,
        leadsTo: "Z1_ACT3_CURSED_DUPLICATES",
      },
      {
        label: "B",
        inWorldText: "Retrieve all weapons, and show each weapon's curse if one exists — but include the weapon in the results even if there is no curse record for it.",
        tier: "TIER_2_VIABLE",
        csConceptExplained: "LEFT JOIN — returns all rows from WING_WEAPONS, with NULL for curse fields where no match exists. Gets the right answer but with noise.",
        narrativeConsequence: "The results come back heavy. Dozens of weapons, most with curse fields empty — blanks where no corresponding record exists. The true weapon is in there. But so are uncursed blades, ceremonial pieces, a training sword someone apparently stored in a forbidden wing by mistake. You nearly commit to the wrong tome before catching yourself.",
        npcReveal: "Elder Query listens to you sifting through the results. 'You retrieved everything with a weapon record, cursed or not. The uncursed weapons clouded your view. The true blade is present — but you almost reached past it. A more precise join would have given you only what you needed.'",
        xp: 50,
        debtPlanted: DEBTS.LEFT_JOIN_NOISE_DEBT,
        leadsTo: "Z1_ACT3_CURSED_DUPLICATES",
      },
      {
        label: "C",
        inWorldText: "Retrieve all curse records regardless of whether a weapon still exists for them — show every curse entry in the forbidden wing, even orphaned ones.",
        tier: "TIER_3_MINOR_ERROR",
        csConceptExplained: "RIGHT JOIN — gets all curse records including the orphaned one from the destroyed weapon. Returns a dead record.",
        narrativeConsequence: "The results include a curse for a weapon that no longer exists — the destroyed one. You do not know it is destroyed. You walk to the shelf where it should be. The shelf crumbles when you touch it. The scroll behind it is ash. You have spent critical time pursuing a record whose physical form was consumed by a fire a century before you were born.",
        npcReveal: "Elder Query speaks quietly from across the archive: 'That curse record is real. The weapon it references is not. A join that starts from the curse side retrieves every curse — including those whose weapons burned. You pulled a ghost, Sir Axiom. The archive contains both living records and the shapes of what was lost.'",
        xp: 10,
        leadsTo: "Z1_ACT3_CURSED_DUPLICATES",
      },
      {
        label: "D",
        inWorldText: "Retrieve every possible combination of weapons and curses — match every weapon to every curse entry to be completely thorough. Leave nothing unexamined.",
        tier: "TIER_4_CRITICAL_ERROR",
        csConceptExplained: "CROSS JOIN — Cartesian product. Every weapon paired with every curse. Explosive result set that destroys performance and utility.",
        narrativeConsequence: "The index stone screams. Parchment erupts from the shelves — thousands of combinations, every weapon matched to every curse, cascading across the archive floor in a wave of meaningless pairings. Elder Query stumbles backward. Three shelves collapse under the weight of the generated results. A guard sprints toward the sound and trips over a rolling avalanche of scrolls. Outside, Nullus roars — not from attack but from recognition. It can feel the archive weakening.",
        npcReveal: "Elder Query, when he recovers his footing, speaks with exhausted fury: 'You matched everything to everything. Every weapon with every curse. That is not thoroughness — that is chaos wearing the shape of effort. The archive is a system of relationships, not a pile of combinations. A cross-join does not search. It detonates.'",
        xp: 0,
        scarEarned: SCARS.CROSS_JOIN_SCAR,
        leadsTo: "Z1_ACT3_CURSED_DUPLICATES",
      },
      {
        label: "E",
        inWorldText: "Since weapon_id is shared between both wings, manually read both wings and match them yourself by eye — safer than trusting the seal system to handle it automatically.",
        tier: "TIER_2_VIABLE",
        csConceptExplained: "No JOIN — brute force manual matching. Correct result but slow and inefficient.",
        narrativeConsequence: "You sit on the archive floor and begin. Left wing. Right wing. Cross-reference by seal number. It is slow and your eyes start to blur after the second hour. You match them correctly — the weapon and its curse align, the orphaned curse record gets skipped because you can see the corresponding shelf is empty. But the process takes everything the clock had left.",
        npcReveal: "Elder Query does not say 'well done.' He says: 'You matched them. You were correct to skip the empty shelf. But you used your eyes where the seal system could have done it in one breath. When the next choice comes — and it will come — you will have less time than you do now because you spent it here on the floor.'",
        xp: 50,
        debtPlanted: DEBTS.BRUTE_FORCE_JOIN_DEBT,
        leadsTo: "Z1_ACT3_CURSED_DUPLICATES",
      },
    ],
    postChoiceHook: "The weapon has a name. Now it has a problem. A saboteur left three fakes — identical in every visible way. One is real. One has been accessed exactly once. The rest have either never been touched or been touched too many times. Elder Query points to the shelf. Four identical tomes. One truth. Three lies.",
  },

  // ─────────────────────────────────────────────────────────────────────
  // ZONE 1 — ACT 3: "The Cursed Duplicates"
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "Z1_ACT3_CURSED_DUPLICATES",
    zone: "ARCHIVE_CITADEL",
    act: 3,
    title: "The Cursed Duplicates",
    narratorOpen: `A saboteur planted three fake copies of the target tome. All four copies look identical — same binding, same seal, same weight in the hand. One is real. The real one was accessed exactly once — by the original author, the moment they finished writing it. The fakes have either never been accessed, or been accessed many times by the saboteur rehearsing the deception. The WING_VISITORS log holds every access. The WING_COPIES holds condition and copy_id. Everything you need is in the archive. The question is how you ask for it.`,
    dialogue: [
      {
        character: "ELDER_QUERY",
        line: "The real tome was touched once. Only once. By the hand that made it. The fakes were either never touched — placed here waiting — or touched many times by the one who placed them. The visitor log remembers every hand. Yours now to read.",
      },
      {
        character: "SIR_AXIOM",
        line: "[Four identical tomes on the shelf. The WING_COPIES record shows them. The WING_VISITORS record shows every access. Somewhere in the data, one tome stands alone.]",
      },
      {
        character: "NULLUS",
        line: "[The outer walls vibrate. Low and continuous now. The wyrm is no longer testing. It is committed.]",
      },
    ],
    momentOfTruth: "How do you identify the single real tome — the one accessed exactly once — from the three decoys?",
    pressureElement: "The archive floor trembles. Dust rains from the ceiling in a thin, continuous curtain. Nullus is at the outer gate. Elder Query grips his staff with both hands and says nothing. You have one chance to choose the right tome. One.",
    choices: [
      {
        label: "A",
        inWorldText: "Group all copies of the tome by their scroll_id, count how many times each was accessed in the visitor log, and show only the one that was accessed exactly once.",
        tier: "TIER_1_OPTIMAL",
        csConceptExplained: "GROUP BY scroll_id + HAVING COUNT(access) = 1. Correct aggregation with correct filter condition.",
        narrativeConsequence: "One tome remains in the results. The others resolve into noise and fall away. It glows — not from magic but from being the correct answer in a sea of wrong ones, which is its own kind of light. The saboteur, watching from somewhere in the stacks, bolts. Elder Query hears the footsteps and says nothing. He is too busy weeping — quietly, precisely, without self-indulgence.",
        npcReveal: "Elder Query composes himself and speaks: 'Grouped by identity. Counted by access. Filtered to exactly one. That is how truth separates from forgery in a system — not by how it looks, but by how it has been used. The real tome was touched once. You found the one that matches that truth precisely.'",
        xp: 100,
        leadsTo: "Z1_BOSS_GATE",
      },
      {
        label: "B",
        inWorldText: "Pull all copies and remove any that appear more than once in the visitor log — keep only the entries that are unique across the access records.",
        tier: "TIER_2_VIABLE",
        csConceptExplained: "DISTINCT misapplied — removes duplicates from the result set but doesn't filter by COUNT = 1. Gets copies accessed once OR zero times.",
        narrativeConsequence: "You narrow the results to two tomes — both have unique visitor records. But one was accessed once legitimately, and one was never accessed at all — also unique, but for a different reason. You cannot determine from DISTINCT alone which is which. You grab both.",
        npcReveal: "Elder Query says: 'Unique is not the same as once. A tome never touched is also unique in the visitor records — it appears zero times, not duplicated. You removed the frequently-touched fakes, which was right. But you kept the never-touched one alongside the real one. DISTINCT finds absence of repetition, not presence of exactly one touch.'",
        xp: 50,
        debtPlanted: DEBTS.DISTINCT_MISAPPLIED_DEBT,
        leadsTo: "Z1_BOSS_GATE",
      },
      {
        label: "C",
        inWorldText: "Sort all copies alphabetically by title and pick the first one — original copies are usually filed first, before duplicates are added.",
        tier: "TIER_4_CRITICAL_ERROR",
        csConceptExplained: "No CS basis — alphabetical sort has no relationship to authenticity. Pure guess.",
        narrativeConsequence: "You grab the first tome. You open it. You read the incantation aloud. The archive goes silent — and then the wrong kind of thing happens. Instead of a weapon materializing, Nullus outside lets out something between a roar and a laugh. The wyrm does not flee. It glows brighter. You have read a counter-curse — one designed to give the wyrm partial healing if spoken inside the archive. You drop the tome. Your sword hand burns as if scorched from the inside.",
        npcReveal: "Elder Query speaks with genuine pain in his voice: 'Alphabetical order is how a librarian files. It is not how truth is hidden or found. The archive does not place originals first. It places scrolls where they fit. You chose the first letter instead of the first touch. The incantation you read was a trap laid by the saboteur — placed at the beginning of the alphabet precisely because someone like you might guess exactly as you guessed.'",
        xp: 0,
        scarEarned: SCARS.WRONG_TOME_SCAR,
        leadsTo: "Z1_BOSS_GATE",
      },
      {
        label: "D",
        inWorldText: "Pull all copies and manually inspect each scroll's physical condition — the real one is probably worn from the author's use, while the fakes would look newer.",
        tier: "TIER_3_MINOR_ERROR",
        csConceptExplained: "Wrong column — querying 'condition' field which shows preservation state, not usage frequency. Not correlated with authenticity.",
        narrativeConsequence: "You check the condition field on all four copies. All four read: 'Good.' The archive preserves its scrolls obsessively — temperature-regulated stone, protective casings, quarterly restoration. A tome written three hundred years ago looks identical to one placed here last week. The condition field tells you nothing useful. A guard is pulled from the outer wall to help you look. The wall, briefly less defended, takes a hit.",
        npcReveal: "Elder Query says: 'The archive preserves everything equally well. A three-hundred-year tome and a three-week forgery both read as Good condition here. You needed the visitor record — the access count — not the preservation record. The archive's strength is its maintenance. That strength became your blind spot.'",
        xp: 10,
        leadsTo: "Z1_BOSS_GATE",
      },
      {
        label: "E",
        inWorldText: "Find all scroll entries where the copy appears in the visitor log exactly once AND the visitor who accessed it matches the author's name from WING_AUTHORS.",
        tier: "TIER_1_OPTIMAL",
        csConceptExplained: "JOIN + GROUP BY + HAVING COUNT = 1 + subquery matching author name. Advanced — perfect result in minimum time.",
        narrativeConsequence: "The result emerges in seconds — clean as a blade pulled from cold water. One copy. One access. The visitor name matches: Mordekath the Exile, author, three hundred years dead. No other copy in the archive has this combination. The tome practically identifies itself. The saboteur, somewhere in the stacks, drops something heavy and runs.",
        npcReveal: "Elder Query stands up. He does not stand up often. He is very old and it costs him something. He stands anyway and bows his head slowly. 'You joined the copies to the visitors to the authors. You filtered by count and by name. You asked for the only thing that could only be true: one touch, by the one who made it. Sir Axiom — the archive has never been read so well.'",
        xp: 150,
        bonusUnlocked: "ARCHIVE_MASTERY — Elder Query gifts you a second index seal. At the Boss Gate, one search challenge is bypassed.",
        leadsTo: "Z1_BOSS_GATE",
      },
    ],
    postChoiceHook: "The weapon is in your hands. Real. Cold. Old enough to remember when Nullus was young and still afraid of things. Elder Query says: 'Go. But the wyrm knows the archive now. What it has seen of your choices — it has used. The Boss Gate will test everything you learned here, and everything you got wrong.' The archive shakes. The Boss Gate opens.",
  },

  // ─────────────────────────────────────────────────────────────────────
  // ZONE 1 — BOSS GATE: "The Living Index"
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "Z1_BOSS_GATE",
    zone: "ARCHIVE_CITADEL",
    act: 4,
    title: "BOSS GATE — The Living Index",
    narratorOpen: `Nullus does not attack the walls anymore. It has come inside. The Dread Wyrm fills the archive's central hall — its body of rotting parchment and corrupted data expanding to fill every shelf, every aisle, every gap between tomes. It speaks in malformed queries. It breathes out cascading NULL values. The weapon in your hand is the correct weapon — but Nullus knows every debt you owe and every scar you carry. It has been reading the archive too. Now, all previous DEBT consequences trigger simultaneously. Every shortcut, every wrong answer, every choice that planted a cost — the cost is due. Elder Query stands in the eye of it, hands raised, creating what silence he can. Three challenges. Everything at once.`,
    dialogue: [
      {
        character: "ELDER_QUERY",
        line: "It read what you left behind, Sir Axiom. Every imprecise query, every wasted hour, every crossed join — Nullus fed on the disorder. What you knew, and how well you knew it — that is your weapon now. Use it.",
      },
      {
        character: "NULLUS",
        line: "You wander. You always wander. You searched everything and found nothing. You joined everything and broke three shelves. The archive remembers. I remember. NULL. NULL. NULL.",
      },
      {
        character: "ELDER_QUERY",
        line: "Three challenges. The wyrm has layered the archive's own structure against you. Solve each one with precision and the weapon activates. One wrong step and Nullus absorbs another wing.",
      },
    ],
    momentOfTruth: "Three consecutive archive challenges — each one drawing on the CS concepts from Acts 1–3. Every SCAR reduces your margin. Every DEBT triggers its consequence now. Precision is the only armor that matters here.",
    pressureElement: "Nullus exhales. A wing of the archive dissolves. Thousands of tomes disappear into its body. Elder Query does not flinch. He says only: 'Three questions. Answer with your mind, not your feet.' The Living Index begins.",
    choices: [
      {
        label: "A",
        inWorldText: "[ROUND 1] Use a filtered search with partial name matching to isolate the one author record Nullus has corrupted inside the archive's living index.",
        tier: "TIER_1_OPTIMAL",
        csConceptExplained: "LIKE '%partial%' + WHERE filter. Correct wildcard, correct table. Redeems FULL_SCAN_SCAR if earned.",
        narrativeConsequence: "The corrupted record collapses. Nullus recoils — one layer of parchment scales falls away. The archive wing it consumed flickers and partially rebuilds. Elder Query exhales. The weapon in your hand vibrates.",
        npcReveal: "Elder Query: 'Precise search. Wildcard open on both sides. The right wing, the right column, the right filter. You did not wander this time.' [If FULL_SCAN_SCAR was earned: 'You learned from the tower. It will not come back — but you will not repeat that mistake either.']",
        xp: 100,
        leadsTo: "Z1_BOSS_GATE_ROUND2",
      },
      {
        label: "B",
        inWorldText: "[ROUND 2] Join the weapon and curse wings precisely — matching only the pairs where both records exist — to expose the core record Nullus is hiding inside.",
        tier: "TIER_1_OPTIMAL",
        csConceptExplained: "INNER JOIN — matched pairs only. Redeems CROSS_JOIN_SCAR if earned.",
        narrativeConsequence: "The join executes. Clean result. One pairing. Nullus's core record is exposed — the thing it was hiding inside the corrupted join noise. The wyrm screams. Pages fly. The correct weapon record materializes as a column of light inside the archive.",
        npcReveal: "Elder Query: 'Only the matched pairs. Nothing extra. Nothing missing. The join served its purpose — it revealed what was hidden inside the relationship between two things.' [If CROSS_JOIN_SCAR was earned: 'Three shelves. You remember. This is what the join was always supposed to do.']",
        xp: 100,
        leadsTo: "Z1_BOSS_GATE_ROUND3",
      },
      {
        label: "C",
        inWorldText: "[ROUND 3] Group the final records by type, count occurrences, and surface only the record accessed exactly once — the one true record Nullus cannot fake.",
        tier: "TIER_1_OPTIMAL",
        csConceptExplained: "GROUP BY + HAVING COUNT = 1. Redeems WRONG_TOME_SCAR if earned.",
        narrativeConsequence: "One record. One. It surfaces from the noise like a signal from deep underwater — singular, undeniable, correctly accessed exactly once, by the original author, at the beginning of time. Nullus does not heal it. Nullus cannot fake it. The weapon activates. You raise it. The Dread Wyrm understands what is about to happen.",
        npcReveal: "Elder Query speaks for the last time in a voice that sounds relieved: 'Grouped. Counted. Filtered to one. The archive answered exactly as asked. Go, Sir Axiom. It is time.' [If WRONG_TOME_SCAR was earned: 'Your hand. I know it still burns. Swing anyway.']",
        xp: 100,
        leadsTo: "Z1_ZONE_COMPLETE",
      },
    ],
    postChoiceHook: "The weapon connects. Nullus the Dread Wyrm dissolves into a cascade of NULL values and corrupted records that scatter across the archive floor and go still. Elder Query sits down on the nearest step, very slowly, and does not get up for a while. You leave the Archive Citadel with your XP, your scars, your debts resolved — and two more zones waiting.",
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// ZONE 2 — THE FORGE VILLAGE (Operating Systems)
// Protagonist/Boss: Ferron the Iron Golem (becomes DEADLOCK in boss state)
// Guides: The Forge Master, The Engineer
// Spirits: Ferro (left), Anvila (right)
// CS Topics: CPU Scheduling, Deadlock Prevention, Memory Allocation, Page Replacement
// ═══════════════════════════════════════════════════════════════════════════════

export const ZONE_2_SCENES: Scene[] = [

  // ─────────────────────────────────────────────────────────────────────
  // ZONE 2 — ACT 1: "The Scheduling Crisis"
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "Z2_ACT1_SCHEDULING_CRISIS",
    zone: "FORGE_VILLAGE",
    act: 1,
    title: "The Scheduling Crisis",
    energyMeter: "████████░░░░░░░░░░░░  [42% — DROPPING]",
    narratorOpen: `Ferron the Iron Golem stands frozen in the center of the Forge Village square — one arm raised mid-swing, locked mid-motion, like a statue of a moment that never finished. His chest cavity pulses with weak amber light. He is not broken. He is starving. Forge energy — the precise, regulated force that keeps him alive — has been mismanaged for weeks. Five urgent tasks are screaming for forge power simultaneously. The hearth foremen are arguing. Ferron's glow dims with each passing minute. You are the Forge Warden. You have one chance to set the order right.`,
    dialogue: [
      {
        character: "FORGE_MASTER",
        line: "Every task draws the same energy, Sir Axiom — but they don't all RETURN the same amount. Short tasks return energy fast. Long tasks hold it hostage. Ferron needs a steady flow — not a flood and not a drought. Regulate the order or we lose him.",
      },
      {
        character: "FERRON",
        line: "I cannot coordinate. My arm will not complete its motion. Give me order. Without order I am only weight.",
      },
      {
        character: "FORGE_MASTER",
        line: "Task A: 8 minutes — outer wall section. Task B: 2 minutes — sword sharpening. Task C: 4 minutes — gate hinges. Task D: 6 minutes — iron bolt casting. Task E: 1 minute — signal torches. One chance, Warden. How do they run?",
      },
      {
        character: "ENGINEER",
        line: "[Scribbling furiously in his notebook] The energy return cycle — it matters. Short tasks give back fast. That's the key. Feed him the small meals first and he can handle the large ones.",
      },
    ],
    momentOfTruth: "In what order do you run the five forge tasks to stabilize Ferron's energy most efficiently?",
    pressureElement: "Ferron's chest light dims further — amber bleeding toward orange. The Forge Master grabs your arm. 'He drops to 20% and we enter CRITICAL STATE. That changes everything. Decide now.'",
    choices: [
      {
        label: "A",
        inWorldText: "Run the tasks in the order the foremen originally requested them — Task A was requested first, so it runs first. Fairness means first come, first served.",
        tier: "TIER_3_MINOR_ERROR",
        csConceptExplained: "FCFS (First-Come First-Served) scheduling. Poor average turnaround — long jobs block short ones.",
        narrativeConsequence: "Task A begins. Eight full minutes of maximum draw. The quick tasks — E and B — wait in line, their energy returns locked behind the wall of Task A. Ferron's amber glow dims further to red. His frozen arm does not move. It trembles. The forge master grabs your sleeve and pulls.",
        npcReveal: "Forge Master: 'Task A is bleeding him dry — the quick ones would have given him something back by now. You gave him a feast he couldn't swallow instead of feeding him small pieces first. FCFS. First come, first served. It sounds fair. It is not efficient. There is a difference.'",
        xp: 10,
        debtPlanted: DEBTS.FORGE_DELAY_DEBT,
        leadsTo: "Z2_ACT2_DEADLOCK",
      },
      {
        label: "B",
        inWorldText: "Start with the shortest tasks first — run E (1 min) then B (2 min) then C (4 min) then D (6 min) then A (8 min) — get quick energy back into Ferron immediately, then build up.",
        tier: "TIER_1_OPTIMAL",
        csConceptExplained: "SJF (Shortest Job First) — optimal average return time. Quick completions cycle energy back immediately.",
        narrativeConsequence: "The signal torches go first — one minute, instant return. The swords follow — two minutes, energy surges back. Ferron's glow steadies. Then brightens. The amber deepens to gold. His frozen arm lowers. Slowly. Then with intention. He exhales a long breath of steam that fills the square and makes every watching villager take a step backward.",
        npcReveal: "Forge Master claps once — her version of a standing ovation: 'There. You fed him the small meals first. He could process them, return from them, build from them. Shortest first. He gets something back before he has to give more. That is how you keep a Golem breathing.'",
        xp: 100,
        leadsTo: "Z2_ACT2_DEADLOCK",
      },
      {
        label: "C",
        inWorldText: "Assign each task exactly 2 minutes of forge time, then rotate to the next — every task makes some progress, nothing is starved, nothing monopolizes the forge.",
        tier: "TIER_2_VIABLE",
        csConceptExplained: "Round Robin scheduling. Fair but high context-switch overhead — partial completions drain more than they return.",
        narrativeConsequence: "Every task starts. Every task progresses slightly. Nothing finishes for the first ten minutes. Ferron receives partial energy returns — not enough to stabilize, just enough to prevent an immediate drop. He stays in amber. He trembles. His footsteps are hesitant. The forge master watches the partial completions stack up and says nothing for a long time.",
        npcReveal: "Forge Master, quietly: 'He's getting drips. But he needs a full drink. Every time we switch tasks before they finish, the forge has to remember where it was and start again. That remembering costs something. Equal time does not mean equal results, Sir Axiom.'",
        xp: 50,
        debtPlanted: DEBTS.CONTEXT_DEBT,
        leadsTo: "Z2_ACT2_DEADLOCK",
      },
      {
        label: "D",
        inWorldText: "Run the longest task first — get the heaviest energy drain out of the way early while Ferron still has reserves to absorb it.",
        tier: "TIER_4_CRITICAL_ERROR",
        csConceptExplained: "Longest Job First — worst possible average return time. Maximum starvation of short tasks.",
        narrativeConsequence: "Task A runs. Eight minutes. Maximum draw. Zero return. Ferron's amber core does not hold. It goes grey. He drops to one knee. The stone of the village square cracks under his weight. His eyes — two ember-orange slots in an iron face — go dark. Villagers scatter. Children are pulled indoors. The massive arm that was raised mid-swing falls completely limp.",
        npcReveal: "Engineer drops his notebook: 'Longest first is the worst possible order. The short tasks — E is one minute, B is two — they would have given him energy back immediately. Instead he's been bleeding for eight minutes with nothing returned. He's in CRITICAL STATE.'",
        xp: 0,
        scarEarned: SCARS.COLD_EMBER,
        leadsTo: "Z2_ACT2_DEADLOCK",
      },
      {
        label: "E",
        inWorldText: "Start all five tasks simultaneously across the three forges — parallelism means faster overall completion and less waiting for any single task.",
        tier: "TIER_4_CRITICAL_ERROR",
        csConceptExplained: "Race condition / simultaneous resource overload. Concurrent access to shared resource without synchronization — energy spike then crash.",
        narrativeConsequence: "All three forges ignite simultaneously. All five tasks begin drawing at the same moment. Ferron's hearths register the simultaneous draw and do the only thing they can — they spike. The energy doesn't distribute. It floods. Ferron doesn't freeze. He thrashes. His massive arm completes its swing in the wrong direction and destroys the forge master's workshop in one impact.",
        npcReveal: "Engineer, from behind a pillar: 'TOO MUCH at once! He can't regulate a spike that size — he burns what he can't use and then has nothing! You need synchronized, ordered access to the forges — not everything at once. That's not parallelism. That's a race condition. The forges raced each other and Ferron lost.'",
        xp: 0,
        scarEarned: SCARS.OVERBURN,
        leadsTo: "Z2_ACT2_DEADLOCK",
      },
    ],
    postChoiceHook: "Ferron moves again — partially or fully depending on your choice. But deeper in his core, two internal regulators have locked against each other. Ferro holds the Hammer Circuit. Anvila holds the Anvil Channel. Both wait for the other. Neither yields. The deadlock has already begun.",
  },

  // ─────────────────────────────────────────────────────────────────────
  // ZONE 2 — ACT 2: "The Deadlock of the Twin Hearths"
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "Z2_ACT2_DEADLOCK",
    zone: "FORGE_VILLAGE",
    act: 2,
    title: "The Deadlock of the Twin Hearths",
    energyMeter: "████████████░░░░░░░░  [58% — BURNING IDLE]",
    narratorOpen: `Two of Ferron's internal energy regulators have deadlocked. FERRO controls the Hammer Circuit and is waiting for the Anvil Channel to open. ANVILA controls the Anvil Channel and is waiting for the Hammer Circuit to release. Both are holding. Neither is working. Ferron's left side and right side are completely unresponsive. He walks in circles — burning energy doing nothing. Idle conflict costs more than productive labor. The energy drains 4% per minute. You count: seven minutes until critical.`,
    dialogue: [
      {
        character: "FERRO",
        line: "I hold the Hammer Circuit. I wait for Anvila to release the Anvil Channel. That is what I do. I will wait.",
      },
      {
        character: "ANVILA",
        line: "I hold the Anvil Channel. I wait for Ferro to release the Hammer Circuit. I will also wait. We will wait together. Forever, if we must.",
      },
      {
        character: "ENGINEER",
        line: "They cannot yield on their own — it is not stubbornness. It is their design. They will hold until something changes from the outside. Seven minutes until Ferron hits critical. Each minute of deadlock costs 4%.",
      },
      {
        character: "FORGE_MASTER",
        line: "Do something. I don't care what. Something that makes one of them move.",
      },
      {
        character: "FERRON",
        line: "Left arm. Right arm. Neither answers. I am walking but I am not moving. I am burning but I am not working. This is what dying feels like for something made of iron.",
      },
    ],
    momentOfTruth: "How do you break the deadlock between Ferro and Anvila before Ferron drains to critical?",
    pressureElement: "Six minutes remaining. Ferron staggers. His circular path is tightening. The Engineer's pen is shaking as he calculates. 'Five minutes. If we hit 20% we enter CRITICAL STATE and the boss gets harder. Decide.'",
    choices: [
      {
        label: "A",
        inWorldText: "Force FERRO to immediately release the Hammer Circuit — take it from him and hand it to ANVILA so she can finish first, then FERRO gets it back.",
        tier: "TIER_2_VIABLE",
        csConceptExplained: "Preemption — forcibly removing a resource from a process. Resolves deadlock but FERRO's incomplete work is lost and must restart.",
        narrativeConsequence: "Anvila gets the circuit. Ferron's right side activates — he moves with sudden lopsided purpose, lurching to the right. But Ferro's half-configured channel is cold. Wiped. His side has to begin again from nothing. Ferron walks — unevenly, favoring his right, trailing his left arm slightly.",
        npcReveal: "Engineer: 'Preemption. You stripped the resource from Ferro mid-work and gave it to Anvila. The deadlock broke — that's real. But Ferro's incomplete work was lost. His channel starts over from nothing. He's running on one lung, as the Forge Master would say. It works. It costs.'",
        xp: 50,
        debtPlanted: DEBTS.HALF_CHANNEL_DEBT,
        leadsTo: "Z2_ACT3_MEMORY",
      },
      {
        label: "B",
        inWorldText: "Establish a new rule: neither circuit spirit may hold their resource while waiting for another — they must release what they hold before requesting what they need.",
        tier: "TIER_1_OPTIMAL",
        csConceptExplained: "Breaking the Hold-and-Wait condition — one of the four necessary conditions for deadlock. Eliminates the circular dependency at its root.",
        narrativeConsequence: "Both spirits receive the rule simultaneously. Ferro releases the Hammer Circuit. Anvila picks it up, completes her cycle, releases both. Ferro resumes. The coordination snaps back in seconds. Ferron's glow steadies to a warm, even gold. He takes one smooth, powerful step forward — and the ground shakes. Not from damage. From intent.",
        npcReveal: "Engineer stops writing and just stares: 'You broke the Hold-and-Wait condition. You didn't take anything from either of them. You changed the rule about how they ask. Neither holds while waiting — so neither can create the circle that traps them both. That's not fixing a deadlock. That's preventing the class of deadlock entirely.'",
        xp: 100,
        leadsTo: "Z2_ACT3_MEMORY",
      },
      {
        label: "C",
        inWorldText: "Wait — one of them will eventually realize the situation and yield on their own. Internal systems often self-correct. Do not intervene in the internal process.",
        tier: "TIER_4_CRITICAL_ERROR",
        csConceptExplained: "No intervention on a deadlock — deadlocked processes cannot self-resolve. They will wait indefinitely by definition.",
        narrativeConsequence: "Seven minutes pass. They do not yield. They cannot yield — it is not stubbornness, it is their nature. Ferron's energy drains 4% per minute for seven uninterrupted minutes. He collapses to both knees. The village square cracks. Three other minor circuits, seeing the inaction, also stall — cascading deadlock across Ferron's entire system. His glow goes the color of old ash.",
        npcReveal: "Engineer, stricken: 'Deadlocked processes do not self-correct. They will wait literally forever — that is the definition of a deadlock. A system that waits for something that can never arrive without intervention. We needed to intervene. We didn't. Now we have a cascade. One deadlock became four.'",
        xp: 0,
        scarEarned: SCARS.LONG_WAIT,
        leadsTo: "Z2_ACT3_MEMORY",
      },
      {
        label: "D",
        inWorldText: "Assign a third regulator spirit to sit between them — approve every resource handoff personally to prevent future conflicts from forming.",
        tier: "TIER_2_VIABLE",
        csConceptExplained: "Centralized resource manager / Banker's Algorithm approach. Prevents deadlock but creates a bottleneck.",
        narrativeConsequence: "A third spirit materializes — slower than both, more deliberate. The deadlock resolves. Ferron's coordination returns but is visibly more careful, more hesitant — every major action preceded by a half-second pause as the regulator signals clearance. He moves. But he moves like someone who learned to be suspicious of movement.",
        npcReveal: "Engineer: 'Centralized management. The regulator checks every handoff and prevents conflict. It works. But now every circuit must wait for the regulator before it acts. He's the bottleneck. And when we need speed — when the boss hits — the regulator will be the thing slowing us down.'",
        xp: 50,
        debtPlanted: DEBTS.BOTTLENECK_REGULATOR_DEBT,
        leadsTo: "Z2_ACT3_MEMORY",
      },
      {
        label: "E",
        inWorldText: "Number the circuits. Enforce a strict rule: both spirits must always request the lower-numbered circuit first — Hammer Circuit (1) before Anvil Channel (2) — always, no exceptions.",
        tier: "TIER_1_OPTIMAL",
        csConceptExplained: "Resource ordering — breaks the Circular Wait condition. With ordered request hierarchy, no circular dependency can form.",
        narrativeConsequence: "The numbering rule propagates instantly. Both spirits attempt their natural inclinations — and the rule catches them before the cycle forms. Ferro requests Hammer(1) first. Anvila also requests Hammer(1) first. Ferro wins the race. Anvila waits correctly — in the right order, without holding anything, without creating a circle. Ferron stands fully upright for the first time. His glow turns white.",
        npcReveal: "Engineer stares at Ferron's white glow for three full seconds before speaking: 'Resource ordering. You numbered the circuits and mandated the request order. With a strict hierarchy, no circular dependency can form — ever. Ferro and Anvila can never trap each other because they always ask for lower numbers first. You didn't fix this deadlock. You made this deadlock architecturally impossible to create again.'",
        xp: 150,
        bonusUnlocked: "ORDERED_RESOLVE — Ferron performs one bonus action during the boss encounter.",
        leadsTo: "Z2_ACT3_MEMORY",
      },
    ],
    postChoiceHook: "Ferron moves. But his Capacity Core — the chamber that holds active task data — is still a mess. Weeks of mismanagement left it fragmented. Four repair processes need contiguous space. Not all of them can fit. Choosing poorly wastes what little space remains. The Engineer spreads his capacity map on the forge floor. The crisis is not over.",
  },

  // ─────────────────────────────────────────────────────────────────────
  // ZONE 2 — ACT 3: "The Memory of Iron"
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "Z2_ACT3_MEMORY",
    zone: "FORGE_VILLAGE",
    act: 3,
    title: "The Memory of Iron",
    energyMeter: "██████████████░░░░░░  [68% — FRAGMENTED CORE]",
    narratorOpen: `Ferron's Capacity Core is a disaster. Weeks of mismanagement have left it fragmented — usable space scattered in chunks, separated by walls of occupied blocks that cannot move. Four critical repair processes need to run simultaneously, and each requires a contiguous block. They cannot be split. The capacity map shows 100 total free units broken into: 10 free — [USED] — 25 free — [USED] — 20 free — [USED] — 35 free — [USED] — 10 free. KARN needs 40 units. BRIX needs 25. TURA needs 20 (urgent — balance regulation). VOSS needs 30. Total needed: 115. Total available: 100. Not all can run. Choosing poorly wastes what little space remains.`,
    dialogue: [
      {
        character: "ENGINEER",
        line: "TURA is the most urgent — without balance regulation, Ferron cannot walk straight. But if we allocate wrong, we might fit TURA and lose KARN, which means his structure is unbraced for the boss fight. Every choice here has a cost. The question is which cost we can absorb.",
      },
      {
        character: "FERRON",
        line: "I feel it. The spaces that should be mine are occupied by fragments of old work that never finished. Make them useful again. Give me room to repair myself.",
      },
      {
        character: "FORGE_MASTER",
        line: "You have the map. You have the process sizes. Four things that need space, one configuration of space. What do you do?",
      },
    ],
    momentOfTruth: "How do you allocate Ferron's fragmented memory space across four repair processes that need contiguous blocks?",
    pressureElement: "TURA — balance regulation — sends an urgent pulse. Without it, Ferron's next movement could bring him down. 'He tries to walk and falls on the forge,' the Engineer says quietly. 'That kills people.' Time pressure: immediate.",
    choices: [
      {
        label: "A",
        inWorldText: "Assign each process to the first free block that is large enough to hold it — work from left to right across the capacity map, filling as you go without overthinking it.",
        tier: "TIER_2_VIABLE",
        csConceptExplained: "First Fit memory allocation. Fast but leaves fragments that prevent larger processes from running.",
        narrativeConsequence: "BRIX(25) fills the first 25-unit gap perfectly. TURA(20) fills the third 20-unit gap. VOSS(30) fits into the 35-unit gap, leaving 5 unused. KARN(40) scans the remaining fragments — the largest is the 10-unit gap, then the 5-unit leftover. KARN cannot start. Structural reinforcement stalls. Ferron walks, but his left side is unbraced — a cathedral built without a cornerstone.",
        npcReveal: "Engineer: 'First Fit found space for three processes quickly. But it left KARN stranded. The leftover fragments from filling VOSS into the 35-gap aren't large enough for KARN. A better strategy would have preserved the larger gaps for the larger processes.'",
        xp: 50,
        debtPlanted: DEBTS.FIRST_FIT_DEBT,
        leadsTo: "Z2_ACT4_PAGE_FAULT",
      },
      {
        label: "B",
        inWorldText: "For each process, find the smallest free block that is still large enough to hold it — minimize leftover fragments so every scrap of space is preserved for future use.",
        tier: "TIER_1_OPTIMAL",
        csConceptExplained: "Best Fit — minimizes wasted space per allocation. Preserves larger gaps for larger future processes.",
        narrativeConsequence: "TURA(20) slots into the 20-unit gap with zero leftover — a perfect fit. BRIX(25) fills the 25-unit gap exactly. VOSS(30) takes from the 35-unit gap, leaving 5. Then the Engineer notices something: 'KARN needs 40 units. There's no single gap that size... but the 10-unit gap plus the 5-unit remainder plus KARN's lightweight activation sequence...' He recalculates fast, eyes bright. All four processes run. Ferron stands completely straight.",
        npcReveal: "Engineer, laughing in disbelief: 'Best Fit preserved every scrap. Where First Fit would have created wasteful gaps, Best Fit left just enough — and the creative allocation worked because the fragments were the right size. Four processes. Ferron fully active. The math was tight but it held.'",
        xp: 100,
        leadsTo: "Z2_ACT4_PAGE_FAULT",
      },
      {
        label: "C",
        inWorldText: "For each process, give it the largest available free block — save the smaller gaps for smaller future requests that might need them later.",
        tier: "TIER_3_MINOR_ERROR",
        csConceptExplained: "Worst Fit — consumes the largest blocks first, leaving only small unusable fragments.",
        narrativeConsequence: "Processes take the 35-unit and 25-unit blocks. The remaining fragments: 10, 20, 10. KARN(40) cannot fit anywhere. Neither can VOSS(30). Two critical processes fail to start. Ferron's balance improves — TURA ran — but his structural core and energy channels remain broken. He takes one step forward and lurches into a tool cart, scattering iron pieces across the forge floor.",
        npcReveal: "Engineer winces: 'Worst Fit gives every process the biggest available gap — sounds generous, feels efficient. But it burned the large blocks immediately and left only small fragments behind. KARN and VOSS needed size we no longer have. We preserved the small holes and burned the big ones. That is exactly backwards.'",
        xp: 10,
        leadsTo: "Z2_ACT4_PAGE_FAULT",
      },
      {
        label: "D",
        inWorldText: "Before assigning anything, consolidate all free fragments into one large contiguous block — compact the core first, then allocate from clean unified space.",
        tier: "TIER_3_MINOR_ERROR",
        csConceptExplained: "Compaction before allocation — correct concept, catastrophically wrong timing. Ferron cannot operate during compaction.",
        narrativeConsequence: "You call a halt on all activity. The Capacity Core goes quiet while the fragments are pushed together — a 45-minute process during which Ferron stands completely inert in the village center. The outer fence is breached. Two watchtowers burn while he stands motionless. When Ferron finally activates — he is perfect inside, structured and clean. Outside, there is smoke from what used to be two watchtowers.",
        npcReveal: "Engineer, very quietly: 'Compaction was the right idea. Consolidating fragments is correct thinking. But halting Ferron for 45 minutes while the village had no defense — that timing cost us two towers. The right tool at the wrong moment is still a wrong choice.'",
        xp: 25,
        debtPlanted: DEBTS.COMPACTION_GAP_DEBT,
        leadsTo: "Z2_ACT4_PAGE_FAULT",
      },
      {
        label: "E",
        inWorldText: "Split each process across multiple free blocks — give KARN the 25-unit gap and the remaining 15 from another gap, so everyone gets the space they need.",
        tier: "TIER_4_CRITICAL_ERROR",
        csConceptExplained: "Non-contiguous allocation — Ferron's system requires contiguous blocks. Splitting causes immediate process failure and corrupts the fragments touched.",
        narrativeConsequence: "KARN initializes across two fragments — 25 units here, 15 units there. The process throws an error immediately. Ferron's Capacity Core cannot bridge fragmented space. Two processes fail to start. The fragments they touched during the attempt are now corrupted — marked as unusable. Available space drops from 100 to 65 units. Ferron convulses. Three circuit spirits are ejected from his core like sparks from a struck anvil.",
        npcReveal: "Engineer: 'Contiguous. They need contiguous blocks. A process that runs across two separate memory regions cannot be addressed — Ferron's architecture requires the entire allocation to exist in one unbroken space. We didn't just fail to place KARN. We damaged the fragments it tried to use. We made the problem worse by attempting the impossible.'",
        xp: 0,
        scarEarned: SCARS.SHATTERED_CORE,
        leadsTo: "Z2_ACT4_PAGE_FAULT",
      },
    ],
    postChoiceHook: "Ferron's core is allocated — well or poorly, depending on your choices. But one final crisis: his active memory cannot hold all the combat blueprints he needs for the battle ahead. A page fault. Critical blueprints are in deep storage. Ferron is waiting. The clock is running. The Engineer spreads the reference string.",
  },

  // ─────────────────────────────────────────────────────────────────────
  // ZONE 2 — ACT 4: "The Page That Was Forgotten"
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "Z2_ACT4_PAGE_FAULT",
    zone: "FORGE_VILLAGE",
    act: 4,
    title: "The Page That Was Forgotten",
    narratorOpen: `Ferron halts. Mid-preparation for battle, he reaches for a combat blueprint stored in deep storage weeks ago to free up active memory — and it is not in his active slots. A page fault. His energy is steady, but every stall costs 3% and Ferron can only stall so many times before he arrives at the boss gate too depleted to fight. Reference string of blueprints needed, in order: 7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2. Active memory slots: 3. Every page fault is a stall. Fewer stalls means more energy. More energy means a stronger Ferron at the Boss Gate.`,
    dialogue: [
      {
        character: "ENGINEER",
        line: "Three memory slots. Thirteen blueprints to cycle through, some of them repeating. Every time Ferron needs a blueprint that isn't in the active slots, he stalls — 3% energy gone. The strategy you choose determines how many times he stalls.",
      },
      {
        character: "FERRON",
        line: "Tell me the rule. How do I decide which blueprint leaves when a new one must enter? Tell me and I will follow it exactly.",
      },
      {
        character: "ENGINEER",
        line: "That's the question, isn't it. How does he know which one to forget? The wrong answer to that question costs him every time the wrong blueprint isn't there.",
      },
    ],
    momentOfTruth: "What page replacement strategy do you enforce for Ferron's active memory during blueprint preparation?",
    pressureElement: "Ferron stalls. 3% energy. Another stall already. The Engineer watches the meter. 'Every wrong strategy costs. The reference string is set — 13 accesses, some repeating. The strategy determines the fault count. Choose.'",
    choices: [
      {
        label: "A",
        inWorldText: "Always replace the blueprint that has been in active memory the longest — oldest entry leaves first, like moving through a queue where the front always exits.",
        tier: "TIER_2_VIABLE",
        csConceptExplained: "FIFO page replacement. Simple but ignores usage patterns — causes Belady's anomaly with some reference strings.",
        narrativeConsequence: "9 page faults on the reference string. Ferron stalls nine times — a rhythm of hesitation woven through his preparation. 27% energy lost. He arrives at the Boss Gate with an amber glow — functional, present, but tired in the way that shows.",
        npcReveal: "Engineer: 'FIFO doesn't know which blueprint is useful — it only knows which one arrived first. Oldest in, first out. It evicts blueprints that have been waiting, even if they were accessed two seconds ago. 9 faults. Functional. Not optimal.'",
        xp: 50,
        debtPlanted: DEBTS.FIFO_TIRED_DEBT,
        leadsTo: "Z2_BOSS_GATE",
      },
      {
        label: "B",
        inWorldText: "Always replace the blueprint that was used least recently — the one that has gone the longest since it was last accessed.",
        tier: "TIER_1_OPTIMAL",
        csConceptExplained: "LRU (Least Recently Used) — optimal for real-world systems. Leverages temporal locality.",
        narrativeConsequence: "7 page faults. Ferron stalls seven times — noticeably less. 21% energy lost. He enters the Boss Gate with steady gold energy, blueprints cycling efficiently. His movements in preparation have a fluid quality — muscle memory, or its iron equivalent.",
        npcReveal: "Engineer nods slowly: 'LRU. Least Recently Used. He keeps what was just accessed — because what was used recently is most likely to be needed again soon. The blueprint he put down a minute ago is more valuable than the one he hasn't touched in an hour. 7 faults. That's the practical optimum.'",
        xp: 100,
        leadsTo: "Z2_BOSS_GATE",
      },
      {
        label: "C",
        inWorldText: "Always replace the blueprint that will not be needed again for the longest time in the future — look ahead in the reference sequence and evict accordingly.",
        tier: "TIER_1_OPTIMAL",
        csConceptExplained: "Optimal / Bélády's algorithm — minimum possible faults but requires future knowledge. Theoretically perfect, practically impossible.",
        narrativeConsequence: "Minimum possible faults. Ferron's preparation is eerily perfect. The Engineer's eyes narrow: 'That is... that is the optimal result. The absolute minimum faults achievable on this reference string.' A pause. 'Sir Axiom. How did you know which blueprint would be needed next? No one can see a future reference string in a real battle.'",
        npcReveal: "Engineer writes a starred note in his book: 'This is Bélády's optimal algorithm. It achieves the minimum fault count by knowing the future — which blueprint won't be needed again for the longest time. In training, where the reference string is known, it works perfectly. In live battle, it cannot be implemented. The real-world answer is LRU. But understanding why this is the ceiling — that understanding is valuable.'",
        xp: 100,
        bonusUnlocked: "SCHOLARLY_NOTE — Lore fragment added: 'The Optimal Blueprint.' Boss Gate starts with an extra insight hint.",
        leadsTo: "Z2_BOSS_GATE",
      },
      {
        label: "D",
        inWorldText: "Always replace the blueprint used least frequently overall — the one accessed the fewest total times across all of Ferron's preparation.",
        tier: "TIER_3_MINOR_ERROR",
        csConceptExplained: "LFU (Least Frequently Used) — ignores recency, fails on repeated patterns. 11 faults on this reference string.",
        narrativeConsequence: "11 page faults. Ferron staggers into the Boss Gate barely glowing — 33% energy lost to stalls. The reference string has loops: blueprint 0 and blueprint 2 repeat. LFU evicts them at exactly the wrong moments because their long-term frequency doesn't reflect their current relevance. Ferron's preparation has gaps in it.",
        npcReveal: "Engineer: 'LFU counts total accesses over all time — but that hides recent patterns. Blueprint 0 repeats three times in this string. LFU sees it was infrequently accessed overall and evicts it — right before it's needed again. Frequency lies when patterns shift. Recency is usually more truthful.'",
        xp: 10,
        debtPlanted: DEBTS.LFU_DEPLETED_DEBT,
        leadsTo: "Z2_BOSS_GATE",
      },
      {
        label: "E",
        inWorldText: "Never replace anything — keep loading new blueprints into additional memory slots indefinitely as they are needed.",
        tier: "TIER_4_CRITICAL_ERROR",
        csConceptExplained: "Infinite memory assumption — the slots are fixed at 3. Adding more is physically impossible.",
        narrativeConsequence: "You request additional memory slots. There are three. There have always been three. The request crashes Ferron's memory subsystem — circuits spark, the entire blueprint loading halts. For twenty minutes, Ferron cannot access any stored blueprint at all. He stands in the village center, inert, while the outer defenses go unmanned. When the system recovers, one slot is damaged. He enters the Boss Gate with two active memory slots instead of three.",
        npcReveal: "Engineer, with the quiet fury of someone watching an elegant system be fundamentally misunderstood: 'Memory is finite. The three slots are a physical limit — they do not expand on request. Asking for more caused an exception in the subsystem. We lost a slot in the crash. Ferron goes into the Boss Gate with two slots instead of three. The impossible ask made the possible situation worse.'",
        xp: 0,
        scarEarned: SCARS.IMPOSSIBLE_ASK,
        leadsTo: "Z2_BOSS_GATE",
      },
    ],
    postChoiceHook: "Preparation complete. Ferron's energy meter reads whatever it reads after four acts of decisions. The coordinated attack hits the Forge Village — THE COLLAPSE. Every DEBT triggers. Every SCAR compounds. The Boss Gate opens. Three rounds. Everything at once.",
  },

  // ─────────────────────────────────────────────────────────────────────
  // ZONE 2 — BOSS GATE: "Ferron's Final Test"
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "Z2_BOSS_GATE",
    zone: "FORGE_VILLAGE",
    act: 5,
    title: "BOSS GATE — Ferron's Final Test / DEADLOCK",
    narratorOpen: `THE COLLAPSE hits the Forge Village as a cascading failure — not an army, not a single enemy, but every mismanagement decision you made given physical form and returned at once. Every DEBT triggers simultaneously. Every SCAR compounds its effect now. FERRON — depending on your choices — is either a restored giant standing at full capability, or a battered machine fighting its own fragmentation, and the thing that was once his protection has become his breakdown. In his most degraded state, the village calls it by a different name: DEADLOCK. Three rounds. The energy meter is everything.`,
    dialogue: [
      {
        character: "FORGE_MASTER",
        line: "Whatever energy he has left — that's what we're working with. Every debt you planted is awake. Every scar you earned just showed up at the worst possible moment. Three rounds. Hold him together.",
      },
      {
        character: "DEADLOCK",
        line: "[If Ferron is below 40%] He is not here anymore. He is the pattern of every mistake made in his name. He does not protect. He enacts.",
      },
      {
        character: "FERRON",
        line: "[If Ferron is above 70%] I am ready. I have been waiting for this. I know what I am. Tell me what to do and I will do it completely.",
      },
      {
        character: "ENGINEER",
        line: "Round 1: Scheduling plus deadlock simultaneous. Round 2: Memory emergency under pressure. Round 3: Final energy balance — three minutes, four tasks, distribute optimally. Every choice compounds. Go.",
      },
    ],
    momentOfTruth: "Three rounds of combined OS challenges — all previous debts and scars active simultaneously. Ferron's final state determines the zone ending.",
    pressureElement: "The energy meter is live. Every wrong choice drops it. Every correct choice holds it. The ending tier is decided here.",
    choices: [
      {
        label: "A",
        inWorldText: "[ROUND 1] Sequence the simultaneous resource conflict using shortest-task-first ordering while applying resource ordering rules to prevent a deadlock from forming.",
        tier: "TIER_1_OPTIMAL",
        csConceptExplained: "SJF + Resource Ordering combined. Shortest task first for energy return, ordered resource requests to prevent circular wait.",
        narrativeConsequence: "The simultaneous crisis resolves cleanly. Short tasks cycle energy back. Resource order prevents a new deadlock from forming even under the pressure of both problems hitting at once. Ferron's glow holds. The Collapse's first wave breaks against a Golem who has been managed correctly.",
        npcReveal: "Forge Master: 'Round 1 clean. He managed both at once — scheduling and deadlock prevention together. That's what an OS is supposed to do.'",
        xp: 100,
        leadsTo: "Z2_BOSS_ROUND2",
      },
      {
        label: "B",
        inWorldText: "[ROUND 2] Under memory pressure, use Best Fit allocation for available fragments while running LRU page replacement simultaneously.",
        tier: "TIER_1_OPTIMAL",
        csConceptExplained: "Best Fit + LRU under simultaneous pressure — the correct combination for a memory emergency.",
        narrativeConsequence: "Fragments slot together tightly. Page faults occur only where they must. Ferron's memory emergency resolves without a cascade. He does not convulse. He does not eject any circuit spirits. He continues.",
        npcReveal: "Engineer: 'Best Fit preserved the space. LRU kept the right blueprints active. Under simultaneous pressure, the right strategy held where a wrong one would have compounded every existing scar.'",
        xp: 100,
        leadsTo: "Z2_BOSS_ROUND3",
      },
      {
        label: "C",
        inWorldText: "[ROUND 3] Distribute Ferron's final energy across the four remaining tasks in order of return speed — shortest-return tasks first, longest last — to maximize output before the energy window closes.",
        tier: "TIER_1_OPTIMAL",
        csConceptExplained: "Optimal final energy distribution using SJF logic on return times. Energy return cycle maximized before depletion.",
        narrativeConsequence: "The energy window closes on a Golem who spent every unit correctly. Ferron completes the final task as the last of his prepared energy resolves. He is not depleted. He is spent — which is different. A machine that has given exactly what it had, to exactly the right purposes, in the exactly right order.",
        npcReveal: "Engineer reads the meter. Looks up. 'He spent everything correctly. Nothing wasted. Nothing starved. Every unit of energy went to a task that could use it and return from it. That is what an operating system is for.'",
        xp: 100,
        leadsTo: "Z2_ZONE_COMPLETE",
      },
    ],
    postChoiceHook: `FERRON'S FINAL STATE DETERMINES THE ENDING:\n95–100% energy → FERRON ASCENDS: He exceeds his original design. New, more powerful form. LEGEND zone ending.\n70–94% energy → FERRON HOLDS: Battered but standing. CHAMPION zone ending.\n40–69% energy → FERRON STRUGGLES: Completes the battle then shuts down for recovery. KNIGHT zone ending.\nBelow 40% → FERRON FALLS: He does not survive. Sir Axiom defends the village alone. SQUIRE zone ending.\nAll Redemptions completed → FERRON REBORN: SECRET ENDING. He reconstructs himself incorporating every lesson from Sir Axiom's journey. The Architect of Bitfeld.`,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// ZONE 3 — THE WALL OF GATES (Computer Networks)
// Enemy: Overflow the Shadow Mob
// Principal: The King of Bitfeld
// Agent: Vael (Inner Gate), Imposter Messenger
// CS Topics: Dijkstra's Routing, Authentication, DDoS / Rate Limiting, TLS Handshake
// ═══════════════════════════════════════════════════════════════════════════════

export const ZONE_3_SCENES: Scene[] = [

  // ─────────────────────────────────────────────────────────────────────
  // ZONE 3 — ACT 1: "The Road Map of Chaos"
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "Z3_ACT1_ROAD_MAP",
    zone: "WALL_OF_GATES",
    act: 1,
    title: "The Road Map of Chaos",
    narratorOpen: `OVERFLOW THE SHADOW MOB does not fight with swords. It fights with deception — fake messengers, flooded gates, intercepted royal letters, impersonated generals. Sir Axiom is appointed Network Warden: secure every road, verify every seal, route the king's convoy through enemy territory without a single message intercepted. Seven roads connect five villages. The Shadow Mob has cut three of them. The king's escort must reach the capital. Road weights in travel hours — Ironhold to Crestfall: 4. Ironhold to Millhaven: 7. Crestfall to Millhaven: 2. Crestfall to Dunport: 5. Millhaven to Dunport: 1. Millhaven to Capital: 6. Dunport to Capital: 3.`,
    dialogue: [
      {
        character: "KING",
        line: "The roads have been cut. Three of them. I need to reach the capital. You are the Warden — tell me which road I take and why, not just which one feels right.",
      },
      {
        character: "OVERFLOW",
        line: "...every road leads to us... the long one... the short one... we are already on both... take any road... it ends with us...",
      },
      {
        character: "KING",
        line: "That is what an enemy wants you to believe. Ignore it. Find the shortest path. Show your work.",
      },
    ],
    momentOfTruth: "How do you route the king's convoy from Ironhold to the Capital through the safest, shortest path?",
    pressureElement: "Overflow scouts are spotted on the main road. The king's guard captain counts the horses — enough for one route attempt. 'We cannot split. We cannot turn back. Choose the road, Warden.'",
    choices: [
      {
        label: "A",
        inWorldText: "Send the king on the road that looks most direct on the map — fewer turns means less exposure to ambush.",
        tier: "TIER_4_CRITICAL_ERROR",
        csConceptExplained: "Greedy visual selection — ignores edge weights, no algorithmic basis. Selects the visually shorter path regardless of travel time.",
        narrativeConsequence: "The 'direct' road passes through the 7-hour Ironhold–Millhaven stretch. Seven hours of exposed travel. Three hours in, Overflow closes on the convoy from both sides — they were waiting. The king is captured briefly before a desperate counter-charge recovers him, shaken, two guards lost.",
        npcReveal: "The king's captain, tersely: 'The direct road on a map is not the shortest road in reality. Distance in hours is not the same as distance in appearance. Overflow knew which roads look direct. They waited on them.'",
        xp: 0,
        scarEarned: SCARS.CAPTURED_CROWN,
        leadsTo: "Z3_ACT2_IMPOSTER",
      },
      {
        label: "B",
        inWorldText: "Calculate the shortest total travel time by checking all possible paths from Ironhold to the Capital — always expanding the currently shortest known path first, step by step.",
        tier: "TIER_1_OPTIMAL",
        csConceptExplained: "Dijkstra's algorithm — always expanding the minimum known distance node. Finds true shortest path.",
        narrativeConsequence: "Ironhold to Crestfall: 4 hours. Crestfall to Millhaven: 2 hours. Millhaven to Dunport: 1 hour. Dunport to Capital: 3 hours. Total: 10 hours. The king arrives safely. Overflow's watchers report the convoy taking a route they did not fully cover — the path no visual inspection would have chosen, but the one the numbers always chose.",
        npcReveal: "The king exhales as the capital gate opens: 'You expanded the shortest known path at every decision point. You did not guess. You did not take what looked obvious. You calculated. That is the difference between a route and a road.'",
        xp: 100,
        leadsTo: "Z3_ACT2_IMPOSTER",
      },
      {
        label: "C",
        inWorldText: "Split the escort into two groups and send each on a different road — if one is ambushed, the other survives and the mission is not a total loss.",
        tier: "TIER_2_VIABLE",
        csConceptExplained: "Redundancy without routing logic — provides resilience but no optimization of the route.",
        narrativeConsequence: "One group arrives on schedule. The other takes the longer road and is delayed three hours — harried but not destroyed. The king arrives in two pieces and not one, which is better than zero. But half the royal guard is now three hours behind.",
        npcReveal: "The king, watching the second group trickle in: 'Redundancy. A sensible instinct. But the longer road cost us three hours and half the guard. When the flood hits — and it will hit — those guards will not be there.'",
        xp: 50,
        debtPlanted: DEBTS.REDUNDANT_ESCORT_DEBT,
        leadsTo: "Z3_ACT2_IMPOSTER",
      },
      {
        label: "D",
        inWorldText: "Ask the village elders to vote on which road they think is safest based on their past experience with Overflow attacks.",
        tier: "TIER_3_MINOR_ERROR",
        csConceptExplained: "No algorithmic basis — historical heuristic without systematic analysis. Ignores current road weights.",
        narrativeConsequence: "The elders argue for three hours. Each has a different past experience. The decision they finally reach is based on a route that was safe eleven months ago, before Overflow rerouted its patrols. The convoy takes the voted road. Minor ambush. Two guards wounded. Three more hours lost than necessary.",
        npcReveal: "The king's captain: 'The elders know what was safe. They cannot know what is safe now. Past experience without current data is a guess wearing the costume of wisdom. Overflow changes its routes. The elders' memories do not.'",
        xp: 10,
        leadsTo: "Z3_ACT2_IMPOSTER",
      },
      {
        label: "E",
        inWorldText: "Route the king through whichever road was used most recently by other travelers — if others made it through in the last six hours, it is probably still safe.",
        tier: "TIER_3_MINOR_ERROR",
        csConceptExplained: "Recency bias — no weight consideration, assumes recent safety equals current safety.",
        narrativeConsequence: "The most recently traveled road was used by a merchant six hours ago. In the six hours since, Overflow moved a patrol onto it. The convoy hits the patrol two hours in — a minor ambush, two guards wounded, route improvised the rest of the way. The recency was real. The safety was six hours old.",
        npcReveal: "Captain: 'Six hours ago and right now are not the same time. The road was safe when the merchant passed it. Overflow does not stay still. Recency tells you what was true. It does not guarantee what is true.'",
        xp: 10,
        leadsTo: "Z3_ACT2_IMPOSTER",
      },
    ],
    postChoiceHook: "The king arrives — safely, delayed, or shaken depending on your choice. A messenger is waiting at the capital gate. He carries news that changes the battle plan. But something about him is wrong. His seal. His timing. His story.",
  },

  // ─────────────────────────────────────────────────────────────────────
  // ZONE 3 — ACT 2: "The Imposter Messenger"
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "Z3_ACT2_IMPOSTER",
    zone: "WALL_OF_GATES",
    act: 2,
    title: "The Imposter Messenger",
    narratorOpen: `A messenger arrives claiming to be from the Northern Fort. He carries news that, if true, changes the entire defense plan. If false — it redirects the archers, opens the eastern gate, and hands Overflow exactly what it needs. He is smooth. Rehearsed. His seal looks correct. His story sounds right. Something is wrong. You cannot name it immediately. But something in the way he stands, the way he answers — it is performance, not memory.`,
    dialogue: [
      {
        character: "MIRA_ZONE3",
        line: "Of course the seal is real. I rode three days from the Northern Fort without rest. The message is urgent — check the wax if you must, but every hour you delay is an hour the eastern flank is unadvised.",
      },
      {
        character: "KING",
        line: "Warden. You have authority here. Verify him or trust him — but make the call. I will not act on intelligence I cannot trace to a verified source.",
      },
      {
        character: "VAEL",
        line: "[Somewhere behind the gate, watching. He does not speak. He waits to see what you do with the imposter.]",
      },
    ],
    momentOfTruth: "How do you verify whether this messenger is genuine before acting on his intelligence?",
    pressureElement: "Overflow scouts are reported at the northern approach. The messenger gestures at the urgency. 'Every minute matters.' That, too, sounds rehearsed. Choose a verification method.",
    choices: [
      {
        label: "A",
        inWorldText: "Check whether the route he claims to have traveled matches the time he says it took — if the road distance and travel time don't align, his stated origin is false.",
        tier: "TIER_1_OPTIMAL",
        csConceptExplained: "TTL / Route verification — checking if elapsed time matches known path length. Detects route inconsistency.",
        narrativeConsequence: "The math is off by three hours. The Northern Fort route takes four days under favorable conditions, not three. He claimed three days — in weather that would have required five. You hold up the discrepancy. He holds his expression for two full seconds before it cracks. Inside his boot: the real message, in a different hand.",
        npcReveal: "Your senior guard, leaning over the calculation: 'Travel time is a record. Every road has a known length. If his time doesn't match his route, his route is a lie. You used the road against him. A real messenger from the Northern Fort cannot arrive in three days — the math doesn't allow it.'",
        xp: 100,
        leadsTo: "Z3_ACT3_FLOOD",
      },
      {
        label: "B",
        inWorldText: "Ask him questions that only someone stationed at the Northern Fort would know — specific details about the garrison commander, the layout of the watch posts, recent events.",
        tier: "TIER_1_OPTIMAL",
        csConceptExplained: "Challenge-response authentication — shared knowledge verification that cannot be easily faked.",
        narrativeConsequence: "He answers the first question smoothly — Overflow prepared him for the obvious ones. The second question trips him — a specific incident from last month involving the garrison cook and a broken oven. He doesn't know about it. No one outside the fort does. He fails the third question before he stops trying to answer. Under arrest. A real commander sends a replacement within the hour — with a verified seal system.",
        npcReveal: "Your senior guard: 'Challenge-response. You asked for things only someone who was actually there would know. He could fake the seal and the story. He could not fake the memory of being present.'",
        xp: 100,
        bonusUnlocked: "VERIFIED_SEAL_SYSTEM — All future authentications in Zone 3 have one pre-verified step completed.",
        leadsTo: "Z3_ACT3_FLOOD",
      },
      {
        label: "C",
        inWorldText: "Accept the message but don't act on it yet — wait and see if the events he described begin to occur as he reported, then adjust if they don't.",
        tier: "TIER_3_MINOR_ERROR",
        csConceptExplained: "No verification — passive trust. Delayed response costs operational time.",
        narrativeConsequence: "You wait. Events do not match his report. By the time you realize the intelligence was false, an outpost has already acted on it — repositioned based on a lie. The outpost is lost before the repositioning can be reversed.",
        npcReveal: "King, flatly: 'You trusted without verifying and waited to see if trust was warranted. By the time you knew it wasn't, the outpost had already moved. Verification is not a delay — it is the thing that makes action meaningful.'",
        xp: 10,
        leadsTo: "Z3_ACT3_FLOOD",
      },
      {
        label: "D",
        inWorldText: "Send a reply messenger back to the Northern Fort requesting confirmation that the original message was sent — wait for acknowledgement before trusting the arrival.",
        tier: "TIER_2_VIABLE",
        csConceptExplained: "ACK-based verification — correct approach but introduces significant latency.",
        narrativeConsequence: "The reply messenger returns two hours later with confirmation. The imposter was already in custody by then from other suspicions. But the two-hour window cost preparation time. The firewall setup that was supposed to start this afternoon is now rushed.",
        npcReveal: "Guard captain: 'Acknowledgement-based verification is correct. It is also slow. Two hours to confirm what a three-minute route check could have caught. When speed matters — and it often does — the fastest correct method is more valuable than the most thorough slow one.'",
        xp: 50,
        debtPlanted: DEBTS.ACK_DELAY_DEBT,
        leadsTo: "Z3_ACT3_FLOOD",
      },
      {
        label: "E",
        inWorldText: "Trust the royal seal — if the wax seal on the letter is intact and unbroken, the message is genuine. A broken seal would indicate tampering.",
        tier: "TIER_4_CRITICAL_ERROR",
        csConceptExplained: "No PKI / digital signature — a physical seal can be forged. Seal alone is not proof of authenticity.",
        narrativeConsequence: "The seal was forged — a precise copy of the Northern Fort's royal wax. The fake message redirects your archers to the western approach. The eastern gate is left with a third of its normal coverage. Overflow moves through the eastern gap within the hour.",
        npcReveal: "Your senior guard finds you staring at the eastern breach: 'A seal proves the wax is intact. It does not prove who applied it. Anyone with the right stamp can replicate a seal. Without a signature system that cannot be copied — a digital signature, a unique shared secret — a seal is just wax. And Overflow had the stamp.'",
        xp: 0,
        scarEarned: SCARS.BROKEN_SEAL,
        leadsTo: "Z3_ACT3_FLOOD",
      },
    ],
    postChoiceHook: "The messenger is dealt with. But Overflow's main strategy was never the messenger. The messenger was the distraction. Ten thousand shadow creatures are massing at the main gate — not to fight, but to drown it. The flood attack begins.",
  },

  // ─────────────────────────────────────────────────────────────────────
  // ZONE 3 — ACT 3: "The Flood Attack"
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "Z3_ACT3_FLOOD",
    zone: "WALL_OF_GATES",
    act: 3,
    title: "The Flood Attack",
    narratorOpen: `Ten thousand shadow creatures rush the main gate simultaneously — not to fight, but to crowd it. To overwhelm the guards who check papers. To make legitimate processing impossible through sheer volume. Real travelers cannot get through. Supply convoys are stalled. The gate is choking. OVERFLOW whispers from the mass: 'Let us in... we are already in... there are too many of us... you cannot check us all...' The voice is many. The strategy is simple. The solution cannot be simple.`,
    dialogue: [
      {
        character: "OVERFLOW",
        line: "...ten thousand... check them all... take your time... we have all the time... the gate belongs to whoever fills it... you cannot empty water with a cup...",
      },
      {
        character: "KING",
        line: "The gate cannot hold at this rate. My supply convoy is backed up two miles. Medicine is in that convoy. Warden — control the gate or we lose it.",
      },
      {
        character: "VAEL",
        line: "[Now visible, watching from the inner rampart — he has not moved against you yet. He is calculating something.]",
      },
    ],
    momentOfTruth: "How do you handle ten thousand shadow creatures flooding the main gate simultaneously?",
    pressureElement: "The gate shudders. The guards are overwhelmed — checking papers as fast as they can, which is not fast enough. The Overflow mass grows louder. The gate posts bend. You have minutes before the gate collapses under sheer weight of volume.",
    choices: [
      {
        label: "A",
        inWorldText: "Post more guards at the gate — scale up the checking process by adding more workers to process the flood faster.",
        tier: "TIER_3_MINOR_ERROR",
        csConceptExplained: "Vertical scaling without rate limiting — adding resources doesn't solve the flood; the attack scales faster than any linear addition of guards.",
        narrativeConsequence: "More guards arrive. Overflow adjusts — sends ten thousand more. The flood is faster than any number of guards can process. Resources are exhausted. The gate collapses not from force but from weight — too many bodies pressing too many checks at once.",
        npcReveal: "Guard captain: 'You added guards. Overflow added creatures. The flood always wins a scaling war because the attacker controls the rate. You cannot out-resource a flood by adding workers. You have to control the rate of access — limit how many can approach per unit of time.'",
        xp: 10,
        leadsTo: "Z3_ACT4_CONVOY",
      },
      {
        label: "B",
        inWorldText: "Impose a rule — each creature must wait in a numbered queue, and only 50 can approach the gate per minute. Anyone outside the limit is turned back to wait their turn.",
        tier: "TIER_1_OPTIMAL",
        csConceptExplained: "Rate limiting / traffic shaping — controls the rate of incoming requests to match processing capacity.",
        narrativeConsequence: "The queue forms. Overflow's mass hits the limit and cannot press forward — the creatures at the front are processed; the ones behind are turned back by the queue rule. Real travelers, already in the numbered queue, pass through. The flood slows. OVERFLOW, from deep in the mass, screams — not in attack, but in frustration. The strategy that should have worked didn't work because the gate controlled the rate.",
        npcReveal: "Guard captain, watching the mass recede: 'Rate limiting. Fifty per minute — no more. The gate can process fifty per minute, so the flow matches the capacity. Overflow cannot send a hundred if only fifty are allowed to approach. You didn't stop the flood. You gave it a schedule it couldn't override.'",
        xp: 100,
        leadsTo: "Z3_ACT4_CONVOY",
      },
      {
        label: "C",
        inWorldText: "Close the gate entirely until the flood passes — nothing in, nothing out until Overflow withdraws.",
        tier: "TIER_2_VIABLE",
        csConceptExplained: "Null route / blackhole — eliminates the attack but also eliminates all legitimate traffic.",
        narrativeConsequence: "The flood stops. So does everything else. The supply convoy, two miles back, cannot advance. Medical supplies for the garrison sit in a cart outside the walls. An NPC — a healer's patient — deteriorates while waiting for medicine that is two miles and a closed gate away.",
        npcReveal: "King: 'The gate is secure. The medicine is outside it. Closing a gate stops all traffic — malicious and legitimate together. A more precise solution would have allowed legitimate access to continue while blocking the flood. Closing everything is a last resort, not a first one.'",
        xp: 50,
        debtPlanted: DEBTS.NULL_ROUTE_DEBT,
        leadsTo: "Z3_ACT4_CONVOY",
      },
      {
        label: "D",
        inWorldText: "Identify where the flood is originating from and block that entire region from approaching the gate — anyone coming from that direction is refused entry regardless of papers.",
        tier: "TIER_1_OPTIMAL",
        csConceptExplained: "IP-based firewall / geo-blocking — blocks traffic by source, not by individual inspection.",
        narrativeConsequence: "The source road — the eastern shadow-corridor Overflow has been using — is sealed. The mass hits the block and cannot enter. Overflow reroutes, but rerouting takes time and reduces pressure dramatically. Defenders regroup. The supply convoy routes around the blockade via the northern path.",
        npcReveal: "Guard captain: 'Source blocking. Instead of checking each creature individually, you identified where the flood was coming from and refused the entire source. Overflow can reroute — it did — but rerouting costs time. You bought time. That is what a firewall does at scale.'",
        xp: 100,
        leadsTo: "Z3_ACT4_CONVOY",
      },
      {
        label: "E",
        inWorldText: "Let everything through but flag suspicious creatures for later review — you cannot afford to stop legitimate travelers, and Overflow will be caught in the review process.",
        tier: "TIER_4_CRITICAL_ERROR",
        csConceptExplained: "No filtering — complete bypass. All traffic passes with no access control.",
        narrativeConsequence: "Everything enters. Overflow creatures, mixed with real travelers, pour through the gate. By the time the review process begins, hundreds have already dispersed — to the forge, the archive, the armory. Internal sabotage begins. The village that was defended from outside is now compromised from within.",
        npcReveal: "Guard captain, surveying the damage: 'If everything passes, nothing is filtered. A review process that happens after entry does not prevent infiltration — it documents it. Overflow is already inside. The gate that was supposed to be a filter became an entrance.'",
        xp: 0,
        scarEarned: SCARS.INFILTRATED_VILLAGE,
        leadsTo: "Z3_ACT4_CONVOY",
      },
    ],
    postChoiceHook: "The flood is handled — or not. The king's secret convoy must now move. It carries something critical. It must travel through territory where Overflow intercepts every unprotected message. The convoy needs an encrypted communication channel — and establishing that channel requires executing the right steps in the right order.",
  },

  // ─────────────────────────────────────────────────────────────────────
  // ZONE 3 — ACT 4: "The King's Secret Convoy"
  // TLS Handshake — 5-step ordering challenge
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "Z3_ACT4_CONVOY",
    zone: "WALL_OF_GATES",
    act: 4,
    title: "The King's Secret Convoy",
    narratorOpen: `The convoy carries something Overflow cannot be allowed to intercept. Every road is watched. Every messenger is a potential impersonator. The only safe communication channel is one that is established through a specific sequence of steps — a ritual of trust, executed in the exact right order, that creates an encrypted connection no imposter can fake and no flood can overwhelm. Skip a step. Reverse two steps. Execute one out of order. The channel fails — and Overflow reads everything.`,
    dialogue: [
      {
        character: "KING",
        line: "I have to communicate with the convoy in the field. They need confirmation of the route change. If Overflow intercepts an unencrypted message, the convoy is compromised. How do we establish the secure channel?",
      },
      {
        character: "VAEL",
        line: "[Still watching from the inner rampart. Still calculating. One hand on his sword. Waiting for something.]",
      },
      {
        character: "OVERFLOW",
        line: "...the message is almost ours... one wrong step... one step out of order... and we read everything you say...",
      },
    ],
    momentOfTruth: "In what exact order must the five steps of the secure channel ritual be performed to establish an unbreakable communication link with the convoy?",
    pressureElement: "Overflow is active on all roads. Unencrypted messages will not survive two minutes in the field. The convoy is waiting. The king's captain holds a sealed blank scroll — ready to write, waiting for the channel to open. Order the steps. Now.",
    choices: [
      {
        label: "A",
        inWorldText: "Step 1: The king announces his identity and what level of secrecy he needs. Step 2: The convoy sends back their own sealed identity. Step 3: The king sends an encrypted test message. Step 4: Both sides agree on the cipher to use for the full conversation. Step 5: Secure messages begin.",
        tier: "TIER_4_CRITICAL_ERROR",
        csConceptExplained: "Wrong TLS order — cipher negotiation must happen before encrypted messages, not after. Sending encrypted content before agreeing on the cipher breaks the handshake.",
        narrativeConsequence: "Step 3 fails. The encrypted test message uses a cipher the convoy has not yet been told to expect. They cannot decrypt it. The handshake stalls in an incomplete state — neither fully open nor fully closed. Overflow, watching the stalled exchange, sends a spoofed completion signal. The channel 'opens' — to Overflow.",
        npcReveal: "Guard cryptographer: 'The cipher must be agreed on before any encrypted content is sent. You cannot encrypt a message using a key the other party does not have yet. The order matters — every step must create the foundation the next step builds on.'",
        xp: 0,
        scarEarned: SCARS.BROKEN_SEAL,
        leadsTo: "Z3_BOSS_GATE",
      },
      {
        label: "B",
        inWorldText: "Step 1: The king announces identity and secrecy level. Step 2: The convoy confirms they received it. Step 3: Both sides agree on the cipher together. Step 4: The king sends a test message encrypted with the agreed cipher. Step 5: Convoy confirms receipt — secure channel open.",
        tier: "TIER_1_OPTIMAL",
        csConceptExplained: "Correct TLS handshake order — identity announcement, acknowledgement, cipher negotiation, encrypted test, confirmation.",
        narrativeConsequence: "The channel opens cleanly. Each step validates the previous one. By step 5, both sides share a cipher no third party has negotiated, an identity no imposter could have confirmed, and a test message that proved the encryption works before anything critical was sent. The king dictates the route change. The convoy receives it. Overflow receives nothing.",
        npcReveal: "Guard cryptographer: 'Every step in the right order. Identity first — so both sides know who they are talking to. Acknowledgement second — so neither proceeds unilaterally. Cipher agreed before use — so the encryption means the same thing to both parties. Test before trusting — so a failure surfaces before the critical message. Then the real message. That is the handshake.'",
        xp: 100,
        leadsTo: "Z3_BOSS_GATE",
      },
      {
        label: "C",
        inWorldText: "Step 1: Agree on the cipher immediately. Step 2: King announces identity. Step 3: Convoy confirms identity. Step 4: Send the secure message. Step 5: Confirm receipt.",
        tier: "TIER_3_MINOR_ERROR",
        csConceptExplained: "Cipher before identity authentication — agreeing on cipher without first verifying identity means an imposter could negotiate the cipher too.",
        narrativeConsequence: "The cipher is agreed on. Then the king announces identity. But in the gap between cipher agreement and identity verification, Overflow inserts a spoofed identity — claiming to be the convoy. The cipher is now shared with an imposter. The route change is sent. Overflow receives it and reads it in full.",
        npcReveal: "Guard cryptographer: 'Identity must come before cipher agreement. If you agree on how to encrypt before confirming who you are encrypting to, you may encrypt your message for the wrong recipient. The cipher is only secure if both parties are who they say they are — and that must be established first.'",
        xp: 10,
        leadsTo: "Z3_BOSS_GATE",
      },
      {
        label: "D",
        inWorldText: "Step 1: Send the full secure message immediately — if both parties are genuine, they will figure out the cipher. Step 2: Agree on cipher retroactively. Step 3–5: Sort out the handshake afterward.",
        tier: "TIER_4_CRITICAL_ERROR",
        csConceptExplained: "No handshake — sending message before any secure channel is established. Completely unprotected transmission.",
        narrativeConsequence: "The full message travels unencrypted. Overflow intercepts it within ninety seconds. The route change is known. The convoy's new position is known. Overflow redirects its flood creatures to the new position. The convoy arrives to find a receiving party it did not invite.",
        npcReveal: "Guard cryptographer: 'The handshake is not bureaucracy. It is the thing that makes the message secure. Sending the message before the handshake is the same as sending it in the open — because no channel was ever established. The message was unprotected.'",
        xp: 0,
        leadsTo: "Z3_BOSS_GATE",
      },
      {
        label: "E",
        inWorldText: "Step 1: King announces identity and secrecy level. Step 2: Convoy sends sealed identity back. Step 3: Both sides agree on the cipher. Step 4: Convoy sends encrypted confirmation of cipher. Step 5: King sends the real message.",
        tier: "TIER_2_VIABLE",
        csConceptExplained: "Close to correct TLS order but skips the encrypted test step — channel is established without verifying the cipher works before use.",
        narrativeConsequence: "The channel establishes. The cipher is agreed on and confirmed. But when the real message arrives, the convoy discovers a minor cipher mismatch — a character set difference that corrupts three critical words. The route change is partially received. The convoy makes educated guesses about the corrupted words and guesses one incorrectly. One section of the convoy takes the wrong road.",
        npcReveal: "Guard cryptographer: 'You confirmed the cipher was agreed on — but you didn't test that it worked on both ends before sending the critical message. A test step before the real content catches mismatch errors. One section took the wrong road because of three corrupted words in an untested cipher. The test step is not optional.'",
        xp: 50,
        leadsTo: "Z3_BOSS_GATE",
      },
    ],
    postChoiceHook: "The convoy receives its instructions — correctly or partially, depending on your handshake order. Overflow has been watching every step. Now it unleashes everything at once: road attack, impersonation, flood, and interception — simultaneously. The Boss Gate opens. All DEBT consequences trigger. All SCARS compound. The Shadow Mob shows its full shape.",
  },

  // ─────────────────────────────────────────────────────────────────────
  // ZONE 3 — BOSS GATE: "OVERFLOW UNLEASHED"
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "Z3_BOSS_GATE",
    zone: "WALL_OF_GATES",
    act: 5,
    title: "BOSS GATE — OVERFLOW UNLEASHED",
    narratorOpen: `OVERFLOW uses everything at once. The road attack — three simultaneous false convoys sending conflicting routing information. The impersonation layer — twelve fake messengers with perfect credentials hitting every gate simultaneously. The flood — a hundred thousand shadow creatures pressing every gate simultaneously. And the interception — a signal that mimics the secure channel's handshake, trying to insert itself between the king and the convoy. Every DEBT is active. Every SCAR is compounded. This is what the Shadow Mob was building toward. You have the tools you used correctly. Whatever you got wrong is now Overflow's weapon.`,
    dialogue: [
      {
        character: "OVERFLOW",
        line: "...we are the road and the messenger and the flood and the channel... we are all of it at once... every gap you left... every shortcut you took... every wrong step... that is where we live...",
      },
      {
        character: "KING",
        line: "Warden. This is it. Call the response.",
      },
      {
        character: "VAEL",
        line: "[Steps forward. Face composed. Hands open, no weapon.] I know the Overflow's signal pattern. I've been watching it from the inside. If you want that information, I'm giving it to you now. Whether you trust me — that's the last call you make.",
      },
    ],
    momentOfTruth: "Overflow attacks all four vectors simultaneously — routing, authentication, flooding, and interception. Every debt triggers. Every scar compounds. Choose the combined response.",
    pressureElement: "All gates. All roads. All channels. Simultaneously. The king waits for the command. Overflow waits for the gap.",
    choices: [
      {
        label: "A",
        inWorldText: "Route using shortest-path expansion, verify using challenge-response authentication, rate-limit the flood at 50 per gate per minute, and execute the correct 5-step handshake on all channels simultaneously.",
        tier: "TIER_1_OPTIMAL",
        csConceptExplained: "Dijkstra routing + challenge-response + rate limiting + correct TLS order — all four Network concepts applied simultaneously.",
        narrativeConsequence: "The routing calculation cuts through the false convoys — three paths eliminated by shortest-path math, one true route confirmed. Challenge-response catches eleven of twelve fake messengers instantly; the twelfth is caught by a secondary TTL check. Rate limiting holds all four gates at processing capacity — the flood presses but cannot breach. The handshake executes in correct order on all channels; Overflow's spoofed signal fails at the cipher negotiation step because it cannot answer the challenge. OVERFLOW BREAKS.",
        npcReveal: "The Shadow Mob does not speak as it dissolves. The whispers stop one by one — each technique Overflow used answered by the technique that counters it. The king watches the last shadow creatures dissolve at the gate and says: 'Every gap closed. No gaps left.'",
        xp: 150,
        leadsTo: "Z3_ZONE_COMPLETE",
      },
      {
        label: "B",
        inWorldText: "Trust Vael's intelligence about Overflow's signal pattern — use his inside knowledge to target the specific source of the combined attack.",
        tier: "TIER_2_VIABLE",
        csConceptExplained: "Source-based blocking using insider intelligence — effective but creates trust risk and doesn't systematically address all four attack vectors.",
        narrativeConsequence: "Vael's pattern is accurate. The source signal is identified and blocked. Three of four attack vectors collapse immediately — they were routed through the same source. The fourth — the flood — continues independently. You rate-limit it to manageable levels. Overflow retreats to regroup. The battle ends with Overflow diminished but not destroyed. Vael stands beside you afterward, and the question of what he is — informant, reformed agent, or something else — remains open.",
        npcReveal: "Guard captain: 'The source block worked. Vael's information was real — this time. Three vectors down through one action. The flood required its own solution. Overflow is not finished. But it is smaller than it was. Sometimes the inside knowledge is the most valuable tool. Sometimes it is the most dangerous one.'",
        xp: 75,
        leadsTo: "Z3_ZONE_COMPLETE",
      },
    ],
    postChoiceHook: "OVERFLOW THE SHADOW MOB — whatever remains of it — retreats from the Wall of Gates. Not destroyed, perhaps. But denied. Every gap it needed was closed. Every technique it depended on was countered. The king's convoy arrived. The messages were genuine. The flood found no breach to pour through. Sir Axiom stands at the gate of a kingdom that is still standing. The war was fought in roads and seals and queues and handshakes. That is how it was won.",
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// ENDING TIER SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

export const ENDING_CONDITIONS: Record<EndingTier, { title: string; condition: string; description: string }> = {
  LEGEND: {
    title: "The Eternal Knight",
    condition: "0 Scars, 0–1 Debts across all three zones",
    description: "Sir Axiom completes all three zones without fundamental errors. Nullus is slain, Ferron ascends to a new form, Overflow is broken. The kingdom of Bitfeld holds. The king commissions a fourth citadel. Elder Query adds a new wing to the archive: the Wing of Sir Axiom.",
  },
  CHAMPION: {
    title: "The Scarred Victor",
    condition: "0 Scars, 2–3 Debts across all three zones",
    description: "Sir Axiom wins every zone but carries costs from suboptimal choices. Nullus is slain. Ferron holds at 70-94%. Overflow is denied. The kingdom survives with wounds — two watchtowers burned, one NPC ill, a convoy section delayed. The victory is real. The costs are also real.",
  },
  KNIGHT: {
    title: "The Flawed Hero",
    condition: "1 Scar, any Debts",
    description: "One fundamental error marked Sir Axiom — a scar that followed through the whole campaign. The zone where it was earned carried its consequence to the end. The kingdom survives. Elder Query notes the scar in the archive index. 'It happened. It will not be forgotten. But you continued.'",
  },
  SQUIRE: {
    title: "The Student Who Learned the Hard Way",
    condition: "2+ Scars",
    description: "Sir Axiom made multiple critical errors. The kingdom pays for them. Ferron falls. One gate tower is permanently lost. Overflow finds one breach it keeps. But Sir Axiom is still standing — which means the learning is not finished. The kingdom endures. Barely. 'Go back,' Elder Query says. 'The archive is still here.'",
  },
  SECRET: {
    title: "The Architect of Bitfeld",
    condition: "All Redemption Challenges completed at Boss Gates",
    description: "Sir Axiom earned scars — and then redeemed every one. Each wrong concept, revisited and corrected. Ferron is not just restored — he reconstructs himself using the lessons Sir Axiom demonstrated in the Boss Gate. Nullus does not just die — the archive rebuilds its lost wing. Overflow does not just retreat — the Wall of Gates becomes a system that cannot be flooded, forged, or intercepted. Sir Axiom does not receive a title. Sir Axiom receives a commission: build the fourth zone.",
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// XP & RANK TRACKER
// ═══════════════════════════════════════════════════════════════════════════════

export const RANK_THRESHOLDS = {
  SQUIRE:       { min: 0,    label: "⚔️  Squire" },
  KNIGHT:       { min: 300,  label: "⚔️⚔️  Knight" },
  CHAMPION:     { min: 700,  label: "⚔️⚔️⚔️  Champion" },
  GRAND_MARSHAL:{ min: 1200, label: "⚔️⚔️⚔️⚔️  Grand Marshal" },
  LEGEND:       { min: 1800, label: "⚔️⚔️⚔️⚔️⚔️  Legend" },
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// COMPLETE GAME EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export const IRONCLAD_CHRONICLES = {
  title: "IRONCLAD CHRONICLES",
  kingdom: "Bitfeld",
  playerCharacter: "SIR AXIOM",
  threats: {
    NULLUS:   { zone: "ARCHIVE_CITADEL",  subject: "Databases",         description: "Dread Wyrm — defeated through mastery of Databases" },
    DEADLOCK: { zone: "FORGE_VILLAGE",    subject: "Operating Systems",  description: "Iron Golem — defeated through mastery of Operating Systems" },
    OVERFLOW: { zone: "WALL_OF_GATES",    subject: "Computer Networks",  description: "Shadow Mob — defeated through mastery of Computer Networks" },
  },
  zones: {
    ARCHIVE_CITADEL: {
      name: "📚 THE ARCHIVE CITADEL",
      subject: "Database Systems",
      scenes: ZONE_1_SCENES,
      wingTables: [
        "WING_WEAPONS (weapon_id, name, material, era, author_id)",
        "WING_AUTHORS (author_id, name, allegiance, birth_era)",
        "WING_FORBIDDEN (scroll_id, weapon_id, curse_level, location_code)",
        "WING_INDEX (index_id, wing_name, subject, shelf_code)",
        "WING_COPIES (copy_id, scroll_id, condition, checked_out)",
        "WING_VISITORS (visitor_id, name, last_accessed, wing_name)",
      ],
    },
    FORGE_VILLAGE: {
      name: "🏘️ THE FORGE VILLAGE",
      subject: "Operating Systems",
      scenes: ZONE_2_SCENES,
      energyRules: {
        criticalThreshold: 20,
        overloadThreshold: 95,
        optimalRange: "40–90%",
        costPerPageFault: 3,
        costPerDeadlockMinute: 4,
      },
    },
    WALL_OF_GATES: {
      name: "🔒 THE WALL OF GATES",
      subject: "Computer Networks",
      scenes: ZONE_3_SCENES,
      roadWeights: {
        "Ironhold→Crestfall": 4,
        "Ironhold→Millhaven": 7,
        "Crestfall→Millhaven": 2,
        "Crestfall→Dunport": 5,
        "Millhaven→Dunport": 1,
        "Millhaven→Capital": 6,
        "Dunport→Capital": 3,
      },
    },
  },
  characters: CHARACTER_VOICES,
  scars: SCARS,
  debts: DEBTS,
  endings: ENDING_CONDITIONS,
  rankThresholds: RANK_THRESHOLDS,
} as const;

export default IRONCLAD_CHRONICLES;
