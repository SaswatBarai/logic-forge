/**
 * FORGE_VILLAGE — Zone 2 storyline from Ironclad Chronicles.
 * Self-contained component: narrator + dialogue → sceneText; momentOfTruth → question; choices with consequences.
 */

import type { StoryAct, SceneLine } from "@/lib/story-data";

const CHAR_NAMES: Record<string, string> = {
  FORGE_MASTER: "Forge Master",
  FERRON: "Ferron",
  ENGINEER: "Engineer",
  FERRO: "Ferro",
  ANVILA: "Anvila",
  DEADLOCK: "Deadlock",
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

export const FORGE_VILLAGE_ACTS: StoryAct[] = [
  // ─── ACT 1: The Scheduling Crisis ───────────────────────────────────
  {
    actNumber: 1,
    title: "The Scheduling Crisis",
    mood: "calm",
    lines: makeLines(
      "Ferron the Iron Golem stands frozen in the center of the Forge Village square — one arm raised mid-swing, locked mid-motion, like a statue of a moment that never finished. His chest cavity pulses with weak amber light. He is not broken. He is starving. Forge energy — the precise, regulated force that keeps him alive — has been mismanaged for weeks. Five urgent tasks are screaming for forge power simultaneously. The hearth foremen are arguing. Ferron's glow dims with each passing minute. You are the Forge Warden. You have one chance to set the order right.",
      [
        { character: "FORGE_MASTER", line: "Every task draws the same energy, Sir Axiom — but they don't all RETURN the same amount. Short tasks return energy fast. Long tasks hold it hostage. Ferron needs a steady flow — not a flood and not a drought. Regulate the order or we lose him." },
        { character: "FERRON", line: "I cannot coordinate. My arm will not complete its motion. Give me order. Without order I am only weight." },
        { character: "FORGE_MASTER", line: "Task A: 8 minutes — outer wall section. Task B: 2 minutes — sword sharpening. Task C: 4 minutes — gate hinges. Task D: 6 minutes — iron bolt casting. Task E: 1 minute — signal torches. One chance, Warden. How do they run?" },
        { character: "ENGINEER", line: "[Scribbling furiously in his notebook] The energy return cycle — it matters. Short tasks give back fast. That's the key. Feed him the small meals first and he can handle the large ones." },
      ]
    ),
    question: "In what order do you run the five forge tasks to stabilize Ferron's energy most efficiently?",
    choices: [
      {
        id: "A",
        text: "Run the tasks in the order the foremen originally requested them — Task A was requested first, so it runs first. Fairness means first come, first served.",
        tier: 3,
        xp: 10,
        consequence: "Task A begins. Eight full minutes of maximum draw. The quick tasks — E and B — wait in line, their energy returns locked behind the wall of Task A. Ferron's amber glow dims further to red. His frozen arm does not move. It trembles. The forge master grabs your sleeve and pulls.\n\nForge Master: 'Task A is bleeding him dry — the quick ones would have given him something back by now. You gave him a feast he couldn't swallow instead of feeding him small pieces first. FCFS. First come, first served. It sounds fair. It is not efficient. There is a difference.'",
        debt: { name: "Forge Delay", description: "Quick-return tasks waited while Task A bled Ferron dry. Ferron enters Act 2 weakened.", triggersAt: "Act 2" },
      },
      {
        id: "B",
        text: "Start with the shortest tasks first — run E (1 min) then B (2 min) then C (4 min) then D (6 min) then A (8 min) — get quick energy back into Ferron immediately, then build up.",
        tier: 1,
        xp: 100,
        consequence: "The signal torches go first — one minute, instant return. The swords follow — two minutes, energy surges back. Ferron's glow steadies. Then brightens. The amber deepens to gold. His frozen arm lowers. Slowly. Then with intention. He exhales a long breath of steam that fills the square and makes every watching villager take a step backward.\n\nForge Master claps once — her version of a standing ovation: 'There. You fed him the small meals first. He could process them, return from them, build from them. Shortest first. He gets something back before he has to give more. That is how you keep a Golem breathing.'",
      },
      {
        id: "C",
        text: "Assign each task exactly 2 minutes of forge time, then rotate to the next — every task makes some progress, nothing is starved, nothing monopolizes the forge.",
        tier: 2,
        xp: 50,
        consequence: "Every task starts. Every task progresses slightly. Nothing finishes for the first ten minutes. Ferron receives partial energy returns — not enough to stabilize, just enough to prevent an immediate drop. He stays in amber. He trembles. His footsteps are hesitant. The forge master watches the partial completions stack up and says nothing for a long time.\n\nForge Master, quietly: 'He's getting drips. But he needs a full drink. Every time we switch tasks before they finish, the forge has to remember where it was and start again. That remembering costs something. Equal time does not mean equal results, Sir Axiom.'",
        debt: { name: "Context Debt", description: "Round Robin interruptions cost Ferron more than they gave. One forge runs at reduced efficiency.", triggersAt: "Act 3" },
      },
      {
        id: "D",
        text: "Run the longest task first — get the heaviest energy drain out of the way early while Ferron still has reserves to absorb it.",
        tier: 4,
        xp: 0,
        consequence: "Task A runs. Eight minutes. Maximum draw. Zero return. Ferron's amber core does not hold. It goes grey. He drops to one knee. The stone of the village square cracks under his weight. His eyes — two ember-orange slots in an iron face — go dark. Villagers scatter. Children are pulled indoors. The massive arm that was raised mid-swing falls completely limp.\n\nEngineer drops his notebook: 'Longest first is the worst possible order. The short tasks — E is one minute, B is two — they would have given him energy back immediately. Instead he's been bleeding for eight minutes with nothing returned. He's in CRITICAL STATE.'",
        scar: { name: "The Cold Ember", description: "Ferron's left arm is permanently sluggish. All Act 3 memory tasks have reduced tolerance. Boss requires higher energy floor." },
      },
      {
        id: "E",
        text: "Start all five tasks simultaneously across the three forges — parallelism means faster overall completion and less waiting for any single task.",
        tier: 4,
        xp: 0,
        consequence: "All three forges ignite simultaneously. All five tasks begin drawing at the same moment. Ferron's hearths register the simultaneous draw and do the only thing they can — they spike. The energy doesn't distribute. It floods. Ferron doesn't freeze. He thrashes. His massive arm completes its swing in the wrong direction and destroys the forge master's workshop in one impact.\n\nEngineer, from behind a pillar: 'TOO MUCH at once! He can't regulate a spike that size — he burns what he can't use and then has nothing! You need synchronized, ordered access to the forges — not everything at once. That's not parallelism. That's a race condition. The forges raced each other and Ferron lost.'",
        scar: { name: "The Overburn", description: "Ferron's energy ceiling is permanently reduced. Acts 3 and 4 start in elevated fragility." },
      },
    ],
  },

  // ─── ACT 2: The Deadlock of the Twin Hearths ───────────────────────────
  {
    actNumber: 2,
    title: "The Deadlock of the Twin Hearths",
    mood: "tense",
    lines: makeLines(
      "Two of Ferron's internal energy regulators have deadlocked. FERRO controls the Hammer Circuit and is waiting for the Anvil Channel to open. ANVILA controls the Anvil Channel and is waiting for the Hammer Circuit to release. Both are holding. Neither is working. Ferron's left side and right side are completely unresponsive. He walks in circles — burning energy doing nothing. Idle conflict costs more than productive labor. The energy drains 4% per minute. You count: seven minutes until critical.",
      [
        { character: "FERRO", line: "I hold the Hammer Circuit. I wait for Anvila to release the Anvil Channel. That is what I do. I will wait." },
        { character: "ANVILA", line: "I hold the Anvil Channel. I wait for Ferro to release the Hammer Circuit. I will also wait. We will wait together. Forever, if we must." },
        { character: "ENGINEER", line: "They cannot yield on their own — it is not stubbornness. It is their design. They will hold until something changes from the outside. Seven minutes until Ferron hits critical. Each minute of deadlock costs 4%." },
        { character: "FORGE_MASTER", line: "Do something. I don't care what. Something that makes one of them move." },
        { character: "FERRON", line: "Left arm. Right arm. Neither answers. I am walking but I am not moving. I am burning but I am not working. This is what dying feels like for something made of iron." },
      ]
    ),
    question: "How do you break the deadlock between Ferro and Anvila before Ferron drains to critical?",
    choices: [
      {
        id: "A",
        text: "Force FERRO to immediately release the Hammer Circuit — take it from him and hand it to ANVILA so she can finish first, then FERRO gets it back.",
        tier: 2,
        xp: 50,
        consequence: "Anvila gets the circuit. Ferron's right side activates — he moves with sudden lopsided purpose, lurching to the right. But Ferro's half-configured channel is cold. Wiped. His side has to begin again from nothing. Ferron walks — unevenly, favoring his right, trailing his left arm slightly.\n\nEngineer: 'Preemption. You stripped the resource from Ferro mid-work and gave it to Anvila. The deadlock broke — that's real. But Ferro's incomplete work was lost. His channel starts over from nothing. He's running on one lung, as the Forge Master would say. It works. It costs.'",
        debt: { name: "Half Channel", description: "FERRO's channel was wiped to resolve the deadlock. Ferron runs on one lung.", triggersAt: "Boss Gate" },
      },
      {
        id: "B",
        text: "Establish a new rule: neither circuit spirit may hold their resource while waiting for another — they must release what they hold before requesting what they need.",
        tier: 1,
        xp: 100,
        consequence: "Both spirits receive the rule simultaneously. Ferro releases the Hammer Circuit. Anvila picks it up, completes her cycle, releases both. Ferro resumes. The coordination snaps back in seconds. Ferron's glow steadies to a warm, even gold. He takes one smooth, powerful step forward — and the ground shakes. Not from damage. From intent.\n\nEngineer stops writing and just stares: 'You broke the Hold-and-Wait condition. You didn't take anything from either of them. You changed the rule about how they ask. Neither holds while waiting — so neither can create the circle that traps them both. That's not fixing a deadlock. That's preventing the class of deadlock entirely.'",
      },
      {
        id: "C",
        text: "Wait — one of them will eventually realize the situation and yield on their own. Internal systems often self-correct. Do not intervene in the internal process.",
        tier: 4,
        xp: 0,
        consequence: "Seven minutes pass. They do not yield. They cannot yield — it is not stubbornness, it is their nature. Ferron's energy drains 4% per minute for seven uninterrupted minutes. He collapses to both knees. The village square cracks. Three other minor circuits, seeing the inaction, also stall — cascading deadlock across Ferron's entire system. His glow goes the color of old ash.\n\nEngineer, stricken: 'Deadlocked processes do not self-correct. They will wait literally forever — that is the definition of a deadlock. A system that waits for something that can never arrive without intervention. We needed to intervene. We didn't. Now we have a cascade. One deadlock became four.'",
        scar: { name: "The Long Wait", description: "Ferron's recovery from any future stall takes twice as long. Boss gate spawns an additional deadlock challenge." },
      },
      {
        id: "D",
        text: "Assign a third regulator spirit to sit between them — approve every resource handoff personally to prevent future conflicts from forming.",
        tier: 2,
        xp: 50,
        consequence: "A third spirit materializes — slower than both, more deliberate. The deadlock resolves. Ferron's coordination returns but is visibly more careful, more hesitant — every major action preceded by a half-second pause as the regulator signals clearance. He moves. But he moves like someone who learned to be suspicious of movement.\n\nEngineer: 'Centralized management. The regulator checks every handoff and prevents conflict. It works. But now every circuit must wait for the regulator before it acts. He's the bottleneck. And when we need speed — when the boss hits — the regulator will be the thing slowing us down.'",
        debt: { name: "Bottleneck Regulator", description: "The centralized regulator becomes a bottleneck for all future handoffs.", triggersAt: "Act 3" },
      },
      {
        id: "E",
        text: "Number the circuits. Enforce a strict rule: both spirits must always request the lower-numbered circuit first — Hammer Circuit (1) before Anvil Channel (2) — always, no exceptions.",
        tier: 1,
        xp: 150,
        consequence: "The numbering rule propagates instantly. Both spirits attempt their natural inclinations — and the rule catches them before the cycle forms. Ferro requests Hammer(1) first. Anvila also requests Hammer(1) first. Ferro wins the race. Anvila waits correctly — in the right order, without holding anything, without creating a circle. Ferron stands fully upright for the first time. His glow turns white.\n\nEngineer stares at Ferron's white glow for three full seconds before speaking: 'Resource ordering. You numbered the circuits and mandated the request order. With a strict hierarchy, no circular dependency can form — ever. Ferro and Anvila can never trap each other because they always ask for lower numbers first. You didn't fix this deadlock. You made this deadlock architecturally impossible to create again.'",
      },
    ],
  },

  // ─── ACT 3: The Memory of Iron ─────────────────────────────────────────
  {
    actNumber: 3,
    title: "The Memory of Iron",
    mood: "tense",
    lines: makeLines(
      "Ferron's Capacity Core is a disaster. Weeks of mismanagement have left it fragmented — usable space scattered in chunks, separated by walls of occupied blocks that cannot move. Four critical repair processes need to run simultaneously, and each requires a contiguous block. They cannot be split. The capacity map shows 100 total free units broken into: 10 free — [USED] — 25 free — [USED] — 20 free — [USED] — 35 free — [USED] — 10 free. KARN needs 40 units. BRIX needs 25. TURA needs 20 (urgent — balance regulation). VOSS needs 30. Total needed: 115. Total available: 100. Not all can run. Choosing poorly wastes what little space remains.",
      [
        { character: "ENGINEER", line: "TURA is the most urgent — without balance regulation, Ferron cannot walk straight. But if we allocate wrong, we might fit TURA and lose KARN, which means his structure is unbraced for the boss fight. Every choice here has a cost. The question is which cost we can absorb." },
        { character: "FERRON", line: "I feel it. The spaces that should be mine are occupied by fragments of old work that never finished. Make them useful again. Give me room to repair myself." },
        { character: "FORGE_MASTER", line: "You have the map. You have the process sizes. Four things that need space, one configuration of space. What do you do?" },
      ]
    ),
    question: "How do you allocate Ferron's fragmented memory space across four repair processes that need contiguous blocks?",
    choices: [
      {
        id: "A",
        text: "Assign each process to the first free block that is large enough to hold it — work from left to right across the capacity map, filling as you go without overthinking it.",
        tier: 2,
        xp: 50,
        consequence: "BRIX(25) fills the first 25-unit gap perfectly. TURA(20) fills the third 20-unit gap. VOSS(30) fits into the 35-unit gap, leaving 5 unused. KARN(40) scans the remaining fragments — the largest is the 10-unit gap, then the 5-unit leftover. KARN cannot start. Structural reinforcement stalls. Ferron walks, but his left side is unbraced — a cathedral built without a cornerstone.\n\nEngineer: 'First Fit found space for three processes quickly. But it left KARN stranded. The leftover fragments from filling VOSS into the 35-gap aren't large enough for KARN. A better strategy would have preserved the larger gaps for the larger processes.'",
        debt: { name: "First Fit", description: "KARN's structural reinforcement stalled. Ferron walks but his left side is unbraced.", triggersAt: "Boss Gate" },
      },
      {
        id: "B",
        text: "For each process, find the smallest free block that is still large enough to hold it — minimize leftover fragments so every scrap of space is preserved for future use.",
        tier: 1,
        xp: 100,
        consequence: "TURA(20) slots into the 20-unit gap with zero leftover — a perfect fit. BRIX(25) fills the 25-unit gap exactly. VOSS(30) takes from the 35-unit gap, leaving 5. Then the Engineer notices something: 'KARN needs 40 units. There's no single gap that size... but the 10-unit gap plus the 5-unit remainder plus KARN's lightweight activation sequence...' He recalculates fast, eyes bright. All four processes run. Ferron stands completely straight.\n\nEngineer, laughing in disbelief: 'Best Fit preserved every scrap. Where First Fit would have created wasteful gaps, Best Fit left just enough — and the creative allocation worked because the fragments were the right size. Four processes. Ferron fully active. The math was tight but it held.'",
      },
      {
        id: "C",
        text: "For each process, give it the largest available free block — save the smaller gaps for smaller future requests that might need them later.",
        tier: 3,
        xp: 10,
        consequence: "Processes take the 35-unit and 25-unit blocks. The remaining fragments: 10, 20, 10. KARN(40) cannot fit anywhere. Neither can VOSS(30). Two critical processes fail to start. Ferron's balance improves — TURA ran — but his structural core and energy channels remain broken. He takes one step forward and lurches into a tool cart, scattering iron pieces across the forge floor.\n\nEngineer winces: 'Worst Fit gives every process the biggest available gap — sounds generous, feels efficient. But it burned the large blocks immediately and left only small fragments behind. KARN and VOSS needed size we no longer have. We preserved the small holes and burned the big ones. That is exactly backwards.'",
        scar: { name: "Lurching Step", description: "Ferron's structure and energy channels remain broken." },
      },
      {
        id: "D",
        text: "Before assigning anything, consolidate all free fragments into one large contiguous block — compact the core first, then allocate from clean unified space.",
        tier: 3,
        xp: 25,
        consequence: "You call a halt on all activity. The Capacity Core goes quiet while the fragments are pushed together — a 45-minute process during which Ferron stands completely inert in the village center. The outer fence is breached. Two watchtowers burn while he stands motionless. When Ferron finally activates — he is perfect inside, structured and clean. Outside, there is smoke from what used to be two watchtowers.\n\nEngineer, very quietly: 'Compaction was the right idea. Consolidating fragments is correct thinking. But halting Ferron for 45 minutes while the village had no defense — that timing cost us two towers. The right tool at the wrong moment is still a wrong choice.'",
        debt: { name: "Compaction Gap", description: "The 45-minute compaction halt let the outer fence breach and two watchtowers burn.", triggersAt: "Boss Gate" },
      },
      {
        id: "E",
        text: "Split each process across multiple free blocks — give KARN the 25-unit gap and the remaining 15 from another gap, so everyone gets the space they need.",
        tier: 4,
        xp: 0,
        consequence: "KARN initializes across two fragments — 25 units here, 15 units there. The process throws an error immediately. Ferron's Capacity Core cannot bridge fragmented space. Two processes fail to start. The fragments they touched during the attempt are now corrupted — marked as unusable. Available space drops from 100 to 65 units. Ferron convulses. Three circuit spirits are ejected from his core like sparks from a struck anvil.\n\nEngineer: 'Contiguous. They need contiguous blocks. A process that runs across two separate memory regions cannot be addressed — Ferron's architecture requires the entire allocation to exist in one unbroken space. We didn't just fail to place KARN. We damaged the fragments it tried to use. We made the problem worse by attempting the impossible.'",
        scar: { name: "The Shattered Core", description: "Ferron's capacity is permanently reduced by 20 units. Acts 4 and boss gate begin with compounding fragmentation." },
      },
    ],
  },

  // ─── ACT 4: The Page That Was Forgotten ────────────────────────────────
  {
    actNumber: 4,
    title: "The Page That Was Forgotten",
    mood: "tense",
    lines: makeLines(
      "Ferron halts. Mid-preparation for battle, he reaches for a combat blueprint stored in deep storage weeks ago to free up active memory — and it is not in his active slots. A page fault. His energy is steady, but every stall costs 3% and Ferron can only stall so many times before he arrives at the boss gate too depleted to fight. Reference string of blueprints needed, in order: 7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2. Active memory slots: 3. Every page fault is a stall. Fewer stalls means more energy. More energy means a stronger Ferron at the Boss Gate.",
      [
        { character: "ENGINEER", line: "Three memory slots. Thirteen blueprints to cycle through, some of them repeating. Every time Ferron needs a blueprint that isn't in the active slots, he stalls — 3% energy gone. The strategy you choose determines how many times he stalls." },
        { character: "FERRON", line: "Tell me the rule. How do I decide which blueprint leaves when a new one must enter? Tell me and I will follow it exactly." },
        { character: "ENGINEER", line: "That's the question, isn't it. How does he know which one to forget? The wrong answer to that question costs him every time the wrong blueprint isn't there." },
      ]
    ),
    question: "What page replacement strategy do you enforce for Ferron's active memory during blueprint preparation?",
    choices: [
      {
        id: "A",
        text: "Always replace the blueprint that has been in active memory the longest — oldest entry leaves first, like moving through a queue where the front always exits.",
        tier: 2,
        xp: 50,
        consequence: "9 page faults on the reference string. Ferron stalls nine times — a rhythm of hesitation woven through his preparation. 27% energy lost. He arrives at the Boss Gate with an amber glow — functional, present, but tired in the way that shows.\n\nEngineer: 'FIFO doesn't know which blueprint is useful — it only knows which one arrived first. Oldest in, first out. It evicts blueprints that have been waiting, even if they were accessed two seconds ago. 9 faults. Functional. Not optimal.'",
        debt: { name: "FIFO Tired", description: "9 page faults. Ferron arrives at the Boss Gate tired.", triggersAt: "Boss Gate" },
      },
      {
        id: "B",
        text: "Always replace the blueprint that was used least recently — the one that has gone the longest since it was last accessed.",
        tier: 1,
        xp: 100,
        consequence: "7 page faults. Ferron stalls seven times — noticeably less. 21% energy lost. He enters the Boss Gate with steady gold energy, blueprints cycling efficiently. His movements in preparation have a fluid quality — muscle memory, or its iron equivalent.\n\nEngineer nods slowly: 'LRU. Least Recently Used. He keeps what was just accessed — because what was used recently is most likely to be needed again soon. The blueprint he put down a minute ago is more valuable than the one he hasn't touched in an hour. 7 faults. That's the practical optimum.'",
      },
      {
        id: "C",
        text: "Always replace the blueprint that will not be needed again for the longest time in the future — look ahead in the reference sequence and evict accordingly.",
        tier: 1,
        xp: 100,
        consequence: "Minimum possible faults. Ferron's preparation is eerily perfect. The Engineer's eyes narrow: 'That is... that is the optimal result. The absolute minimum faults achievable on this reference string.' A pause. 'Sir Axiom. How did you know which blueprint would be needed next? No one can see a future reference string in a real battle.'\n\nEngineer writes a starred note in his book: 'This is Bélády's optimal algorithm. It achieves the minimum fault count by knowing the future — which blueprint won't be needed again for the longest time. In training, where the reference string is known, it works perfectly. In live battle, it cannot be implemented. The real-world answer is LRU. But understanding why this is the ceiling — that understanding is valuable.'",
      },
      {
        id: "D",
        text: "Always replace the blueprint used least frequently overall — the one accessed the fewest total times across all of Ferron's preparation.",
        tier: 3,
        xp: 10,
        consequence: "11 page faults. Ferron staggers into the Boss Gate barely glowing — 33% energy lost to stalls. The reference string has loops: blueprint 0 and blueprint 2 repeat. LFU evicts them at exactly the wrong moments because their long-term frequency doesn't reflect their current relevance. Ferron's preparation has gaps in it.\n\nEngineer: 'LFU counts total accesses over all time — but that hides recent patterns. Blueprint 0 repeats three times in this string. LFU sees it was infrequently accessed overall and evicts it — right before it's needed again. Frequency lies when patterns shift. Recency is usually more truthful.'",
        debt: { name: "LFU Depleted", description: "11 page faults. Ferron staggers into the Boss Gate barely glowing.", triggersAt: "Boss Gate" },
      },
      {
        id: "E",
        text: "Never replace anything — keep loading new blueprints into additional memory slots indefinitely as they are needed.",
        tier: 4,
        xp: 0,
        consequence: "You request additional memory slots. There are three. There have always been three. The request crashes Ferron's memory subsystem — circuits spark, the entire blueprint loading halts. For twenty minutes, Ferron cannot access any stored blueprint at all. He stands in the village center, inert, while the outer defenses go unmanned. When the system recovers, one slot is damaged. He enters the Boss Gate with two active memory slots instead of three.\n\nEngineer, with the quiet fury of someone watching an elegant system be fundamentally misunderstood: 'Memory is finite. The three slots are a physical limit — they do not expand on request. Asking for more caused an exception in the subsystem. We lost a slot in the crash. Ferron goes into the Boss Gate with two slots instead of three. The impossible ask made the possible situation worse.'",
        scar: { name: "The Impossible Ask", description: "Ferron begins the boss gate with 2 active memory slots instead of 3. One was damaged in the crash." },
      },
    ],
  },

  // ─── ACT 5: BOSS GATE — Ferron's Final Test ────────────────────────────
  {
    actNumber: 5,
    title: "BOSS GATE — Ferron's Final Test / DEADLOCK",
    mood: "danger",
    lines: makeLines(
      "THE COLLAPSE hits the Forge Village as a cascading failure — not an army, not a single enemy, but every mismanagement decision you made given physical form and returned at once. Every DEBT triggers simultaneously. Every SCAR compounds its effect now. FERRON — depending on your choices — is either a restored giant standing at full capability, or a battered machine fighting its own fragmentation, and the thing that was once his protection has become his breakdown. In his most degraded state, the village calls it by a different name: DEADLOCK. Three rounds. The energy meter is everything.",
      [
        { character: "FORGE_MASTER", line: "Whatever energy he has left — that's what we're working with. Every debt you planted is awake. Every scar you earned just showed up at the worst possible moment. Three rounds. Hold him together." },
        { character: "DEADLOCK", line: "[If Ferron is below 40%] He is not here anymore. He is the pattern of every mistake made in his name. He does not protect. He enacts." },
        { character: "FERRON", line: "[If Ferron is above 70%] I am ready. I have been waiting for this. I know what I am. Tell me what to do and I will do it completely." },
        { character: "ENGINEER", line: "Round 1: Scheduling plus deadlock simultaneous. Round 2: Memory emergency under pressure. Round 3: Final energy balance — three minutes, four tasks, distribute optimally. Every choice compounds. Go." },
      ]
    ),
    question: "Three rounds of combined OS challenges — all previous debts and scars active simultaneously. Ferron's final state determines the zone ending.",
    choices: [
      {
        id: "A",
        text: "[ROUND 1] Sequence the simultaneous resource conflict using shortest-task-first ordering while applying resource ordering rules to prevent a deadlock from forming.",
        tier: 1,
        xp: 100,
        consequence: "The simultaneous crisis resolves cleanly. Short tasks cycle energy back. Resource order prevents a new deadlock from forming even under the pressure of both problems hitting at once. Ferron's glow holds. The Collapse's first wave breaks against a Golem who has been managed correctly.\n\nForge Master: 'Round 1 clean. He managed both at once — scheduling and deadlock prevention together. That's what an OS is supposed to do.'",
      },
      {
        id: "B",
        text: "[ROUND 2] Under memory pressure, use Best Fit allocation for available fragments while running LRU page replacement simultaneously.",
        tier: 1,
        xp: 100,
        consequence: "Fragments slot together tightly. Page faults occur only where they must. Ferron's memory emergency resolves without a cascade. He does not convulse. He does not eject any circuit spirits. He continues.\n\nEngineer: 'Best Fit preserved the space. LRU kept the right blueprints active. Under simultaneous pressure, the right strategy held where a wrong one would have compounded every existing scar.'",
      },
      {
        id: "C",
        text: "[ROUND 3] Distribute Ferron's final energy across the four remaining tasks in order of return speed — shortest-return tasks first, longest last — to maximize output before the energy window closes.",
        tier: 1,
        xp: 100,
        consequence: "The energy window closes on a Golem who spent every unit correctly. Ferron completes the final task as the last of his prepared energy resolves. He is not depleted. He is spent — which is different. A machine that has given exactly what it had, to exactly the right purposes, in the exactly right order.\n\nEngineer reads the meter. Looks up. 'He spent everything correctly. Nothing wasted. Nothing starved. Every unit of energy went to a task that could use it and return from it. That is what an operating system is for.'",
      },
    ],
  },
];
