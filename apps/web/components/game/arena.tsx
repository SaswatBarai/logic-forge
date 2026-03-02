"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useGameEngine } from "@/hooks/use-game-engine";
import { useGameStore }  from "@/store/game-store";
import { CodeEditor }         from "./code-editor";
import { PromptCanvas }       from "./prompt-canvas";
import { TimerBar }           from "./timer-bar";
import { RoundResultOverlay } from "./round-result-overlay";
import { Activity, Play, CheckCircle2, XCircle, CopyX, Loader2 } from "lucide-react";

export function GameArena() {
    const { data: session } = useSession();

    const {
        challenge, submitAnswer,
        sessionId, currentRound, totalRounds, players,
    } = useGameEngine();

    const [code, setCode]                 = useState(challenge?.codeTemplate || "");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setCode(challenge?.codeTemplate || "");
        setIsSubmitting(false);
    }, [challenge?.id]);

    const roundHistory = useGameStore((s) => s.roundHistory);
    const config       = useGameStore((s) => s.config);

    const isSingle = config?.playerFormat === "SINGLE";

    if (!challenge) return null;

    const myUserId  = session?.user?.email ?? session?.user?.id ?? "";
    const myPlayer  = players.find((p) => p.userId === myUserId);
    const oppPlayer = players.find((p) => p.userId !== myUserId);
    const myScore   = myPlayer?.score  ?? 0;
    const oppScore  = oppPlayer?.score ?? 0;

    const handleSubmit = () => {
        if (isSubmitting || !sessionId || !challenge.id) return;
        setIsSubmitting(true);
        submitAnswer(sessionId, challenge.id, code);
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

                    {/* ✅ Score HUD: solo shows only YOU, dual shows YOU + OPP */}
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
                                            Code Editor
                                        </span>
                                        <button
                                            onClick={handleSubmit}
                                            disabled={isSubmitting}
                                            className="arcade-btn bg-primary px-4 py-1.5 border-2 border-foreground shadow-retro-sm text-xs font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-50 hover:scale-105 active:scale-95 transition-transform"
                                        >
                                            {isSubmitting ? (
                                                <><Loader2 className="h-3.5 w-3.5 animate-spin" />Running…</>
                                            ) : (
                                                <><Play className="h-3.5 w-3.5" />Run Code</>
                                            )}
                                        </button>
                                    </div>
                                    <div className="flex-1 min-h-0">
                                        <CodeEditor
                                            language="python"
                                            code={code}
                                            onChange={(val) => setCode(val || "")}
                                        />
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
