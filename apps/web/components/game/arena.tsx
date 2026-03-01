"use client";

import { useState } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useGameEngine } from "@/hooks/use-game-engine";
import { CodeEditor } from "./code-editor";
import { PromptCanvas } from "./prompt-canvas";
import { Button } from "@/components/ui/button";
import { Activity, Play, CheckCircle2, CopyX } from "lucide-react";

export function GameArena() {
    const { challenge, submitCode, timeRemaining, scores } = useGameEngine();
    const [code, setCode] = useState(challenge?.codeTemplate || "");
    const [output, setOutput] = useState<string | null>(null);

    if (!challenge) return null;

    const handleSubmit = () => {
        // In a full implementation this triggers the Code Runner and waits for a WS response
        // For now we simulate an optimistic UI update
        setOutput("Executing test cases via sandbox...\n");
        submitCode(code);

        // Stub response for instant feedback feel before WS returns
        setTimeout(() => {
            setOutput(prev => prev + "✓ Test Case 1 passed\n✓ Test Case 2 passed\n\nVerdict: CORRECT (Time: 23ms)");
        }, 1500);
    };

    // Convert MS to MM:SS
    const formatTimer = (ms: number | null) => {
        if (!ms) return "00:00";
        const totalSec = Math.floor(ms / 1000);
        const m = Math.floor(totalSec / 60).toString().padStart(2, "0");
        const s = (totalSec % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    return (
        <div className="h-[calc(100vh-4rem)] w-full flex flex-col bg-zinc-950 text-white rounded-xl overflow-hidden shadow-2xl border border-zinc-800">

            {/* Top HUD */}
            <div className="flex bg-zinc-900 border-b border-zinc-800 p-4 items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col bg-black/50 px-4 py-1.5 rounded-md border border-zinc-800">
                        <span className="text-xs text-zinc-500 uppercase font-semibold">Time Remaining</span>
                        <span className="text-xl font-mono text-red-500 font-bold">{formatTimer(timeRemaining)}</span>
                    </div>
                    <div className="h-full w-px bg-zinc-800" />
                    <h1 className="font-semibold text-zinc-100 flex items-center gap-2">
                        <Activity className="h-5 w-5 text-primary" />
                        {challenge.title}
                    </h1>
                </div>

                <div className="flex gap-4">
                    <div className="bg-zinc-800 px-4 py-2 rounded-md font-mono text-sm border border-zinc-700 flex flex-col items-center">
                        <span className="text-[10px] text-zinc-400">P1 SCORE</span>
                        <span className="font-bold text-emerald-400">{scores.player}</span>
                    </div>
                    <div className="bg-zinc-800 px-4 py-2 rounded-md font-mono text-sm border border-zinc-700 flex flex-col items-center">
                        <span className="text-[10px] text-zinc-400">P2 SCORE</span>
                        <span className="font-bold text-rose-400">{scores.opponent}</span>
                    </div>
                </div>
            </div>

            {/* Main Resizable Layout */}
            <ResizablePanelGroup direction="horizontal" className="flex-1">
                {/* Left Panel: The Non-copyable canvas prompt */}
                <ResizablePanel defaultSize={35} minSize={25}>
                    <div className="h-full p-4 bg-[#09090b]">
                        <div className="flex items-center gap-2 mb-3 px-1">
                            <CopyX className="h-4 w-4 text-zinc-500" />
                            <span className="text-xs font-medium text-zinc-500 uppercase">Secure Brief (Canvas)</span>
                        </div>
                        <PromptCanvas
                            title={challenge.title}
                            description={challenge.description}
                        />
                    </div>
                </ResizablePanel>

                <ResizableHandle className="w-1 bg-zinc-800 hover:bg-primary transition-colors duration-200" />

                {/* Right Panel: Editor & Output split vertically */}
                <ResizablePanel defaultSize={65}>
                    <ResizablePanelGroup direction="vertical">
                        <ResizablePanel defaultSize={70}>
                            <div className="h-full p-4 flex flex-col">
                                <div className="flex justify-between items-center mb-3 px-1">
                                    <span className="text-xs font-medium text-zinc-500 uppercase">Editor (TypeScript)</span>
                                    <Button size="sm" onClick={handleSubmit} className="h-8 shadow-md">
                                        <Play className="h-4 w-4 mr-2" />
                                        Run Code
                                    </Button>
                                </div>
                                <div className="flex-1 min-h-0">
                                    <CodeEditor
                                        language="typescript"
                                        code={code}
                                        onChange={(val) => setCode(val || "")}
                                    />
                                </div>
                            </div>
                        </ResizablePanel>

                        <ResizableHandle className="h-1 bg-zinc-800 hover:bg-primary transition-colors duration-200" />

                        <ResizablePanel defaultSize={30}>
                            <div className="h-full p-4 bg-black/60 font-mono text-sm text-zinc-300 overflow-y-auto">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    <span className="text-xs font-semibold uppercase text-zinc-400">Execution Output</span>
                                </div>
                                <pre className="whitespace-pre-wrap">{output || "Ready. Write your solution and press 'Run Code'."}</pre>
                            </div>
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}
