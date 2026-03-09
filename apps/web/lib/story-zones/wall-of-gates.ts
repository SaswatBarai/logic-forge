/**
 * WALL_OF_GATES — Zone 3 storyline from Ironclad Chronicles.
 * Self-contained component: narrator + dialogue → sceneText; momentOfTruth → question; choices with consequences.
 */

import type { StoryAct, SceneLine } from "@/lib/story-data";

const CHAR_NAMES: Record<string, string> = {
  KING: "The King",
  OVERFLOW: "Overflow",
  MIRA_ZONE3: "The Messenger",
  VAEL: "Vael",
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

export const WALL_OF_GATES_ACTS: StoryAct[] = [
  // ─── ACT 1: The Road Map of Chaos ─────────────────────────────────────
  {
    actNumber: 1,
    title: "The Road Map of Chaos",
    mood: "calm",
    lines: makeLines(
      "OVERFLOW THE SHADOW MOB does not fight with swords. It fights with deception — fake messengers, flooded gates, intercepted royal letters, impersonated generals. Sir Axiom is appointed Network Warden: secure every road, verify every seal, route the king's convoy through enemy territory without a single message intercepted. Seven roads connect five villages. The Shadow Mob has cut three of them. The king's escort must reach the capital. Road weights in travel hours — Ironhold to Crestfall: 4. Ironhold to Millhaven: 7. Crestfall to Millhaven: 2. Crestfall to Dunport: 5. Millhaven to Dunport: 1. Millhaven to Capital: 6. Dunport to Capital: 3.",
      [
        { character: "KING", line: "The roads have been cut. Three of them. I need to reach the capital. You are the Warden — tell me which road I take and why, not just which one feels right." },
        { character: "OVERFLOW", line: "...every road leads to us... the long one... the short one... we are already on both... take any road... it ends with us..." },
        { character: "KING", line: "That is what an enemy wants you to believe. Ignore it. Find the shortest path. Show your work." },
      ]
    ),
    question: "How do you route the king's convoy from Ironhold to the Capital through the safest, shortest path?",
    choices: [
      {
        id: "A",
        text: "Send the king on the road that looks most direct on the map — fewer turns means less exposure to ambush.",
        tier: 4,
        xp: 0,
        consequence: "The 'direct' road passes through the 7-hour Ironhold–Millhaven stretch. Seven hours of exposed travel. Three hours in, Overflow closes on the convoy from both sides — they were waiting. The king is captured briefly before a desperate counter-charge recovers him, shaken, two guards lost.\n\nThe king's captain, tersely: 'The direct road on a map is not the shortest road in reality. Distance in hours is not the same as distance in appearance. Overflow knew which roads look direct. They waited on them.'",
        scar: { name: "The Captured Crown", description: "The king is briefly captured. The final boss has reinforcements — Overflow gains one additional attack wave." },
      },
      {
        id: "B",
        text: "Calculate the shortest total travel time by checking all possible paths from Ironhold to the Capital — always expanding the currently shortest known path first, step by step.",
        tier: 1,
        xp: 100,
        consequence: "Ironhold to Crestfall: 4 hours. Crestfall to Millhaven: 2 hours. Millhaven to Dunport: 1 hour. Dunport to Capital: 3 hours. Total: 10 hours. The king arrives safely. Overflow's watchers report the convoy taking a route they did not fully cover — the path no visual inspection would have chosen, but the one the numbers always chose.\n\nThe king exhales as the capital gate opens: 'You expanded the shortest known path at every decision point. You did not guess. You did not take what looked obvious. You calculated. That is the difference between a route and a road.'",
      },
      {
        id: "C",
        text: "Split the escort into two groups and send each on a different road — if one is ambushed, the other survives and the mission is not a total loss.",
        tier: 2,
        xp: 50,
        consequence: "One group arrives on schedule. The other takes the longer road and is delayed three hours — harried but not destroyed. The king arrives in two pieces and not one, which is better than zero. But half the royal guard is now three hours behind.\n\nThe king, watching the second group trickle in: 'Redundancy. A sensible instinct. But the longer road cost us three hours and half the guard. When the flood hits — and it will hit — those guards will not be there.'",
        debt: { name: "Redundant Escort", description: "One escort group is delayed on the longer path. Half the royal guard is absent.", triggersAt: "Act 3" },
      },
      {
        id: "D",
        text: "Ask the village elders to vote on which road they think is safest based on their past experience with Overflow attacks.",
        tier: 3,
        xp: 10,
        consequence: "The elders argue for three hours. Each has a different past experience. The decision they finally reach is based on a route that was safe eleven months ago, before Overflow rerouted its patrols. The convoy takes the voted road. Minor ambush. Two guards wounded. Three more hours lost than necessary.\n\nThe king's captain: 'The elders know what was safe. They cannot know what is safe now. Past experience without current data is a guess wearing the costume of wisdom. Overflow changes its routes. The elders' memories do not.'",
        scar: { name: "The Delayed Convoy", description: "Three hours and two guards lost to the wrong road." },
      },
      {
        id: "E",
        text: "Route the king through whichever road was used most recently by other travelers — if others made it through in the last six hours, it is probably still safe.",
        tier: 3,
        xp: 10,
        consequence: "The most recently traveled road was used by a merchant six hours ago. In the six hours since, Overflow moved a patrol onto it. The convoy hits the patrol two hours in — a minor ambush, two guards wounded, route improvised the rest of the way. The recency was real. The safety was six hours old.\n\nCaptain: 'Six hours ago and right now are not the same time. The road was safe when the merchant passed it. Overflow does not stay still. Recency tells you what was true. It does not guarantee what is true.'",
        scar: { name: "The Ambushed Road", description: "Two guards wounded; route improvised under pressure." },
      },
    ],
  },

  // ─── ACT 2: The Imposter Messenger ────────────────────────────────────
  {
    actNumber: 2,
    title: "The Imposter Messenger",
    mood: "tense",
    lines: makeLines(
      "A messenger arrives claiming to be from the Northern Fort. He carries news that, if true, changes the entire defense plan. If false — it redirects the archers, opens the eastern gate, and hands Overflow exactly what it needs. He is smooth. Rehearsed. His seal looks correct. His story sounds right. Something is wrong. You cannot name it immediately. But something in the way he stands, the way he answers — it is performance, not memory.",
      [
        { character: "MIRA_ZONE3", line: "Of course the seal is real. I rode three days from the Northern Fort without rest. The message is urgent — check the wax if you must, but every hour you delay is an hour the eastern flank is unadvised." },
        { character: "KING", line: "Warden. You have authority here. Verify him or trust him — but make the call. I will not act on intelligence I cannot trace to a verified source." },
        { character: "VAEL", line: "[Somewhere behind the gate, watching. He does not speak. He waits to see what you do with the imposter.]" },
      ]
    ),
    question: "How do you verify whether this messenger is genuine before acting on his intelligence?",
    choices: [
      {
        id: "A",
        text: "Check whether the route he claims to have traveled matches the time he says it took — if the road distance and travel time don't align, his stated origin is false.",
        tier: 1,
        xp: 100,
        consequence: "The math is off by three hours. The Northern Fort route takes four days under favorable conditions, not three. He claimed three days — in weather that would have required five. You hold up the discrepancy. He holds his expression for two full seconds before it cracks. Inside his boot: the real message, in a different hand.\n\nYour senior guard, leaning over the calculation: 'Travel time is a record. Every road has a known length. If his time doesn't match his route, his route is a lie. You used the road against him. A real messenger from the Northern Fort cannot arrive in three days — the math doesn't allow it.'",
      },
      {
        id: "B",
        text: "Ask him questions that only someone stationed at the Northern Fort would know — specific details about the garrison commander, the layout of the watch posts, recent events.",
        tier: 1,
        xp: 100,
        consequence: "He answers the first question smoothly — Overflow prepared him for the obvious ones. The second question trips him — a specific incident from last month involving the garrison cook and a broken oven. He doesn't know about it. No one outside the fort does. He fails the third question before he stops trying to answer. Under arrest. A real commander sends a replacement within the hour — with a verified seal system.\n\nYour senior guard: 'Challenge-response. You asked for things only someone who was actually there would know. He could fake the seal and the story. He could not fake the memory of being present.'",
      },
      {
        id: "C",
        text: "Accept the message but don't act on it yet — wait and see if the events he described begin to occur as he reported, then adjust if they don't.",
        tier: 3,
        xp: 10,
        consequence: "You wait. Events do not match his report. By the time you realize the intelligence was false, an outpost has already acted on it — repositioned based on a lie. The outpost is lost before the repositioning can be reversed.\n\nKing, flatly: 'You trusted without verifying and waited to see if trust was warranted. By the time you knew it wasn't, the outpost had already moved. Verification is not a delay — it is the thing that makes action meaningful.'",
        scar: { name: "The Lost Outpost", description: "An outpost was lost after acting on false intelligence." },
      },
      {
        id: "D",
        text: "Send a reply messenger back to the Northern Fort requesting confirmation that the original message was sent — wait for acknowledgement before trusting the arrival.",
        tier: 2,
        xp: 50,
        consequence: "The reply messenger returns two hours later with confirmation. The imposter was already in custody by then from other suspicions. But the two-hour window cost preparation time. The firewall setup that was supposed to start this afternoon is now rushed.\n\nGuard captain: 'Acknowledgement-based verification is correct. It is also slow. Two hours to confirm what a three-minute route check could have caught. When speed matters — and it often does — the fastest correct method is more valuable than the most thorough slow one.'",
        debt: { name: "ACK Delay", description: "ACK-based verification took 2 hours. The firewall setup in Act 3 is rushed.", triggersAt: "Act 3" },
      },
      {
        id: "E",
        text: "Trust the royal seal — if the wax seal on the letter is intact and unbroken, the message is genuine. A broken seal would indicate tampering.",
        tier: 4,
        xp: 0,
        consequence: "The seal was forged — a precise copy of the Northern Fort's royal wax. The fake message redirects your archers to the western approach. The eastern gate is left with a third of its normal coverage. Overflow moves through the eastern gap within the hour.\n\nYour senior guard finds you staring at the eastern breach: 'A seal proves the wax is intact. It does not prove who applied it. Anyone with the right stamp can replicate a seal. Without a signature system that cannot be copied — a digital signature, a unique shared secret — a seal is just wax. And Overflow had the stamp.'",
        scar: { name: "The Broken Seal", description: "The eastern gate is left undefended. All future authentication challenges become harder." },
      },
    ],
  },

  // ─── ACT 3: The Flood Attack ───────────────────────────────────────────
  {
    actNumber: 3,
    title: "The Flood Attack",
    mood: "tense",
    lines: makeLines(
      "Ten thousand shadow creatures rush the main gate simultaneously — not to fight, but to crowd it. To overwhelm the guards who check papers. To make legitimate processing impossible through sheer volume. Real travelers cannot get through. Supply convoys are stalled. The gate is choking. OVERFLOW whispers from the mass: 'Let us in... we are already in... there are too many of us... you cannot check us all...' The voice is many. The strategy is simple. The solution cannot be simple.",
      [
        { character: "OVERFLOW", line: "...ten thousand... check them all... take your time... we have all the time... the gate belongs to whoever fills it... you cannot empty water with a cup..." },
        { character: "KING", line: "The gate cannot hold at this rate. My supply convoy is backed up two miles. Medicine is in that convoy. Warden — control the gate or we lose it." },
        { character: "VAEL", line: "[Now visible, watching from the inner rampart — he has not moved against you yet. He is calculating something.]" },
      ]
    ),
    question: "How do you handle ten thousand shadow creatures flooding the main gate simultaneously?",
    choices: [
      {
        id: "A",
        text: "Post more guards at the gate — scale up the checking process by adding more workers to process the flood faster.",
        tier: 3,
        xp: 10,
        consequence: "More guards arrive. Overflow adjusts — sends ten thousand more. The flood is faster than any number of guards can process. Resources are exhausted. The gate collapses not from force but from weight — too many bodies pressing too many checks at once.\n\nGuard captain: 'You added guards. Overflow added creatures. The flood always wins a scaling war because the attacker controls the rate. You cannot out-resource a flood by adding workers. You have to control the rate of access — limit how many can approach per unit of time.'",
        scar: { name: "The Overwhelmed Gate", description: "The gate collapsed under the weight of unchecked volume." },
      },
      {
        id: "B",
        text: "Impose a rule — each creature must wait in a numbered queue, and only 50 can approach the gate per minute. Anyone outside the limit is turned back to wait their turn.",
        tier: 1,
        xp: 100,
        consequence: "The queue forms. Overflow's mass hits the limit and cannot press forward — the creatures at the front are processed; the ones behind are turned back by the queue rule. Real travelers, already in the numbered queue, pass through. The flood slows. OVERFLOW, from deep in the mass, screams — not in attack, but in frustration. The strategy that should have worked didn't work because the gate controlled the rate.\n\nGuard captain, watching the mass recede: 'Rate limiting. Fifty per minute — no more. The gate can process fifty per minute, so the flow matches the capacity. Overflow cannot send a hundred if only fifty are allowed to approach. You didn't stop the flood. You gave it a schedule it couldn't override.'",
      },
      {
        id: "C",
        text: "Close the gate entirely until the flood passes — nothing in, nothing out until Overflow withdraws.",
        tier: 2,
        xp: 50,
        consequence: "The flood stops. So does everything else. The supply convoy, two miles back, cannot advance. Medical supplies for the garrison sit in a cart outside the walls. An NPC — a healer's patient — deteriorates while waiting for medicine that is two miles and a closed gate away.\n\nKing: 'The gate is secure. The medicine is outside it. Closing a gate stops all traffic — malicious and legitimate together. A more precise solution would have allowed legitimate access to continue while blocking the flood. Closing everything is a last resort, not a first one.'",
        debt: { name: "Null Route", description: "The gate was closed entirely. A supply convoy carrying medicine was locked out.", triggersAt: "Boss Gate" },
      },
      {
        id: "D",
        text: "Identify where the flood is originating from and block that entire region from approaching the gate — anyone coming from that direction is refused entry regardless of papers.",
        tier: 1,
        xp: 100,
        consequence: "The source road — the eastern shadow-corridor Overflow has been using — is sealed. The mass hits the block and cannot enter. Overflow reroutes, but rerouting takes time and reduces pressure dramatically. Defenders regroup. The supply convoy routes around the blockade via the northern path.\n\nGuard captain: 'Source blocking. Instead of checking each creature individually, you identified where the flood was coming from and refused the entire source. Overflow can reroute — it did — but rerouting costs time. You bought time. That is what a firewall does at scale.'",
      },
      {
        id: "E",
        text: "Let everything through but flag suspicious creatures for later review — you cannot afford to stop legitimate travelers, and Overflow will be caught in the review process.",
        tier: 4,
        xp: 0,
        consequence: "Everything enters. Overflow creatures, mixed with real travelers, pour through the gate. By the time the review process begins, hundreds have already dispersed — to the forge, the archive, the armory. Internal sabotage begins. The village that was defended from outside is now compromised from within.\n\nGuard captain, surveying the damage: 'If everything passes, nothing is filtered. A review process that happens after entry does not prevent infiltration — it documents it. Overflow is already inside. The gate that was supposed to be a filter became an entrance.'",
        scar: { name: "The Infiltrated Village", description: "Overflow creatures reach the forge, archive, and armory. Boss encounter starts with internal enemies active." },
      },
    ],
  },

  // ─── ACT 4: The King's Secret Convoy ───────────────────────────────────
  {
    actNumber: 4,
    title: "The King's Secret Convoy",
    mood: "tense",
    lines: makeLines(
      "The convoy carries something Overflow cannot be allowed to intercept. Every road is watched. Every messenger is a potential impersonator. The only safe communication channel is one that is established through a specific sequence of steps — a ritual of trust, executed in the exact right order, that creates an encrypted connection no imposter can fake and no flood can overwhelm. Skip a step. Reverse two steps. Execute one out of order. The channel fails — and Overflow reads everything.",
      [
        { character: "KING", line: "I have to communicate with the convoy in the field. They need confirmation of the route change. If Overflow intercepts an unencrypted message, the convoy is compromised. How do we establish the secure channel?" },
        { character: "VAEL", line: "[Still watching from the inner rampart. Still calculating. One hand on his sword. Waiting for something.]" },
        { character: "OVERFLOW", line: "...the message is almost ours... one wrong step... one step out of order... and we read everything you say..." },
      ]
    ),
    question: "In what exact order must the five steps of the secure channel ritual be performed to establish an unbreakable communication link with the convoy?",
    choices: [
      {
        id: "A",
        text: "Step 1: The king announces his identity and what level of secrecy he needs. Step 2: The convoy sends back their own sealed identity. Step 3: The king sends an encrypted test message. Step 4: Both sides agree on the cipher to use for the full conversation. Step 5: Secure messages begin.",
        tier: 4,
        xp: 0,
        consequence: "Step 3 fails. The encrypted test message uses a cipher the convoy has not yet been told to expect. They cannot decrypt it. The handshake stalls in an incomplete state — neither fully open nor fully closed. Overflow, watching the stalled exchange, sends a spoofed completion signal. The channel 'opens' — to Overflow.\n\nGuard cryptographer: 'The cipher must be agreed on before any encrypted content is sent. You cannot encrypt a message using a key the other party does not have yet. The order matters — every step must create the foundation the next step builds on.'",
        scar: { name: "The Failed Handshake", description: "The secure channel was compromised by wrong step order." },
      },
      {
        id: "B",
        text: "Step 1: The king announces identity and secrecy level. Step 2: The convoy confirms they received it. Step 3: Both sides agree on the cipher together. Step 4: The king sends a test message encrypted with the agreed cipher. Step 5: Convoy confirms receipt — secure channel open.",
        tier: 1,
        xp: 100,
        consequence: "The channel opens cleanly. Each step validates the previous one. By step 5, both sides share a cipher no third party has negotiated, an identity no imposter could have confirmed, and a test message that proved the encryption works before anything critical was sent. The king dictates the route change. The convoy receives it. Overflow receives nothing.\n\nGuard cryptographer: 'Every step in the right order. Identity first — so both sides know who they are talking to. Acknowledgement second — so neither proceeds unilaterally. Cipher agreed before use — so the encryption means the same thing to both parties. Test before trusting — so a failure surfaces before the critical message. Then the real message. That is the handshake.'",
      },
      {
        id: "C",
        text: "Step 1: Agree on the cipher immediately. Step 2: King announces identity. Step 3: Convoy confirms identity. Step 4: Send the secure message. Step 5: Confirm receipt.",
        tier: 3,
        xp: 10,
        consequence: "The cipher is agreed on. Then the king announces identity. But in the gap between cipher agreement and identity verification, Overflow inserts a spoofed identity — claiming to be the convoy. The cipher is now shared with an imposter. The route change is sent. Overflow receives it and reads it in full.\n\nGuard cryptographer: 'Identity must come before cipher agreement. If you agree on how to encrypt before confirming who you are encrypting to, you may encrypt your message for the wrong recipient. The cipher is only secure if both parties are who they say they are — and that must be established first.'",
        scar: { name: "The Spoofed Channel", description: "Overflow intercepted the route change by spoofing identity after cipher agreement." },
      },
      {
        id: "D",
        text: "Step 1: Send the full secure message immediately — if both parties are genuine, they will figure out the cipher. Step 2: Agree on cipher retroactively. Step 3–5: Sort out the handshake afterward.",
        tier: 4,
        xp: 0,
        consequence: "The full message travels unencrypted. Overflow intercepts it within ninety seconds. The route change is known. The convoy's new position is known. Overflow redirects its flood creatures to the new position. The convoy arrives to find a receiving party it did not invite.\n\nGuard cryptographer: 'The handshake is not bureaucracy. It is the thing that makes the message secure. Sending the message before the handshake is the same as sending it in the open — because no channel was ever established. The message was unprotected.'",
        scar: { name: "The Intercepted Message", description: "The route change was read by Overflow; the convoy was ambushed." },
      },
      {
        id: "E",
        text: "Step 1: King announces identity and secrecy level. Step 2: Convoy sends sealed identity back. Step 3: Both sides agree on the cipher. Step 4: Convoy sends encrypted confirmation of cipher. Step 5: King sends the real message.",
        tier: 2,
        xp: 50,
        consequence: "The channel establishes. The cipher is agreed on and confirmed. But when the real message arrives, the convoy discovers a minor cipher mismatch — a character set difference that corrupts three critical words. The route change is partially received. The convoy makes educated guesses about the corrupted words and guesses one incorrectly. One section of the convoy takes the wrong road.\n\nGuard cryptographer: 'You confirmed the cipher was agreed on — but you didn't test that it worked on both ends before sending the critical message. A test step before the real content catches mismatch errors. One section took the wrong road because of three corrupted words in an untested cipher. The test step is not optional.'",
        debt: { name: "Corrupted Words", description: "One convoy section took the wrong road due to cipher mismatch.", triggersAt: "Boss Gate" },
      },
    ],
  },

  // ─── ACT 5: BOSS GATE — OVERFLOW UNLEASHED ──────────────────────────────
  {
    actNumber: 5,
    title: "BOSS GATE — OVERFLOW UNLEASHED",
    mood: "danger",
    lines: makeLines(
      "OVERFLOW uses everything at once. The road attack — three simultaneous false convoys sending conflicting routing information. The impersonation layer — twelve fake messengers with perfect credentials hitting every gate simultaneously. The flood — a hundred thousand shadow creatures pressing every gate simultaneously. And the interception — a signal that mimics the secure channel's handshake, trying to insert itself between the king and the convoy. Every DEBT is active. Every SCAR is compounded. This is what the Shadow Mob was building toward. You have the tools you used correctly. Whatever you got wrong is now Overflow's weapon.",
      [
        { character: "OVERFLOW", line: "...we are the road and the messenger and the flood and the channel... we are all of it at once... every gap you left... every shortcut you took... every wrong step... that is where we live..." },
        { character: "KING", line: "Warden. This is it. Call the response." },
        { character: "VAEL", line: "[Steps forward. Face composed. Hands open, no weapon.] I know the Overflow's signal pattern. I've been watching it from the inside. If you want that information, I'm giving it to you now. Whether you trust me — that's the last call you make." },
      ]
    ),
    question: "Overflow attacks all four vectors simultaneously — routing, authentication, flooding, and interception. Every debt triggers. Every scar compounds. Choose the combined response.",
    choices: [
      {
        id: "A",
        text: "Route using shortest-path expansion, verify using challenge-response authentication, rate-limit the flood at 50 per gate per minute, and execute the correct 5-step handshake on all channels simultaneously.",
        tier: 1,
        xp: 150,
        consequence: "The routing calculation cuts through the false convoys — three paths eliminated by shortest-path math, one true route confirmed. Challenge-response catches eleven of twelve fake messengers instantly; the twelfth is caught by a secondary TTL check. Rate limiting holds all four gates at processing capacity — the flood presses but cannot breach. The handshake executes in correct order on all channels; Overflow's spoofed signal fails at the cipher negotiation step because it cannot answer the challenge. OVERFLOW BREAKS.\n\nThe Shadow Mob does not speak as it dissolves. The whispers stop one by one — each technique Overflow used answered by the technique that counters it. The king watches the last shadow creatures dissolve at the gate and says: 'Every gap closed. No gaps left.'",
      },
      {
        id: "B",
        text: "Trust Vael's intelligence about Overflow's signal pattern — use his inside knowledge to target the specific source of the combined attack.",
        tier: 2,
        xp: 75,
        consequence: "Vael's pattern is accurate. The source signal is identified and blocked. Three of four attack vectors collapse immediately — they were routed through the same source. The fourth — the flood — continues independently. You rate-limit it to manageable levels. Overflow retreats to regroup. The battle ends with Overflow diminished but not destroyed. Vael stands beside you afterward, and the question of what he is — informant, reformed agent, or something else — remains open.\n\nGuard captain: 'The source block worked. Vael's information was real — this time. Three vectors down through one action. The flood required its own solution. Overflow is not finished. But it is smaller than it was. Sometimes the inside knowledge is the most valuable tool. Sometimes it is the most dangerous one.'",
      },
    ],
  },
];
