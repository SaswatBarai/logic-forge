"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useGameEngine } from "@/hooks/use-game-engine";
import { useGameStore }  from "@/store/game-store";
import { CodeEditor }         from "./code-editor";
import { McqSelector }        from "./mcq-selector";
import { PromptCanvas }       from "./prompt-canvas";
import { TimerBar }           from "./timer-bar";
import { RoundResultOverlay } from "./round-result-overlay";
import { Activity, Play, CheckCircle2, XCircle, CopyX, Loader2, Zap, Eye } from "lucide-react";

const BLANK_CATEGORIES   = new Set(["THE_MISSING_LINK", "SYNTAX_ERROR_DETECTION"]);
const MCQ_CATEGORIES     = new Set(["THE_BOTTLENECK_BREAKER"]);
const TRACING_CATEGORIES = new Set(["STATE_TRACING"]);

function extractBlankAnswer(template: string, filledCode: string): string {
    const BLANK = "________";
    const blankIdx = template.indexOf(BLANK);
    if (blankIdx === -1) return filledCode;
    const before = template.substring(0, blankIdx);
    const after  = template.substring(blankIdx + BLANK.length);
    const startIdx = filledCode.indexOf(before);
    if (startIdx === -1) return filledCode;
    const valueStart = startIdx + before.length;
    const endIdx = after.length > 0 ? filledCode.lastIndexOf(after) : filledCode.length;
    if (endIdx === -1 || endIdx <= valueStart) return filledCode;
    return filledCode.substring(valueStart, endIdx).trim();
}

function resolveEditorLanguage(lang?: string): string {
    switch (lang?.toUpperCase()) {
        case "CPP":    return "cpp";
        case "JAVA":   return "java";
        case "PYTHON": return "python";
        default:       return "python";
    }
}

