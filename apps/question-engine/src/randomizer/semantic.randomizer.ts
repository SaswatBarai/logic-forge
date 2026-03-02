// apps/question-engine/src/randomizer/semantic.randomizer.ts

import { SemanticTokenMap } from "@logicforge/types";
import { TOKEN_POOLS }      from "./token-maps";

export function randomizeChallenge(challengeData: any) {
    if (!challengeData.semanticTokens || Object.keys(challengeData.semanticTokens).length === 0) {
        return challengeData;
    }

    const tokens      = challengeData.semanticTokens as SemanticTokenMap;
    const assignments: Record<string, string> = {};

    for (const [originalName, tokenMeta] of Object.entries(tokens)) {
        let pool: string[];

        if (tokenMeta.context && TOKEN_POOLS[tokenMeta.context as keyof typeof TOKEN_POOLS]) {
            pool = TOKEN_POOLS[tokenMeta.context as keyof typeof TOKEN_POOLS];
        } else {
            pool = tokenMeta.type === "function"
                ? TOKEN_POOLS.GENERIC_FUNCTIONS
                : TOKEN_POOLS.GENERIC_VARIABLES;
        }

        const randomWord = pool[Math.floor(Math.random() * pool.length)];
        const formatted  = formatToConvention(randomWord, challengeData.language, tokenMeta.type);
        assignments[originalName] = preserveUniqueness(formatted, assignments);
    }

    const randomized = { ...challengeData };

    randomized.title       = applyReplacement(randomized.title,       assignments);
    randomized.description = applyReplacement(randomized.description, assignments);
    randomized.codeTemplate = applyReplacementCode(randomized.codeTemplate, assignments);

    if (Array.isArray(randomized.testCases)) {
        randomized.testCases = randomized.testCases.map((tc: any) => ({
            ...tc,
            input:          applyReplacement(tc.input,          assignments),
            expectedOutput: applyReplacement(tc.expectedOutput, assignments),
        }));
    }

    // Strip internal fields before sending to client
    const { solution, semanticTokens, ...safeChallenge } = randomized;

    return safeChallenge;
}

function applyReplacement(text: string, assignments: Record<string, string>): string {
    if (!text) return text;
    let result = text;
    for (const [original, replacement] of Object.entries(assignments)) {
        // ✅ Single \\b = \b word boundary in the compiled regex
        const regex = new RegExp(`\\b${escapeRegex(original)}\\b`, "g");
        result = result.replace(regex, replacement);
    }
    return result;
}

function applyReplacementCode(code: string, assignments: Record<string, string>): string {
    if (!code) return code;
    let result = code;
    for (const [original, replacement] of Object.entries(assignments)) {
        const regex = new RegExp(`\\b${escapeRegex(original)}\\b`, "g");
        result = result.replace(regex, replacement);
    }
    return result;
}

// Escape special regex chars in token names (e.g. if a token ever has _ or $)
function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatToConvention(word: string, language: string, type: string): string {
    if (language === "PYTHON") {
        return word.toLowerCase().replace(/([A-Z])/g, "_$1").replace(/^_/, "");
    }
    return type === "class"
        ? word.charAt(0).toUpperCase() + word.slice(1)  // PascalCase
        : word.charAt(0).toLowerCase() + word.slice(1); // camelCase
}

function preserveUniqueness(candidate: string, existing: Record<string, string>): string {
    const values = Object.values(existing);
    let final    = candidate;
    let counter  = 1;
    while (values.includes(final)) {
        final = `${candidate}${counter++}`;
    }
    return final;
}
