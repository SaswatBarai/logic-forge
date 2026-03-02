"use client";

import { useState, useEffect     } from "react";
import { useSession } from "next-auth/react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useGameEngine } from "@/hooks/use-game-engine";
import { useGameStore } from "@/store/game-store";
import { CodeEditor } from "./code-editor";
import { PromptCanvas } from "./prompt-canvas";
import { TimerBar } from "./timer-bar";
import { RoundResultOverlay } from "./round-result-overlay";
import { Activity, Play, CheckCircle2, XCircle, CopyX, Loader2, Heart } from "lucide-react";

export function GameArena() {
    const { data: session } = useSession();

    const {
        challenge,
        submitAnswer,
        sessionId,
        currentRound,
        totalRounds,
        players,
        myLives,
        config,
    } = useGameEngine();

    const isLiveMode = config?.sessionType === "LIVE";
    const isTimerMode = config?.sessionType === "TIMER";

    const [code, setCode] = useState(challenge?.codeTemplate || "");
    const [tracingAnswer, setTracingAnswer] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isTracing = challenge?.category === "STATE_TRACING";

    const roundHistory = useGameStore((s) => s.roundHistory);

    // Reset both answer states whenever the challenge changes (new round)
    useEffect(() => {
        setCode(challenge?.codeTemplate || "");
        setTracingAnswer("");
    }, [challenge?.id]);

    if (!challenge) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 min-h-[60vh]">
                <Loader2 className="size-12 animate-spin text-primary" />
                <p className="text-lg font-bold uppercase tracking-widest">Loading round…</p>
                <p className="text-sm text-muted-foreground max-w-md text-center">
                    Preparing your challenge. This should only take a moment.
                </p>
            </div>
        );
    }

    const myUserId = session?.user?.email ?? session?.user?.id ?? "";
    const myPlayer = players.find((p) => p.userId === myUserId);
    const oppPlayer = players.find((p) => p.userId !== myUserId);
    const myScore = myPlayer?.score ?? 0;
    const oppScore = oppPlayer?.score ?? 0;

    const handleSubmit = () => {
        if (isSubmitting || !sessionId || !challenge.id) return;
        setIsSubmitting(true);
        const answer = isTracing ? tracingAnswer : code;
        submitAnswer(sessionId, challenge.id, answer);
        setTimeout(() => setIsSubmitting(false), 3000);
    };

    const lastEntry = roundHistory[roundHistory.length - 1];
    const outputContent = lastEntry
        ? [
            `Verdict: ${lastEntry.verdict}`,
            `Score: +${lastEntry.score} pts`,
            lastEntry.executionTimeMs > 0 ? `Execution time: ${lastEntry.executionTimeMs}ms` : null,
        ].filter(Boolean).join("\n")
        : null;

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
                    </div>

                    {/* Right side: score + lives (Live Mode) */}
                    <div className="flex gap-3 items-center">
                        <div className="bg-accent/10 px-4 py-2 border-2 border-foreground shadow-retro-sm flex flex-col items-center min-w-[70px]">
                            <span className="text-[9px] font-black uppercase tracking-widest text-accent">You</span>
                            <span className="font-black text-lg font-mono text-accent">{myScore}</span>
                        </div>
                        {players.length > 1 && (
                            <div className="bg-destructive/10 px-4 py-2 border-2 border-foreground shadow-retro-sm flex flex-col items-center min-w-[70px]">
                                <span className="text-[9px] font-black uppercase tracking-widest text-destructive">Opp</span>
                                <span className="font-black text-lg font-mono text-destructive">{oppScore}</span>
                            </div>
                        )}
                        {/* Lives display — only for Live Mode */}
                        {isLiveMode && (
                            <div className="px-4 py-2 border-2 border-foreground shadow-retro-sm flex flex-col items-center bg-card">
                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Lives</span>
                                <div className="flex gap-0.5 mt-0.5">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <Heart
                                            key={i}
                                            className={`h-4 w-4 transition-colors ${i < myLives
                                                ? "text-red-500 fill-red-500"
                                                : "text-slate-600 fill-slate-800"
                                                }`}
                                        />
                                    ))}
                                </div>
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
                                <CopyX className="h-4 w-4 text-slate-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Secure Brief (Canvas)
                                </span>
                            </div>
                            <PromptCanvas title={challenge.title} description={challenge.description} />
                        </div>
                    </ResizablePanel>

                    <ResizableHandle className="w-0.5 bg-foreground/20 hover:bg-primary transition-colors duration-200" />

                    <ResizablePanel defaultSize={65}>
                        <ResizablePanelGroup direction="vertical">
                            <ResizablePanel defaultSize={70}>
                                <div className="h-full p-4 flex flex-col">
                                    <div className="flex justify-between items-center mb-3 px-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            {isTracing ? "Answer" : "Code Editor"}
                                        </span>
                                        <button
                                            onClick={handleSubmit}
                                            disabled={isSubmitting || (isTracing && !tracingAnswer.trim())}
                                            className="arcade-btn bg-primary px-4 py-1.5 border-2 border-foreground shadow-retro-sm text-xs font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-50 hover:scale-105 active:scale-95 transition-transform"
                                        >
                                            {isSubmitting ? (
                                                <><Loader2 className="h-3.5 w-3.5 animate-spin" />Running…</>
                                            ) : isTracing ? (
                                                <><CheckCircle2 className="h-3.5 w-3.5" />Submit Answer</>
                                            ) : (
                                                <><Play className="h-3.5 w-3.5" />Run Code</>
                                            )}
                                        </button>
                                    </div>
                                    <div className="flex-1 min-h-0">
                                        {isTracing ? (
                                            // ── STATE_TRACING: plain-text answer input ──────────────
                                            <div className="h-full flex flex-col gap-4 pt-2">
                                                <p className="text-xs text-slate-400 font-medium px-1">
                                                    Read the code in the panel on the left, trace the execution mentally, then type your answer below.
                                                </p>
                                                <textarea
                                                    className="flex-1 w-full resize-none rounded-md border border-zinc-700 bg-zinc-950 px-4 py-3 font-mono text-base text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                                    placeholder="Your answer (e.g. 3 or [1, 2, 3])…"
                                                    value={tracingAnswer}
                                                    onChange={(e) => setTracingAnswer(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        // Ctrl/Cmd+Enter to submit
                                                        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") handleSubmit();
                                                    }}
                                                    spellCheck={false}
                                                    autoFocus
                                                />
                                                <p className="text-[10px] text-slate-600 font-mono px-1">
                                                    Tip: press <kbd className="px-1 py-0.5 border border-slate-700 rounded text-[9px]">Ctrl+Enter</kbd> to submit
                                                </p>
                                            </div>
                                        ) : (
                                            // ── All other categories: Monaco code editor ────────────
                                            <CodeEditor
                                                language="python"
                                                code={code}
                                                onChange={(val) => setCode(val || "")}
                                            />
                                        )}
                                    </div>
                                </div>
                            </ResizablePanel>

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
                                            <CheckCircle2 className="h-4 w-4 text-slate-600" />
                                        )}
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                            Execution Output
                                        </span>
                                    </div>
                                    <pre className="whitespace-pre-wrap">
                                        {outputContent || "Ready. Write your solution and press 'Run Code'."}
                                    </pre>
                                </div>
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
        </>
    );
}
