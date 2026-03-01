import { SemanticTokenMap } from "@logicforge/types";
import { TOKEN_POOLS, TokenSynonymPool } from "./token-maps";

/**
 * randomizeChallenge - Semantic Content Randomization Layer
 * 
 * Replaces specified function names and variable names with randomly generated 
 * synonyms to defeat LLM semantic pattern matching while retaining exact logic structure.
 */
export function randomizeChallenge(challengeData: any) {
    // If no semantic tokens defined, return unmodified
    if (!challengeData.semanticTokens || Object.keys(challengeData.semanticTokens).length === 0) {
        return challengeData;
    }

    const tokens = challengeData.semanticTokens as SemanticTokenMap;
    const assignments: Record<string, string> = {};

    // For each defined token in the challenge, select a random synonym from the pool
    for (const [originalName, tokenMeta] of Object.entries(tokens)) {
        let pool: string[];

        if (tokenMeta.context && TOKEN_POOLS[tokenMeta.context as keyof typeof TOKEN_POOLS]) {
            pool = TOKEN_POOLS[tokenMeta.context as keyof typeof TOKEN_POOLS];
        } else {
            // Fallback pools
            pool = tokenMeta.type === "function"
                ? TOKEN_POOLS.GENERIC_FUNCTIONS
                : TOKEN_POOLS.GENERIC_VARIABLES;
        }

        const randomWord = pool[Math.floor(Math.random() * pool.length)];

        // Convert to target language convention (e.g. camelCase vs snake_case)
        const formatted = formatToConvention(randomWord, challengeData.language, tokenMeta.type);

        // Ensure we don't accidentally reuse a word if multiple tokens exist
        assignments[originalName] = preserveUniqueness(formatted, assignments);
    }

    // Find & Replace across all string fields where code/text lives
    const randomizedChallenge = { ...challengeData };

    // Replace in title and description
    randomizedChallenge.title = applyTokenReplacement(randomizedChallenge.title, assignments);
    randomizedChallenge.description = applyTokenReplacement(randomizedChallenge.description, assignments);

    // Replace in code template
    randomizedChallenge.codeTemplate = applyTokenReplacementCodeMode(randomizedChallenge.codeTemplate, assignments);

    // Replace in test cases (input output strings might contain variable names)
    if (Array.isArray(randomizedChallenge.testCases)) {
        randomizedChallenge.testCases = randomizedChallenge.testCases.map((tc: any) => ({
            ...tc,
            input: applyTokenReplacement(tc.input, assignments),
            expectedOutput: applyTokenReplacement(tc.expectedOutput, assignments)
        }));
    }

    return randomizedChallenge;
}

function applyTokenReplacement(text: string, assignments: Record<string, string>): string {
    if (!text) return text;
    let result = text;
    for (const [originalName, newName] of Object.entries(assignments)) {
        // Basic global replace
        const regex = new RegExp(`\\b${originalName}\\b`, 'g');
        result = result.replace(regex, newName);
    }
    return result;
}

// Slightly more careful regex for code replacements
function applyTokenReplacementCodeMode(code: string, assignments: Record<string, string>): string {
    if (!code) return code;
    let result = code;
    for (const [originalName, newName] of Object.entries(assignments)) {
        // Only replace whole words that aren't part of other identifiers
        // This regex looks for word boundaries
        const regex = new RegExp(`\\b${originalName}\\b`, 'g');
        result = result.replace(regex, newName);
    }
    return result;
}


function formatToConvention(word: string, language: string, type: string): string {
    if (language === 'PYTHON') {
        // Typically snake_case
        return word.toLowerCase().replace(/([A-Z])/g, "_$1").replace(/^_/, "");
    } else {
        // Java/C++ Typically camelCase
        return type === "class"
            ? word.charAt(0).toUpperCase() + word.slice(1) // PascalCase
            : word.charAt(0).toLowerCase() + word.slice(1); // camelCase
    }
}

function preserveUniqueness(candidate: string, existingAssignments: Record<string, string>): string {
    const existingValues = Object.values(existingAssignments);
    let finalWord = candidate;
    let counter = 1;

    while (existingValues.includes(finalWord)) {
        finalWord = `${candidate}${counter}`;
        counter++;
    }

    return finalWord;
}
