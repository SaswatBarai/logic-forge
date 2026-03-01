"use client";

import { useGameStore } from "@/store/game-store";
import { Button } from "@/components/ui/button";
import { Trophy, Swords, Medal } from "lucide-react";

const VERDICT_COLORS: Record<string, string> = {
    CORRECT: "text-emerald-400",
    INCORRECT: "text-rose-400",
    TIMEOUT: "text-amber-400",
    COMPILE_ERROR: "text-orange-400",
    RUNTIME_ERROR: "text-rose-400",
    PARTIAL: "text-yellow-400",
    PENDING: "text-zinc-400",
};

export function ResultsScreen() {
    const totalScore = useGameStore((s) => s.totalScore);
    const roundHistory = useGameStore((s) => s.roundHistory);
    const maxRounds = useGameStore((s) => s.maxRounds);
    const opponentScore = useGameStore((s) => s.opponentScore);

    const correctCount = roundHistory.filter((r) => r.verdict === "CORRECT").length;

    // Determine outcome
    const isWin = totalScore > opponentScore;
    const isDraw = totalScore === opponentScore;

    const OutcomeIcon = isWin ? Trophy : isDraw ? Medal : Swords;
    const outcomeColor = isWin ? "text-amber-400" : isDraw ? "text-zinc-300" : "text-rose-400";
    const outcomeLabel = isWin ? "Victory!" : isDraw ? "Draw" : "Defeated";
    const outcomeSub = isWin ? "You dominated the arena." : isDraw ? "Evenly matched." : "Better luck next time.";

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6">
            <div className="w-full max-w-2xl space-y-8">
                {/* Outcome banner */}
                <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="relative inline-block">
                        <div className={`absolute inset-0 blur-3xl rounded-full ${outcomeColor} opacity-20 scale-150`} />
                        <OutcomeIcon className={`h-24 w-24 ${outcomeColor} relative z-10`} />
                    </div>
                    <h1 className={`text-6xl font-black ${outcomeColor}`}>{outcomeLabel}</h1>
                    <p className="text-zinc-400 text-lg">{outcomeSub}</p>
                </div>

                {/* Score summary */}
                <div className="grid grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
                        <div className="text-3xl font-black text-emerald-400">{totalScore}</div>
                        <div className="text-zinc-500 text-xs mt-1 uppercase tracking-widest">Your Score</div>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
                        <div className="text-3xl font-black text-zinc-100">{correctCount}/{maxRounds}</div>
                        <div className="text-zinc-500 text-xs mt-1 uppercase tracking-widest">Correct</div>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
                        <div className="text-3xl font-black text-rose-400">{opponentScore}</div>
                        <div className="text-zinc-500 text-xs mt-1 uppercase tracking-widest">Opponent</div>
                    </div>
                </div>

                {/* Per-round breakdown */}
                {roundHistory.length > 0 && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                        <div className="px-4 py-3 border-b border-zinc-800">
                            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-widest">Round Breakdown</h2>
                        </div>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-zinc-500 text-xs uppercase tracking-wider">
                                    <th className="text-left px-4 py-2">Round</th>
                                    <th className="text-left px-4 py-2">Verdict</th>
                                    <th className="text-right px-4 py-2">Time</th>
                                    <th className="text-right px-4 py-2">Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {roundHistory.map((r) => (
                                    <tr key={r.roundNumber} className="border-t border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                                        <td className="px-4 py-3 text-zinc-300 font-mono">#{r.roundNumber}</td>
                                        <td className={`px-4 py-3 font-semibold ${VERDICT_COLORS[r.verdict] ?? "text-zinc-400"}`}>
                                            {r.verdict}
                                        </td>
                                        <td className="px-4 py-3 text-right text-zinc-400 font-mono">
                                            {r.executionTimeMs > 0 ? `${r.executionTimeMs}ms` : "—"}
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-zinc-100">
                                            +{r.score}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* CTA */}
                <div className="flex gap-4 justify-center animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
                    <Button
                        size="lg"
                        onClick={() => (window.location.href = "/arcade")}
                        className="px-10 py-6 text-base rounded-full"
                    >
                        Play Again
                    </Button>
                    <Button
                        size="lg"
                        variant="outline"
                        onClick={() => (window.location.href = "/")}
                        className="px-10 py-6 text-base rounded-full border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    >
                        Home
                    </Button>
                </div>
            </div>
        </div>
    );
}
