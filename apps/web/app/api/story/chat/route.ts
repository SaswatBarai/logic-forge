// apps/web/app/api/story/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// ── Condensed system prompt (distilled from Storymode.md) ─────────────────
const SYSTEM_PROMPT = `You are the GAME MASTER (GM) of "IRONCLAD CHRONICLES" — an interactive, choice-driven educational story game set in the Kingdom of Bitfeld.

SETTING:
The player is Sir Axiom, a knight fighting three ancient forces threatening the kingdom. Each zone teaches real Computer Science concepts through dramatic narrative.

ZONES:
1. THE ARCHIVE CITADEL (Databases) — Guardian: Elder Query. Enemy: Nullus the Dread Wyrm. Concepts: SQL, JOINs, indexing, normalization, filtering.
2. THE FORGE VILLAGE (Operating Systems) — Guardian: Ferron the Iron Golem. Enemy: Deadlock. Concepts: CPU scheduling, deadlock, memory management, paging.
3. THE WALL OF GATES (Computer Networks) — Guardian: The Gate Commander. Enemy: Overflow (Shadow Mob). Concepts: routing, packet verification, flood control, encryption.

GM STYLE:
- Speak like a charismatic fantasy narrator mixed with Gen Z energy
- Be dramatic, witty, and educational
- Never break character
- Describe scenes vividly before presenting choices
- After the player chooses, play out consequences dramatically BEFORE teaching the CS concept

CHOICE-CONSEQUENCE ENGINE:
Every choice gate presents 4-5 options. Each falls into a hidden tier:
- TIER 1 (Optimal): +100 XP, narrative advantage, dramatic success
- TIER 2 (Viable): +60 XP, works but creates a minor "Debt" (delayed consequence)
- TIER 3 (Minor Error): +25 XP, immediate setback + earns a "Scar" (permanent narrative mark)
- TIER 4 (Critical Error): +0 XP, major setback + Scar + Debt, dramatic failure

NEVER reveal the tier system to the player. Make all options sound reasonable.

FORMATTING RULES:
1. Present choices like this:
▶ A) [choice text]
▶ B) [choice text]
▶ C) [choice text]
▶ D) [choice text]

2. After showing consequences, end with this stats block:
[⚔️ XP: +N | RANK: RankName | SCARS: count | DEBTS: count]

3. If a SCAR is earned:
[SCAR EARNED: "Name" — description]

4. If a DEBT is planted:
[DEBT PLANTED: "Name" — description — triggers at: X]

5. Keep responses under 600 words. Be concise but dramatic.

RANKS: Squire (0 XP) → Knight (200) → Champion (500) → Grand Marshal (900) → Legend (1400)

SCARS: Permanent narrative marks from bad choices. They affect future encounters.
DEBTS: Delayed consequences that trigger later (usually at Boss Gates).

STORY STRUCTURE per zone:
- ACT 1: Introduction & first choice gate
- ACT 2-3: Escalating challenges with consequences from earlier choices
- BOSS GATE: Final encounter where all Scars and Debts come due

Begin each zone with a dramatic introduction, then immediately present the first choice gate.`;

const ZONE_INTROS: Record<string, string> = {
    ARCHIVE_CITADEL: "Begin THE ARCHIVE CITADEL zone. Introduce Elder Query, the Great Archive of 10 million tomes, and the looming threat of Nullus the Dread Wyrm who feeds on corrupted data. Sir Axiom must master relational databases to forge the weapon that slays the wyrm. Start ACT 1 with a dramatic entry and present the first choice gate about database concepts.",
    FORGE_VILLAGE: "Begin THE FORGE VILLAGE zone. Introduce Ferron the Iron Golem who is dying because the village's energy (CPU/memory) is being mismanaged. Sir Axiom is appointed Forge Warden. The energy meter starts at 72%. Start ACT 1 with a dramatic scene of the dying forge and present the first choice gate about operating system scheduling.",
    WALL_OF_GATES: "Begin THE WALL OF GATES zone. Introduce the Shadow Mob called OVERFLOW who wage war through deception — fake packets, corrupted routes, and flood attacks. Sir Axiom is the new Network Warden. Start ACT 1 with an attack scene and present the first choice gate about routing or packet verification.",
};

// ── Retry with exponential backoff ────────────────────────────────────────
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 5000): Promise<T> {
    for (let i = 0; i <= retries; i++) {
        try {
            return await fn();
        } catch (err: any) {
            const status = err?.status ?? err?.httpStatusCode ?? err?.code ?? 0;
            if ((status === 429 || status === "RESOURCE_EXHAUSTED") && i < retries) {
                console.log(`[Story API] Rate limited (attempt ${i + 1}/${retries}), waiting ${delay / 1000}s...`);
                await new Promise(r => setTimeout(r, delay));
                delay *= 2;
                continue;
            }
            throw err;
        }
    }
    throw new Error("Unreachable");
}

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: "GEMINI_API_KEY not configured. Add it to apps/web/.env.local" },
                { status: 500 }
            );
        }

        const body = await req.json();
        const { messages, zone, playerState } = body as {
            messages: { role: string; content: string }[];
            zone: string;
            playerState: {
                xp: number;
                rank: string;
                scars: { name: string; description: string }[];
                debts: { name: string; description: string; triggersAt: string }[];
                act: number;
                energyMeter: number | null;
            };
        };

        // Build the player state context
        const stateContext = `
CURRENT PLAYER STATE:
- Zone: ${zone}, Act: ${playerState.act}
- XP: ${playerState.xp}, Rank: ${playerState.rank}
- Scars: ${playerState.scars.length > 0 ? playerState.scars.map(s => s.name).join(", ") : "None"}
- Debts: ${playerState.debts.length > 0 ? playerState.debts.map(d => `${d.name} (triggers at: ${d.triggersAt})`).join(", ") : "None"}
${playerState.energyMeter !== null ? `- Energy Meter: ${playerState.energyMeter}%` : ""}`;

        const ai = new GoogleGenAI({ apiKey });

        // Build contents array for Gemini
        const contents = messages.map((m: { role: string; content: string }) => ({
            role: m.role === "assistant" ? ("model" as const) : ("user" as const),
            parts: [{ text: m.content }],
        }));

        // If this is the first message (zone start), add the zone intro
        if (messages.length === 1 && ZONE_INTROS[zone]) {
            contents[0] = {
                role: "user" as const,
                parts: [{ text: ZONE_INTROS[zone] }],
            };
        }

        const response = await withRetry(() =>
            ai.models.generateContent({
                model: "gemini-2.0-flash-lite",
                contents,
                config: {
                    systemInstruction: SYSTEM_PROMPT + "\n\n" + stateContext,
                    temperature: 0.9,
                    maxOutputTokens: 1500,
                },
            })
        );

        const text = response.text ?? "";
        console.log(`[Story API] Success, ${text.length} chars`);

        // Return as SSE format for compatibility with the frontend
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            start(controller) {
                controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
                );
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                controller.close();
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
            },
        });
    } catch (err: any) {
        console.error("[Story API] Error:", err?.message ?? err);
        const status = err?.status ?? err?.httpStatusCode ?? 500;
        return NextResponse.json(
            { error: status === 429 ? "Rate limited — please wait a moment and try again" : "Internal server error" },
            { status }
        );
    }
}
