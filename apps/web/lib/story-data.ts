export type ChoiceTier = 1 | 2 | 3 | 4;

export interface StoryScar {
    name: string;
    description: string;
}

export interface StoryDebt {
    name: string;
    description: string;
    triggersAt: string;
}

export interface StoryChoice {
    id: string;
    text: string;
    tier: ChoiceTier;
    xp: number;
    consequence: string;
    scar?: StoryScar;
    debt?: StoryDebt;
}

export interface StoryAct {
    actNumber: number;
    title: string;
    sceneText: string;
    question: string;
    choices: StoryChoice[];
}

export interface StoryZoneData {
    zoneId: string;
    title: string;
    acts: StoryAct[];
}

export const storyData: Record<string, StoryZoneData> = {
    ARCHIVE_CITADEL: {
        zoneId: "ARCHIVE_CITADEL",
        title: "The Archive Citadel",
        acts: [
            {
                actNumber: 1,
                title: "The Index of Shadows",
                sceneText: "You step into the Great Archive, a library of ten million tomes. Elder Query, a blind scholar, approaches. 'The weapon that slays Nullus the Dread Wyrm was forged by a traitor. Their name carries the shadow of death — \"Mord\" in the old tongue. The weapon was made after the Third War. Begin with the authors.'",
                question: "How do you search the archive?",
                choices: [
                    {
                        id: "A",
                        text: "Search every wing one by one, reading all scrolls until you find any mention of 'Mord' anywhere.",
                        tier: 4,
                        xp: 0,
                        consequence: "You wander for hours, reading aimlessly. Nullus attacks the outer wall while you're lost. One gate tower falls. (Full table scan without indexing or filtering wastes immense time).",
                        scar: { name: "The Fallen Tower", description: "Nullus destroyed a gate tower while you wasted time searching randomly." }
                    },
                    {
                        id: "B",
                        text: "Ask Elder Query to list all authors whose names contain 'Mord', sorted by the era they worked in.",
                        tier: 1,
                        xp: 100,
                        consequence: "Three names appear instantly. The archive hums. Elder Query says, 'The index serves those who ask precisely.' (Correct approach: Wildcard LIKE and ORDER BY)."
                    },
                    {
                        id: "C",
                        text: "Find authors named exactly 'Mord' — the name must match completely to avoid false results.",
                        tier: 3,
                        xp: 25,
                        consequence: "Zero results returned. You report back empty-handed. Elder Query sighs, 'You searched too narrow. The shadow hides in parts of names, not whole names.' (Exact match misses substrings).",
                        scar: { name: "The Missed Shadow", description: "You missed vital clues by searching too strictly." }
                    },
                    {
                        id: "D",
                        text: "Pull all weapons made after the Third War first, then separately find all authors with 'Mord' in their name, and manually match them yourself.",
                        tier: 2,
                        xp: 60,
                        consequence: "You find the author but take 4 hours to match them by hand. (Filtering but failing to JOIN correctly causes manual overhead).",
                        debt: { name: "Manual Exhaustion", description: "Your manual matching took too long.", triggersAt: "Boss Gate" }
                    },
                    {
                        id: "E",
                        text: "Ask Elder Query to show you every book ever checked out by visitors in the last 100 years to trace popular scrolls.",
                        tier: 3,
                        xp: 25,
                        consequence: "You get thousands of visitor logs. A guard mocks you. You lose 30 minutes reading irrelevant data. (Querying the wrong table entirely).",
                        scar: { name: "The Fool's Errand", description: "You wasted time digging through visitor logs." }
                    }
                ]
            },
            {
                actNumber: 2,
                title: "The JOIN of Fates",
                sceneText: "Three candidate tomes are found, but each is split across two wings. The weapon's true name is in WING_WEAPONS. The curse that makes it lethal is in WING_FORBIDDEN. They share a 'weapon_id' seal. However, one forbidden scroll has a seal for a weapon that was destroyed in a fire.",
                question: "How do you combine the information from the two wings?",
                choices: [
                    {
                        id: "A",
                        text: "Retrieve only the weapons that have a matching curse entry — if there's no curse record, ignore the weapon.",
                        tier: 1,
                        xp: 100,
                        consequence: "Clean, precise result. The cursed weapon glows on the parchment. Elder Query nods, 'You understand relationships. The archive yields its secret.' (INNER JOIN returns only matching records)."
                    },
                    {
                        id: "B",
                        text: "Retrieve all weapons, and for each one show its curse if it exists — show the weapon even if no curse entry is found.",
                        tier: 2,
                        xp: 60,
                        consequence: "You get results, but uncursed weapons clutter the list. You nearly pick the wrong tome before correcting yourself. (LEFT JOIN brings in useless null data).",
                        debt: { name: "The Cluttered Vision", description: "The excess data nearly caused a fatal mistake.", triggersAt: "Boss Gate" }
                    },
                    {
                        id: "C",
                        text: "Retrieve all curses regardless of whether a weapon record exists for them.",
                        tier: 3,
                        xp: 25,
                        consequence: "A destroyed weapon's curse appears. You try to retrieve it, and the shelf crumbles to ash. Precious time is wasted. (RIGHT JOIN brings in orphaned records).",
                        scar: { name: "Ash and Dust", description: "A ruined shelf collapsed on you while chasing ghosts." }
                    },
                    {
                        id: "D",
                        text: "Retrieve every possible combination of weapons and curses — match every weapon to every curse entry to be thorough.",
                        tier: 4,
                        xp: 0,
                        consequence: "Thousands of meaningless pairings flood the floor. Pages explode everywhere! Elder Query screams. Nullus grows stronger outside! (CROSS JOIN causes a catastrophic Cartesian product).",
                        scar: { name: "The Paper Flood", description: "The archive is covered in useless permutations." },
                        debt: { name: "Elder's Wrath", description: "Elder Query is furious at your mess.", triggersAt: "Boss Gate" }
                    }
                ]
            },
            {
                actNumber: 3,
                title: "The Cursed Duplicates",
                sceneText: "A saboteur planted 3 fake copies of the target tome. All four copies look identical. One is real. The real one has been accessed exactly once — by its original author. The fakes have never been accessed, or accessed many times.",
                question: "How do you narrow down the copies to the true tome?",
                choices: [
                    {
                        id: "A",
                        text: "Group all copies of the tome by their scroll ID, count how many times each was accessed, and show only the one accessed exactly once.",
                        tier: 1,
                        xp: 100,
                        consequence: "One tome remains. It glows faintly. The saboteur flees. Elder Query weeps with relief. (Correct use of GROUP BY and HAVING COUNT = 1)."
                    },
                    {
                        id: "B",
                        text: "Pull all copies and remove any that appear more than once in the visitor log — keep only unique ones.",
                        tier: 2,
                        xp: 60,
                        consequence: "You narrow it to two copies. You're still uncertain, so you grab both. One is a fake. (DISTINCT logic misapplied).",
                        debt: { name: "The Heavy Burden", description: "Carrying a fake tome slows you down.", triggersAt: "Boss Gate" }
                    },
                    {
                        id: "C",
                        text: "Sort all copies alphabetically by title and pick the first one — originals are usually filed first.",
                        tier: 4,
                        xp: 0,
                        consequence: "You grab a fake! You read the incantation and it backfires. Nullus partially heals outside. (Sorting has no correlation to access count).",
                        scar: { name: "The Burned Gauntlet", description: "Your sword hand is weakened from the backfiring spell." },
                        debt: { name: "Empowered Wyrm", description: "Nullus healed from your mistake.", triggersAt: "Boss Gate" }
                    },
                    {
                        id: "D",
                        text: "Pull all copies and manually inspect each scroll's physical condition — the real one is probably worn.",
                        tier: 3,
                        xp: 25,
                        consequence: "All are listed as 'Good' condition. Useless. You waste time, and a guard is reassigned from the wall to help you look. (Querying the wrong attribute).",
                        scar: { name: "The Weakened Wall", description: "A guard was pulled away because of your slow inspection." }
                    }
                ]
            },
            {
                actNumber: 4,
                title: "Boss Gate: The Living Index",
                sceneText: "Nullus the Dread Wyrm shatters the rotunda roof! The beast is made of corrupted, unindexed data. It roars, preparing to erase the Archive. You must wield the true tome you found to strike its primary key and banish it.",
                question: "Nullus strikes! How do you target its vulnerability?",
                choices: [
                    {
                        id: "A",
                        text: "Strike randomly at its bulk, hoping to hit a vital spot through sheer volume of attacks.",
                        tier: 4,
                        xp: 0,
                        consequence: "Your attacks bounce off. Nullus laughs, erasing an entire wing of the archive! (Brute force without targeting fails against optimized threats).",
                        scar: { name: "The Erased Wing", description: "A million books are gone forever." }
                    },
                    {
                        id: "B",
                        text: "Use the tome to identify its unique identifier (Primary Key) and strike exactly there.",
                        tier: 1,
                        xp: 100,
                        consequence: "With a blinding flash, your blade finds the exact vulnerability. Nullus implodes into dust! The Archive is saved! (Targeting the Primary Key is the optimal, indexed approach)."
                    }
                ]
            }
        ]
    },
    FORGE_VILLAGE: {
        zoneId: "FORGE_VILLAGE",
        title: "The Forge Village",
        acts: [
            {
                actNumber: 1,
                title: "The Scheduling Crisis",
                sceneText: "Ferron the Iron Golem is freezing up. Tasks are piling up. Task A takes 8 mins, B takes 2 mins, C takes 4 mins, D takes 6 mins, and E takes 1 min. Ferron needs energy returned quickly to stabilize.",
                question: "In what order do you execute the tasks?",
                choices: [
                    {
                        id: "A",
                        text: "Start with the shortest tasks first (E, then B) to cycle quick energy back into Ferron, then build up to the longer tasks.",
                        tier: 1,
                        xp: 100,
                        consequence: "Quick completions immediately cycle energy back. Ferron's glow steadies to gold. The forge master claps. (Shortest Job First minimizes average wait time)."
                    },
                    {
                        id: "B",
                        text: "Run the tasks in the order they were requested (First Come, First Served).",
                        tier: 3,
                        xp: 25,
                        consequence: "Task A monopolizes the forge for 8 minutes. Quick tasks wait, returning nothing. Ferron's glow dims to red. (FCFS causes the convoy effect).",
                        scar: { name: "The Sputtering Core", description: "Ferron's core took damage from starvation." }
                    },
                    {
                        id: "C",
                        text: "Assign each task 2 minutes of forge time, then rotate to the next task so everyone makes progress.",
                        tier: 2,
                        xp: 60,
                        consequence: "Every task makes partial progress, but nothing finishes for 10 minutes. Ferron gets only partial energy returns. (Round Robin avoids starvation but increases turnaround time).",
                        debt: { name: "Context Debt", description: "Ferron enters the next phase with tremors.", triggersAt: "Act 2" }
                    },
                    {
                        id: "D",
                        text: "Start all five tasks simultaneously across the forges.",
                        tier: 4,
                        xp: 0,
                        consequence: "Ferron's hearths spike violently! He thrashes and destroys a workshop from the overload! (Uncontrolled parallelism causes system overload).",
                        scar: { name: "The Overburn", description: "Ferron's energy ceiling is permanently reduced." },
                        debt: { name: "Ruined Workshop", description: "The forge master's tools are gone.", triggersAt: "Boss Gate" }
                    }
                ]
            },
            {
                actNumber: 2,
                title: "The Deadlock of the Twin Hearths",
                sceneText: "Ferron's left and right regulators, FERRO and ANVILA, have deadlocked. FERRO holds the Hammer Circuit and waits for the Anvil Channel. ANVILA holds the Anvil Channel and waits for the Hammer Circuit. Neither will yield.",
                question: "How do you break the deadlock?",
                choices: [
                    {
                        id: "A",
                        text: "Wait — one of them will eventually realize the situation and yield organically.",
                        tier: 4,
                        xp: 0,
                        consequence: "They wait forever. Ferron's energy drains drastically. A cascading deadlock stalls the entire village! (Deadlocks do not resolve themselves).",
                        scar: { name: "The Long Wait", description: "Ferron's recovery from stuns takes twice as long." }
                    },
                    {
                        id: "B",
                        text: "Institute a rule: both spirits must release what they hold before requesting a new resource.",
                        tier: 1,
                        xp: 100,
                        consequence: "Both release. ANVILA picks up the Hammer, finishes, and releases. FERRO resumes. Ferron's coordination snaps back perfectly! (Breaking the hold-and-wait condition)."
                    },
                    {
                        id: "C",
                        text: "Force FERRO to drop the Hammer Circuit and give it to ANVILA immediately.",
                        tier: 2,
                        xp: 60,
                        consequence: "ANVILA finishes, but FERRO's work is wiped out and he has to restart. Ferron lurches to the right. (Preemption resolves deadlock but causes data/work loss).",
                        debt: { name: "Half-Channel", description: "Ferron's left arm occasionally misfires.", triggersAt: "Boss Gate" }
                    }
                ]
            },
            {
                actNumber: 3,
                title: "The Memory of Iron",
                sceneText: "Ferron's Capacity Core is fragmented: [10 free] [USED] [25 free] [USED] [20 free] [USED] [35 free]. Four repair processes need space: KARN(40), BRIX(25), TURA(20), VOSS(30). TURA is incredibly urgent for his balance.",
                question: "How do you allocate the memory blocks?",
                choices: [
                    {
                        id: "A",
                        text: "Compaction: Halt everything, merge all free fragments into one 100-unit block, then assign.",
                        tier: 3,
                        xp: 25,
                        consequence: "It takes 45 minutes. Ferron cannot move. The outer fence is breached by enemies. When he restarts, he is perfect, but the village took damage. (Compaction is extremely expensive overhead).",
                        scar: { name: "The Breached Fence", description: "Enemies breached the perimeter while the system compacted." }
                    },
                    {
                        id: "B",
                        text: "Best Fit: For each process, find the smallest free block that fits it exactly.",
                        tier: 1,
                        xp: 100,
                        consequence: "TURA goes to 20, BRIX to 25. The 35 block takes VOSS with 5 left over. By packing perfectly, you save the core! (Best Fit minimizes leftover contiguous fragments)."
                    },
                    {
                        id: "C",
                        text: "First Fit: Assign each the first block large enough, from left to right.",
                        tier: 2,
                        xp: 60,
                        consequence: "BRIX takes the 25. TURA takes 20. VOSS takes 35. KARN(40) cannot fit. Structural reinforcement stalls. (First fit is fast but causes fragmentation issues later).",
                        debt: { name: "Unbraced Left Side", description: "Ferron's structure is compromised.", triggersAt: "Boss Gate" }
                    }
                ]
            },
            {
                actNumber: 4,
                title: "Boss Gate: The Deadlock Strikes",
                sceneText: "Deadlock, a colossal beast of rusted gears and frozen time, assaults the village! Ferron stands to meet it. But Deadlock attempts to trap Ferron in an infinite wait cycle.",
                question: "How do you command Ferron to strike?",
                choices: [
                    {
                        id: "A",
                        text: "Lock all of Ferron's capabilities on defense until Deadlock stops attacking.",
                        tier: 4,
                        xp: 0,
                        consequence: "Deadlock NEVER stops attacking. Ferron freezes in defensive posture forever. The village falls! (A classic starvation scenario).",
                        scar: { name: "The Frozen Defender", description: "The village was utterly destroyed." }
                    },
                    {
                        id: "B",
                        text: "Number Ferron's strike patterns, ensuring they execute in strict sequential order, preventing circular dependencies.",
                        tier: 1,
                        xp: 100,
                        consequence: "Ferron moves with impossible fluidity. Deadlock tries to freeze him, but the ordered logic shatters the beast's holds! Deadlock collapses into rusted scrap! (Strict resource ordering prevents circular wait)."
                    }
                ]
            }
        ]
    },
    WALL_OF_GATES: {
        zoneId: "WALL_OF_GATES",
        title: "The Wall of Gates",
        acts: [
            {
                actNumber: 1,
                title: "The Road Map of Chaos",
                sceneText: "The Shadow Mob 'OVERFLOW' has cut roads. You must route the King's escort from Ironhold to the Capital. The paths have different times: Ironhold→Crestfall(4), Crestfall→Millhaven(2), Millhaven→Dunport(1), Dunport→Capital(3), Ironhold→Millhaven(7).",
                question: "How do you route the king?",
                choices: [
                    {
                        id: "A",
                        text: "Send the king on the road that looks most direct on the map visually.",
                        tier: 4,
                        xp: 0,
                        consequence: "The 'direct' road is actually the 7-hour stretch. The escort is ambushed! (Greedy visual selection ignores actual metrics/weights).",
                        scar: { name: "The Captured Crown", description: "The final boss will have the King's captured reinforcements." }
                    },
                    {
                        id: "B",
                        text: "Calculate the shortest total travel time by checking all possible paths step-by-step, expanding the shortest known path first.",
                        tier: 1,
                        xp: 100,
                        consequence: "You find the optimal 10-hour path (Ironhold→Crestfall→Millhaven→Dunport→Capital). The king arrives safely! (Dijkstra's Algorithm)."
                    },
                    {
                        id: "C",
                        text: "Split the escort and send them on two different roads.",
                        tier: 2,
                        xp: 60,
                        consequence: "One group arrives, but the other is delayed heavily. Half the guard is missing! (Redundancy without logic splits your forces).",
                        debt: { name: "Divided Guard", description: "Half the guard is unavailable.", triggersAt: "Act 3" }
                    }
                ]
            },
            {
                actNumber: 2,
                title: "The Imposter Messenger",
                sceneText: "A messenger arrives with new orders. You suspect he is a Shadow Mob spy. He has a royal seal, but those can be forged.",
                question: "How do you verify the messenger?",
                choices: [
                    {
                        id: "A",
                        text: "Trust the royal seal. If it looks intact, he's genuine.",
                        tier: 4,
                        xp: 0,
                        consequence: "The seal is forged! He redirects your archers, leaving the gate undefended! (Trusting easily forged data without cryptographic signatures).",
                        scar: { name: "The Broken Seal", description: "Future authentication challenges are harder." }
                    },
                    {
                        id: "B",
                        text: "Ask him a secret that only someone from the Northern Fort would know.",
                        tier: 1,
                        xp: 100,
                        consequence: "He fails the challenge-response. Arrested! The real message is found hidden in his boot. (Challenge-Response Authentication)."
                    },
                    {
                        id: "C",
                        text: "Send a reply messenger back to confirm the original message was sent.",
                        tier: 2,
                        xp: 60,
                        consequence: "It works, but it takes 2 hours. You lose precious setup time for the next attack. (ACK-based verification is slow).",
                        debt: { name: "Lost Time", description: "The firewall setup in the next act will be rushed.", triggersAt: "Act 3" }
                    }
                ]
            },
            {
                actNumber: 3,
                title: "Boss Gate: The Flood",
                sceneText: "Ten thousand shadow creatures rush the gate! OVERFLOW is executing a massive DDoS attack on the village gates. Real travelers are stuck.",
                question: "How do you handle the flood?",
                choices: [
                    {
                        id: "A",
                        text: "Identify where the flood is coming from and block that entire road from approaching the gate.",
                        tier: 1,
                        xp: 100,
                        consequence: "The source road is sealed. The mob is stalled. OVERFLOW is exposed in the open, and your archers defeat him! (IP-based firewalling/Geo-blocking saves the day!)."
                    },
                    {
                        id: "B",
                        text: "Post more guards at the gate to process them faster.",
                        tier: 3,
                        xp: 25,
                        consequence: "The guards are overwhelmed. The gate collapses! (Vertical scaling fails against a massive DDoS).",
                        scar: { name: "The Broken Gate", description: "The village defenses are crippled." }
                    },
                    {
                        id: "C",
                        text: "Let everyone through, but flag suspicious ones for review inside.",
                        tier: 4,
                        xp: 0,
                        consequence: "The mob infiltrates the village and sabotages everything! (No filtering destroys the internal network).",
                        scar: { name: "The Infiltrated Village", description: "Internal sabotage has ruined the village." }
                    }
                ]
            }
        ]
    }
};