export function GameArena() {
    const { data: session } = useSession();

    const {
        challenge, submitAnswer,
        sessionId, currentRound, totalRounds, players,
    } = useGameEngine();

    const [code, setCode]                   = useState(challenge?.codeTemplate || "");
    const [mcqSelected, setMcqSelected]     = useState<string | null>(null);
    const [tracingAnswer, setTracingAnswer] = useState("");
    const [isSubmitting, setIsSubmitting]   = useState(false);

    useEffect(() => {
        setCode(challenge?.codeTemplate || "");
        setMcqSelected(null);
        setTracingAnswer("");
        setIsSubmitting(false);
    }, [challenge?.id]);

    const roundHistory = useGameStore((s) => s.roundHistory);
    const config       = useGameStore((s) => s.config);

    const isSingle           = config?.playerFormat === "SINGLE";
    const isBlankChallenge   = BLANK_CATEGORIES.has(challenge?.category ?? "");
    const isMcqChallenge     = MCQ_CATEGORIES.has(challenge?.category ?? "") && !!challenge?.mcqOptions;
    const isTracingChallenge = TRACING_CATEGORIES.has(challenge?.category ?? "");
    const editorLanguage     = resolveEditorLanguage(challenge?.language);

    if (!challenge) return null;

    const myUserId  = session?.user?.email ?? session?.user?.id ?? "";
    const myPlayer  = players.find((p) => p.userId === myUserId);
    const oppPlayer = players.find((p) => p.userId !== myUserId);
    const myScore   = myPlayer?.score  ?? 0;
    const oppScore  = oppPlayer?.score ?? 0;

    const canSubmit = isMcqChallenge
        ? !!mcqSelected
        : isTracingChallenge
            ? tracingAnswer.trim().length > 0
            : true;

    const handleSubmit = () => {
        if (isSubmitting || !sessionId || !challenge.id || !canSubmit) return;
        setIsSubmitting(true);

        let answer: string;
        if (isMcqChallenge) {
            answer = mcqSelected!;
        } else if (isTracingChallenge) {
            answer = tracingAnswer.trim();
        } else if (isBlankChallenge) {
            answer = extractBlankAnswer(challenge.codeTemplate, code);
        } else {
            answer = code;
        }

        submitAnswer(sessionId, challenge.id, answer);
        setTimeout(() => setIsSubmitting(false), 3000);
    };

    const lastEntry     = roundHistory[roundHistory.length - 1];
    const outputContent = lastEntry
        ? [
            `Verdict: ${lastEntry.verdict}`,
            `Score: +${lastEntry.score} pts`,
            lastEntry.executionTimeMs > 0 ? `Execution time: ${lastEntry.executionTimeMs}ms` : null,
          ].filter(Boolean).join("\n")
        : null;

    // ── CHANGE 1: TRACING no longer passes code to canvas ──
    const canvasCodeTemplate = isMcqChallenge
        ? challenge.codeTemplate
        : undefined;

    return (
        <>
            <RoundResultOverlay />

            <div
                className="h-[calc(100vh-4rem)] w-full flex flex-col overflow-hidden border-2 border-foreground shadow-retro-lg"
                style={{ backgroundColor: "hsl(var(--editor-bg))" }}
            >
                {/* ── Top HUD ── */}
                <div
                    className="flex p-3 items-center justify-between shrink-0 border-b-2 border-foreground"
                    style={{ backgroundColor: "hsl(var(--editor-header))" }}
                >
                    <div className="flex items-center gap-4">
                        <div className="bg-primary px-4 py-1.5 border-2 border-foreground shadow-retro-sm">
                            <span className="text-[10px] font-black uppercase tracking-widest">Round</span>
                            <span className="text-xl font-mono font-black block">{currentRound}/{totalRounds}</span>
                        </div>
                        <div className="h-8 w-0.5 bg-foreground/20" />
                        <h1 className="font-black text-white uppercase tracking-wide flex items-center gap-2 text-sm">
                            <Activity className="h-5 w-5 text-primary" />
                            {challenge.title}
                        </h1>
                        {isMcqChallenge && (
                            <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-primary border border-primary px-2 py-0.5">
                                <Zap className="h-3 w-3" /> Bottleneck · Pick the fastest
                            </span>
                        )}
                        {isTracingChallenge && (
                            <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-amber-400 border border-amber-400 px-2 py-0.5">
                                <Eye className="h-3 w-3" /> State Tracing · Enter the value
                            </span>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <div className="bg-accent/10 px-4 py-2 border-2 border-foreground shadow-retro-sm flex flex-col items-center min-w-[70px]">
                            <span className="text-[9px] font-black uppercase tracking-widest text-accent">You</span>
                            <span className="font-black text-lg font-mono text-accent">{myScore}</span>
                        </div>
                        {!isSingle && (
                            <div className="bg-destructive/10 px-4 py-2 border-2 border-foreground shadow-retro-sm flex flex-col items-center min-w-[70px]">
                                <span className="text-[9px] font-black uppercase tracking-widest text-destructive">Opp</span>
                                <span className="font-black text-lg font-mono text-destructive">{oppScore}</span>
                            </div>
                        )}
                    </div>
                </div>

                <TimerBar />

                {/* ── Main Layout ── */}
                <ResizablePanelGroup direction="horizontal" className="flex-1">
                    <ResizablePanel defaultSize={35} minSize={25}>
                        <div className="h-full p-4" style={{ backgroundColor: "hsl(230 40% 10%)" }}>
                            <div className="flex items-center gap-2 mb-3 px-1">
                                <CopyX className="h-4 w-4 text-slate-300" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-200">
                                    Secure Brief (Canvas)
                                </span>
                            </div>
                            <PromptCanvas
                                title={challenge.title}
                                description={challenge.description}
                                codeTemplate={canvasCodeTemplate}
                                codeLabel="▶ SLOW CODE (O(N²))"
                            />
                        </div>
                    </ResizablePanel>

                    <ResizableHandle className="w-0.5 bg-foreground/20 hover:bg-primary transition-colors duration-200" />

                    <ResizablePanel defaultSize={65}>
                        <ResizablePanelGroup direction="vertical">
                            <ResizablePanel defaultSize={isMcqChallenge ? 100 : isTracingChallenge ? 100 : 70}>
                                <div className="h-full p-4 flex flex-col">
                                    <div className="flex justify-between items-center mb-3 px-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-200">
                                            {isMcqChallenge
                                                ? "Select the O(N) Refactor"
                                                : isTracingChallenge
                                                    ? "Trace · Read code, enter the answer below"
                                                    : isBlankChallenge
                                                        ? "Code Editor · Fill in the blank only"
                                                        : "Code Editor"}
                                        </span>
                                        <button
                                            onClick={handleSubmit}
                                            disabled={isSubmitting || !canSubmit}
                                            className="arcade-btn bg-primary px-4 py-1.5 border-2 border-foreground shadow-retro-sm text-xs font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-50 hover:scale-105 active:scale-95 transition-transform"
                                        >
                                            {isSubmitting ? (
                                                <><Loader2 className="h-3.5 w-3.5 animate-spin" />Checking…</>
                                            ) : isMcqChallenge ? (
                                                <><Zap className="h-3.5 w-3.5" />Submit Pick</>
                                            ) : isTracingChallenge ? (
                                                <><Eye className="h-3.5 w-3.5" />Submit Answer</>
                                            ) : (
                                                <><Play className="h-3.5 w-3.5" />Run Code</>
                                            )}
                                        </button>
                                    </div>

                                    <div className="flex-1 min-h-0">
                                        {isMcqChallenge ? (
                                            <McqSelector
                                                options={challenge.mcqOptions!}
                                                language={editorLanguage}
                                                selected={mcqSelected}
                                                onSelect={setMcqSelected}
                                            />
                                        ) : isTracingChallenge ? (
                                            // ── CHANGE 2: code on top + answer input below ──
                                            <div className="h-full flex flex-col gap-4">

                                                {/* Read-only code block */}
                                                <div className="flex-1 min-h-0 flex flex-col overflow-hidden rounded border border-zinc-700 bg-zinc-950">
                                                    <div className="flex items-center gap-2 px-3 py-1.5 border-b border-zinc-700 bg-zinc-900 shrink-0">
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-amber-400">
                                                            ▶ Trace This Code
                                                        </span>
                                                        <span className="ml-auto text-[9px] text-zinc-400 font-mono">{editorLanguage}</span>
                                                    </div>
                                                    <pre className="flex-1 overflow-auto p-4 text-sm font-mono text-blue-300 whitespace-pre leading-6">
                                                        {challenge.codeTemplate}
                                                    </pre>
                                                </div>

                                                {/* Divider */}
                                                <div className="h-px bg-zinc-700 shrink-0" />

                                                {/* Answer input */}
                                                <div className="shrink-0 flex flex-col items-center gap-3 pb-2">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300">
                                                        Enter the final return value
                                                    </p>
                                                    <input
                                                        type="text"
                                                        value={tracingAnswer}
                                                        onChange={(e) => setTracingAnswer(e.target.value)}
                                                        onKeyDown={(e) => e.key === "Enter" && canSubmit && handleSubmit()}
                                                        placeholder="e.g. 3"
                                                        className="w-52 text-center text-2xl font-mono font-black bg-transparent border-2 border-zinc-600 px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-400 transition-colors rounded"
                                                        autoFocus
                                                    />
                                                    <p className="text-[10px] font-mono text-zinc-400">
                                                        Press <span className="text-zinc-300 font-semibold">Enter</span> or click Submit Answer
                                                    </p>
                                                </div>

                                            </div>
                                        ) : (
                                            <CodeEditor
                                                language={editorLanguage}
                                                code={code}
                                                onChange={(val) => setCode(val || "")}
                                            />
                                        )}
                                    </div>
                                </div>
                            </ResizablePanel>

                            {/* Hide output panel for MCQ and TRACING */}
                            {!isMcqChallenge && !isTracingChallenge && (
                                <>
                                    <ResizableHandle className="h-0.5 bg-foreground/20 hover:bg-primary transition-colors duration-200" />
                                    <ResizablePanel defaultSize={30}>
                                        <div
                                            className="h-full p-4 font-mono text-sm text-slate-300 overflow-y-auto"
                                            style={{ backgroundColor: "hsl(230 40% 8%)" }}
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                {lastEntry?.verdict === "CORRECT" ? (
                                                    <CheckCircle2 className="h-4 w-4 text-accent" />
                                                ) : lastEntry ? (
                                                    <XCircle className="h-4 w-4 text-destructive" />
                                                ) : (
                                                    <CheckCircle2 className="h-4 w-4 text-slate-500" />
                                                )}
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                                                    Execution Output
                                                </span>
                                            </div>
                                            <pre className="whitespace-pre-wrap text-slate-200">
                                                {outputContent || "Ready. Write your solution and press 'Run Code'."}
                                            </pre>
                                        </div>
                                    </ResizablePanel>
                                </>
                            )}
                        </ResizablePanelGroup>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
        </>
    );
}
