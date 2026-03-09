/**
 * ARCHIVE_CITADEL — Zone 1 storyline from Ironclad Chronicles.
 * Self-contained component: narrator + dialogue → sceneText; momentOfTruth → question; choices with consequences.
 */

import type { StoryAct, SceneLine } from "@/lib/story-data";

const CHAR_NAMES: Record<string, string> = {
  NARRATOR: "Narrator",
  SIR_AXIOM: "Sir Axiom",
  ELDER_QUERY: "Elder Query",
  NULLUS: "Nullus",
};

function makeLines(
  narratorOpen: string,
  dialogue: { character: string; line: string }[]
): SceneLine[] {
  const lines: SceneLine[] = [{ type: "narrator", text: narratorOpen }];
  for (const { character, line } of dialogue) {
    const name = CHAR_NAMES[character] ?? character;
    if (line.startsWith("[") && line.endsWith("]")) {
      lines.push({ type: "narrator", text: line.slice(1, -1) });
    } else {
      lines.push({ type: "character", name, text: line });
    }
  }
  return lines;
}

export const ARCHIVE_CITADEL_ACTS: StoryAct[] = [
  // ─── ACT 1: The Index of Shadows ─────────────────────────────────────
  {
    actNumber: 1,
    title: "The Index of Shadows",
    mood: "calm",
    lines: makeLines(
      "The Archive Citadel rises before you like a mountain of frozen thought — ten million tomes stacked behind its stone walls, catalogued by a system so old even the walls remember it. The weapon that slays Nullus the Dread Wyrm is in here. Somewhere. Elder Query — blind scholar, keeper of every seal and shelf — cannot walk you to it. He can only describe. You must learn to speak his language, and quickly. Outside, Nullus tests the outer wall. You can hear it. Low. Rhythmic. Patient. It has been waiting a very long time.",
      [
        { character: "ELDER_QUERY", line: "The weapon that slays Nullus was forged by a traitor. Their name carries the shadow of death — 'Mord' in the old tongue. The weapon was made after the Third War. Begin with the authors, Sir Axiom. Begin with the names." },
        { character: "SIR_AXIOM", line: "[You stand before the six great Wings of the Archive. The wings stretch in every direction. Elder Query waits, head tilted, fingers resting on the index stone.]" },
        { character: "ELDER_QUERY", line: "The archive rewards precision. It punishes wandering. Ask the right question and the shelves answer. Ask the wrong one and you will still be walking when the wyrm has taken the last tower." },
        { character: "NULLUS", line: "[From outside, a low reverberation. One gate tower cracks. Dust falls from the archive ceiling.]" },
      ]
    ),
    question: "How do you search the archive for the author whose name contains 'Mord', forged after the Third War?",
    choices: [
      {
        id: "A",
        text: "Search every wing one by one, reading all scrolls until you find any mention of 'Mord' anywhere in the archive.",
        tier: 4,
        xp: 0,
        consequence: "You begin at the first shelf. The archive is vast — incomprehensibly vast. An hour passes. Two. You find mentions of 'Mord' in cooking recipes, in weather records, in a travelogue about a village called Mordwick. Elder Query stands motionless, listening to your footsteps grow more frantic. Outside, a sound like thunder. Not thunder. Nullus has taken the eastern gate tower. It is gone.\n\nElder Query speaks without turning: 'You searched everywhere and found nothing useful. The archive does not reward wandering — it punishes it. A name searched in parts of names, narrowed to a time, returned in one breath. You searched with your feet instead of your mind.'",
        scar: { name: "The Wandering Eye", description: "Nullus attacks the outer wall while you are lost in the archive. One gate tower falls. Boss gate gains an additional challenge round." },
      },
      {
        id: "B",
        text: "Ask Elder Query to list all authors whose names contain 'Mord' anywhere — beginning, middle, or end — then show them sorted by the era they worked in.",
        tier: 1,
        xp: 100,
        consequence: "The index stone hums. Elder Query's fingers trace the air and three names rise in the dust — clear, ordered, glowing faintly at the edges. Mordekath the Exile. Asmorden the Blind. Vordmun of the Third Age. The archive exhales. The shelves around you settle. Something that was tightening in the ceiling beams — releases.\n\nElder Query says quietly: 'The index serves those who ask precisely. A name searched with wildcard — partial match, both sides — returns what is hidden inside other names. Sorted by era, the Third War author rises to the top. You spoke the archive's language, Sir Axiom.'",
      },
      {
        id: "C",
        text: "Find authors whose name is exactly and completely 'Mord' — full match only, so there are no false results from similar-sounding names.",
        tier: 3,
        xp: 25,
        consequence: "The index stone goes quiet. Zero names surface. The dust settles with nothing written in it. You return to Elder Query empty-handed. A guard near the western entrance glances at you with poorly concealed contempt. Thirty minutes. Gone. The wyrm does not wait.\n\nElder Query sighs — long, deliberate. 'You searched too narrow, Sir Axiom. The shadow hides in parts of names, not whole names. Mordekath is not called Mord. Asmorden is not called Mord. The name must be searched with open ends — here, and here — to catch what hides inside other words.'",
        scar: { name: "The Empty Hand", description: "Zero results returned. You report back empty-handed. 30 minutes lost. Nullus inches closer." },
      },
      {
        id: "D",
        text: "Pull all weapons forged after the Third War first, then separately find all authors with 'Mord' in their name, and manually match them yourself by cross-referencing both lists.",
        tier: 2,
        xp: 60,
        consequence: "You find the author. Mordekath the Exile. His name appears in WING_AUTHORS, and one of his weapons appears in WING_WEAPONS post-Third War. But finding this took four hours — four hours of you carrying scrolls back and forth, matching seal numbers by hand on the floor of the archive. Elder Query says nothing the entire time. He just listens.\n\nAs you finally confirm the name, Elder Query speaks: 'The connection between author and weapon is a relationship sealed in this archive — weapon_id links them. You could have asked me to find both together in one breath. Instead you matched by hand. We found the truth. But the cost was time, and time is the one thing Nullus does not need more of.'",
        debt: { name: "Manual Match", description: "You found the author but spent 4 hours matching by hand instead of using a JOIN.", triggersAt: "Boss Gate" },
      },
      {
        id: "E",
        text: "Ask Elder Query to show every book ever checked out by visitors in the last 100 years — if you trace what was popular, you can find the famous weapon.",
        tier: 3,
        xp: 25,
        consequence: "The index stone surfaces a vast scroll of names. Visitors. Thousands of them. Merchants, scholars, pilgrims, children dragged to the archive by their tutors. None of it connects to any weapon, any author, any curse. A young guard leans over your shoulder and snorts. 'Those are the library's borrowing records.' You have spent thirty minutes generating a list of tourists.\n\nElder Query pinches the bridge of his nose. 'The visitors wing holds who has been here, not what they sought. You needed the authors wing — names, eras, allegiances. Different shelf. Very different question. The archive has six wings for a reason, Sir Axiom. The right question must find the right wing first.'",
        scar: { name: "The Fool's Errand", description: "You wasted time digging through visitor logs." },
      },
    ],
  },

  // ─── ACT 2: The JOIN of Fates ────────────────────────────────────────
  {
    actNumber: 2,
    title: "The JOIN of Fates",
    mood: "tense",
    lines: makeLines(
      "Three candidate tomes found — but each is split across two wings. The weapon's true name lives in WING_WEAPONS. The curse that makes it lethal to Nullus lives in WING_FORBIDDEN. They share one common seal: weapon_id. But there is a complication. One of the forbidden scrolls has a weapon_id that no longer exists in WING_WEAPONS — it was destroyed in a fire a century ago. Elder Query tells you this without emotion, as if fires that consume irreplaceable records are simply a category of event he has filed appropriately.",
      [
        { character: "ELDER_QUERY", line: "The weapon and its curse are in separate wings. They must be brought together. The seal they share — weapon_id — is the connection. But one connection in the cursed wing has no partner in the weapon wing. That record burned. It is ash. Whatever you retrieve from that pairing will be nothing." },
        { character: "SIR_AXIOM", line: "[You study the two wings. WING_WEAPONS on the left. WING_FORBIDDEN on the right. The connection is there — but how you combine them determines what you get.]" },
        { character: "ELDER_QUERY", line: "Ask well, Sir Axiom. The wrong combination will flood you with noise, or pull you toward a record that no longer has a body to stand on." },
      ]
    ),
    question: "How do you combine WING_WEAPONS and WING_FORBIDDEN to find the one weapon that is both real and cursed?",
    choices: [
      {
        id: "A",
        text: "Retrieve only the weapons that have a matching curse entry — if there is no curse record for a weapon, ignore it entirely.",
        tier: 1,
        xp: 100,
        consequence: "The index stone produces a clean, exact result. One weapon. One curse. They align perfectly on the parchment — weapon_id shared, seal intact, names matching. The cursed weapon glows faintly in the archive light. It has been waiting here for three hundred years to be correctly retrieved.\n\nElder Query stands very still. Then: 'You understand relationships, Sir Axiom. A weapon without a curse is not what you need. A curse without a weapon cannot harm a wyrm. You asked for only those with both — and that is exactly what the archive returned. This is the JOIN of matched purpose.'",
      },
      {
        id: "B",
        text: "Retrieve all weapons, and show each weapon's curse if one exists — but include the weapon in the results even if there is no curse record for it.",
        tier: 2,
        xp: 60,
        consequence: "The results come back heavy. Dozens of weapons, most with curse fields empty — blanks where no corresponding record exists. The true weapon is in there. But so are uncursed blades, ceremonial pieces, a training sword someone apparently stored in a forbidden wing by mistake. You nearly commit to the wrong tome before catching yourself.\n\nElder Query listens to you sifting through the results. 'You retrieved everything with a weapon record, cursed or not. The uncursed weapons clouded your view. The true blade is present — but you almost reached past it. A more precise join would have given you only what you needed.'",
        debt: { name: "Left Join Noise", description: "Uncursed weapons cluttered your results. You nearly picked the wrong tome.", triggersAt: "Act 3" },
      },
      {
        id: "C",
        text: "Retrieve all curse records regardless of whether a weapon still exists for them — show every curse entry in the forbidden wing, even orphaned ones.",
        tier: 3,
        xp: 25,
        consequence: "The results include a curse for a weapon that no longer exists — the destroyed one. You do not know it is destroyed. You walk to the shelf where it should be. The shelf crumbles when you touch it. The scroll behind it is ash. You have spent critical time pursuing a record whose physical form was consumed by a fire a century before you were born.\n\nElder Query speaks quietly from across the archive: 'That curse record is real. The weapon it references is not. A join that starts from the curse side retrieves every curse — including those whose weapons burned. You pulled a ghost, Sir Axiom. The archive contains both living records and the shapes of what was lost.'",
        scar: { name: "Ash and Dust", description: "A ruined shelf collapsed on you while chasing ghosts." },
      },
      {
        id: "D",
        text: "Retrieve every possible combination of weapons and curses — match every weapon to every curse entry to be completely thorough. Leave nothing unexamined.",
        tier: 4,
        xp: 0,
        consequence: "The index stone screams. Parchment erupts from the shelves — thousands of combinations, every weapon matched to every curse, cascading across the archive floor in a wave of meaningless pairings. Elder Query stumbles backward. Three shelves collapse under the weight of the generated results. A guard sprints toward the sound and trips over a rolling avalanche of scrolls. Outside, Nullus roars — not from attack but from recognition. It can feel the archive weakening.\n\nElder Query, when he recovers his footing, speaks with exhausted fury: 'You matched everything to everything. Every weapon with every curse. That is not thoroughness — that is chaos wearing the shape of effort. The archive is a system of relationships, not a pile of combinations. A cross-join does not search. It detonates.'",
        scar: { name: "The Flooded Archive", description: "Thousands of meaningless pairings flood the archive floor. Three shelves collapse. A guard is injured. Nullus grows visibly stronger." },
      },
      {
        id: "E",
        text: "Since weapon_id is shared between both wings, manually read both wings and match them yourself by eye — safer than trusting the seal system to handle it automatically.",
        tier: 2,
        xp: 60,
        consequence: "You sit on the archive floor and begin. Left wing. Right wing. Cross-reference by seal number. It is slow and your eyes start to blur after the second hour. You match them correctly — the weapon and its curse align, the orphaned curse record gets skipped because you can see the corresponding shelf is empty. But the process takes everything the clock had left.\n\nElder Query does not say 'well done.' He says: 'You matched them. You were correct to skip the empty shelf. But you used your eyes where the seal system could have done it in one breath. When the next choice comes — and it will come — you will have less time than you do now because you spent it here on the floor.'",
        debt: { name: "Brute Force Join", description: "You matched wing data manually instead of using any JOIN.", triggersAt: "Boss Gate" },
      },
    ],
  },

  // ─── ACT 3: The Cursed Duplicates ─────────────────────────────────────
  {
    actNumber: 3,
    title: "The Cursed Duplicates",
    mood: "tense",
    lines: makeLines(
      "A saboteur planted three fake copies of the target tome. All four copies look identical — same binding, same seal, same weight in the hand. One is real. The real one was accessed exactly once — by the original author, the moment they finished writing it. The fakes have either never been accessed, or been accessed many times by the saboteur rehearsing the deception. The WING_VISITORS log holds every access. The WING_COPIES holds condition and copy_id. Everything you need is in the archive. The question is how you ask for it.",
      [
        { character: "ELDER_QUERY", line: "The real tome was touched once. Only once. By the hand that made it. The fakes were either never touched — placed here waiting — or touched many times by the one who placed them. The visitor log remembers every hand. Yours now to read." },
        { character: "SIR_AXIOM", line: "[Four identical tomes on the shelf. The WING_COPIES record shows them. The WING_VISITORS record shows every access. Somewhere in the data, one tome stands alone.]" },
        { character: "NULLUS", line: "[The outer walls vibrate. Low and continuous now. The wyrm is no longer testing. It is committed.]" },
      ]
    ),
    question: "How do you identify the single real tome — the one accessed exactly once — from the three decoys?",
    choices: [
      {
        id: "A",
        text: "Group all copies of the tome by their scroll_id, count how many times each was accessed in the visitor log, and show only the one that was accessed exactly once.",
        tier: 1,
        xp: 100,
        consequence: "One tome remains in the results. The others resolve into noise and fall away. It glows — not from magic but from being the correct answer in a sea of wrong ones, which is its own kind of light. The saboteur, watching from somewhere in the stacks, bolts. Elder Query hears the footsteps and says nothing. He is too busy weeping — quietly, precisely, without self-indulgence.\n\nElder Query composes himself and speaks: 'Grouped by identity. Counted by access. Filtered to exactly one. That is how truth separates from forgery in a system — not by how it looks, but by how it has been used. The real tome was touched once. You found the one that matches that truth precisely.'",
      },
      {
        id: "B",
        text: "Pull all copies and remove any that appear more than once in the visitor log — keep only the entries that are unique across the access records.",
        tier: 2,
        xp: 60,
        consequence: "You narrow the results to two tomes — both have unique visitor records. But one was accessed once legitimately, and one was never accessed at all — also unique, but for a different reason. You cannot determine from DISTINCT alone which is which. You grab both.\n\nElder Query says: 'Unique is not the same as once. A tome never touched is also unique in the visitor records — it appears zero times, not duplicated. You removed the frequently-touched fakes, which was right. But you kept the never-touched one alongside the real one. DISTINCT finds absence of repetition, not presence of exactly one touch.'",
        debt: { name: "Distinct Misapplied", description: "You narrowed to two copies instead of one — uncertain which tome is real.", triggersAt: "Boss Gate" },
      },
      {
        id: "C",
        text: "Sort all copies alphabetically by title and pick the first one — original copies are usually filed first, before duplicates are added.",
        tier: 4,
        xp: 0,
        consequence: "You grab the first tome. You open it. You read the incantation aloud. The archive goes silent — and then the wrong kind of thing happens. Instead of a weapon materializing, Nullus outside lets out something between a roar and a laugh. The wyrm does not flee. It glows brighter. You have read a counter-curse — one designed to give the wyrm partial healing if spoken inside the archive. You drop the tome. Your sword hand burns as if scorched from the inside.\n\nElder Query speaks with genuine pain in his voice: 'Alphabetical order is how a librarian files. It is not how truth is hidden or found. The archive does not place originals first. It places scrolls where they fit. You chose the first letter instead of the first touch. The incantation you read was a trap laid by the saboteur — placed at the beginning of the alphabet precisely because someone like you might guess exactly as you guessed.'",
        scar: { name: "The Burned Gauntlet", description: "You read the wrong incantation. Nullus partially heals. Your sword hand is weakened for the boss fight." },
      },
      {
        id: "D",
        text: "Pull all copies and manually inspect each scroll's physical condition — the real one is probably worn from the author's use, while the fakes would look newer.",
        tier: 3,
        xp: 25,
        consequence: "You check the condition field on all four copies. All four read: 'Good.' The archive preserves its scrolls obsessively — temperature-regulated stone, protective casings, quarterly restoration. A tome written three hundred years ago looks identical to one placed here last week. The condition field tells you nothing useful. A guard is pulled from the outer wall to help you look. The wall, briefly less defended, takes a hit.\n\nElder Query says: 'The archive preserves everything equally well. A three-hundred-year tome and a three-week forgery both read as Good condition here. You needed the visitor record — the access count — not the preservation record. The archive's strength is its maintenance. That strength became your blind spot.'",
        scar: { name: "The Weakened Wall", description: "A guard was pulled away because of your slow inspection." },
      },
      {
        id: "E",
        text: "Find all scroll entries where the copy appears in the visitor log exactly once AND the visitor who accessed it matches the author's name from WING_AUTHORS.",
        tier: 1,
        xp: 150,
        consequence: "The result emerges in seconds — clean as a blade pulled from cold water. One copy. One access. The visitor name matches: Mordekath the Exile, author, three hundred years dead. No other copy in the archive has this combination. The tome practically identifies itself. The saboteur, somewhere in the stacks, drops something heavy and runs.\n\nElder Query stands up. He does not stand up often. He is very old and it costs him something. He stands anyway and bows his head slowly. 'You joined the copies to the visitors to the authors. You filtered by count and by name. You asked for the only thing that could only be true: one touch, by the one who made it. Sir Axiom — the archive has never been read so well.'",
      },
    ],
  },

  // ─── ACT 4: BOSS GATE — The Living Index ──────────────────────────────
  {
    actNumber: 4,
    title: "BOSS GATE — The Living Index",
    mood: "danger",
    lines: makeLines(
      "Nullus does not attack the walls anymore. It has come inside. The Dread Wyrm fills the archive's central hall — its body of rotting parchment and corrupted data expanding to fill every shelf, every aisle, every gap between tomes. It speaks in malformed queries. It breathes out cascading NULL values. The weapon in your hand is the correct weapon — but Nullus knows every debt you owe and every scar you carry. It has been reading the archive too. Now, all previous DEBT consequences trigger simultaneously. Every shortcut, every wrong answer, every choice that planted a cost — the cost is due. Elder Query stands in the eye of it, hands raised, creating what silence he can. Three challenges. Everything at once.",
      [
        { character: "ELDER_QUERY", line: "It read what you left behind, Sir Axiom. Every imprecise query, every wasted hour, every crossed join — Nullus fed on the disorder. What you knew, and how well you knew it — that is your weapon now. Use it." },
        { character: "NULLUS", line: "You wander. You always wander. You searched everything and found nothing. You joined everything and broke three shelves. The archive remembers. I remember. NULL. NULL. NULL." },
        { character: "ELDER_QUERY", line: "Three challenges. The wyrm has layered the archive's own structure against you. Solve each one with precision and the weapon activates. One wrong step and Nullus absorbs another wing." },
      ]
    ),
    question: "Three consecutive archive challenges — each one drawing on the CS concepts from Acts 1–3. Every SCAR reduces your margin. Every DEBT triggers its consequence now. Precision is the only armor that matters here.",
    choices: [
      {
        id: "A",
        text: "[ROUND 1] Use a filtered search with partial name matching to isolate the one author record Nullus has corrupted inside the archive's living index.",
        tier: 1,
        xp: 100,
        consequence: "The corrupted record collapses. Nullus recoils — one layer of parchment scales falls away. The archive wing it consumed flickers and partially rebuilds. Elder Query exhales. The weapon in your hand vibrates.\n\nElder Query: 'Precise search. Wildcard open on both sides. The right wing, the right column, the right filter. You did not wander this time.'",
      },
      {
        id: "B",
        text: "[ROUND 2] Join the weapon and curse wings precisely — matching only the pairs where both records exist — to expose the core record Nullus is hiding inside.",
        tier: 1,
        xp: 100,
        consequence: "The join executes. Clean result. One pairing. Nullus's core record is exposed — the thing it was hiding inside the corrupted join noise. The wyrm screams. Pages fly. The correct weapon record materializes as a column of light inside the archive.\n\nElder Query: 'Only the matched pairs. Nothing extra. Nothing missing. The join served its purpose — it revealed what was hidden inside the relationship between two things.'",
      },
      {
        id: "C",
        text: "[ROUND 3] Group the final records by type, count occurrences, and surface only the record accessed exactly once — the one true record Nullus cannot fake.",
        tier: 1,
        xp: 100,
        consequence: "One record. One. It surfaces from the noise like a signal from deep underwater — singular, undeniable, correctly accessed exactly once, by the original author, at the beginning of time. Nullus does not heal it. Nullus cannot fake it. The weapon activates. You raise it. The Dread Wyrm understands what is about to happen.\n\nElder Query speaks for the last time in a voice that sounds relieved: 'Grouped. Counted. Filtered to one. The archive answered exactly as asked. Go, Sir Axiom. It is time.'",
      },
    ],
  },
];
