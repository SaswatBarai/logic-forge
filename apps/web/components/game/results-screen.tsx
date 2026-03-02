"use client";

import { motion } from "framer-motion";
import { useGameStore } from "@/store/game-store";
import { Trophy, Swords, Medal } from "lucide-react";

const VERDICT_COLORS: Record<string, string> = {
    CORRECT: "text-accent",
    INCORRECT: "text-destructive",
    TIMEOUT: "text-primary",
    COMPILE_ERROR: "text-destructive",
    RUNTIME_ERROR: "text-destructive",
    PARTIAL: "text-primary",
    PENDING: "text-muted-foreground",
};

export function ResultsScreen() {
    const roundHistory = useGameStore((s) => s.roundHistory);
    const totalRounds = useGameStore((s) => s.totalRounds);
    const players = useGameStore((s) => s.players);

    // Derive scores from the players array (same source as the arena HUD)
    const myScore = players[0]?.score ?? 0;
    const opponentScore = players[1]?.score ?? 0;

    const correctCount = roundHistory.filter((r) => r.verdict === "CORRECT").length;

    const isWin = myScore > opponentScore;
    const isDraw = myScore === opponentScore;

    const OutcomeIcon = isWin ? Trophy : isDraw ? Medal : Swords;
    const outcomeColor = isWin ? "text-primary" : isDraw ? "text-muted-foreground" : "text-destructive";
    const outcomeBg = isWin ? "bg-primary" : isDraw ? "bg-card" : "bg-destructive";
    const outcomeLabel = isWin ? "Victory!" : isDraw ? "Draw" : "Defeated";
    const outcomeSub = isWin ? "You dominated the arena." : isDraw ? "Evenly matched." : "Better luck next round.";

    return (
        <div className="flex-1 flex items-center justify-center px-6 py-16 lg:py-24">
            <div className="w-full max-w-2xl space-y-10">
                {/* Outcome banner */}
                <motion.div
                    className="text-center space-y-6"
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                    <motion.div
                        className={`${outcomeBg}/10 size-28 mx-auto border-2 border-foreground flex items-center justify-center shadow-retro-lg`}
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                    >
                        <OutcomeIcon className={`size-14 ${outcomeColor}`} />
                    </motion.div>
                    <h1 className={`text-6xl md:text-7xl font-black uppercase tracking-tighter ${outcomeColor}`}>
                        {outcomeLabel}
                    </h1>
                    <p className="text-lg font-medium">{outcomeSub}</p>
                </motion.div>

                {/* Score summary */}
                <motion.div
                    className="grid grid-cols-3 gap-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.15 }}
                >
                    {[
                        { label: "Your Score", value: myScore, color: "bg-accent", textColor: "text-foreground" },
                        { label: "Correct", value: `${correctCount}/${totalRounds}`, color: "bg-primary", textColor: "text-foreground" },
                        { label: "Opponent", value: opponentScore, color: "bg-destructive", textColor: "text-foreground" },
                    ].map((stat) => (
                        <div
                            key={stat.label}
                            className="border-2 border-foreground bg-card shadow-retro p-5 text-center"
                        >
                            <div className={`h-2 w-full ${stat.color} border-b-2 border-foreground -mt-5 -mx-0 mb-4`} style={{ margin: "-1.25rem -0px 1rem", width: "calc(100%)" }} />
                            <div className="text-3xl font-black">{stat.value}</div>
                            <div className="text-[10px] font-black uppercase tracking-widest mt-1 text-muted-foreground">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </motion.div>

                {/* Per-round breakdown */}
                {roundHistory.length > 0 && (
                    <motion.div
                        className="border-2 border-foreground bg-card shadow-retro-lg overflow-hidden"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                    >
                        <div className="px-5 py-3 border-b-2 border-foreground bg-card">
                            <h2 className="text-xs font-black uppercase tracking-widest">Round Breakdown</h2>
                        </div>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b-2 border-foreground">
                                    <th className="text-left px-5 py-2">Round</th>
                                    <th className="text-left px-5 py-2">Verdict</th>
                                    <th className="text-right px-5 py-2">Time</th>
                                    <th className="text-right px-5 py-2">Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {roundHistory.map((r, index) => (
                                    // Use `index` as a tie-breaker to avoid duplicate-key warnings
                                    // when the same roundNumber is pushed more than once (edge-case during reconnects)
                                    <tr key={`${r.roundNumber}-${index}`} className="border-t border-border hover:bg-muted/50 transition-colors">
                                        <td className="px-5 py-3 font-mono font-bold">#{r.roundNumber}</td>
                                        <td className={`px-5 py-3 font-black uppercase text-xs tracking-wider ${VERDICT_COLORS[r.verdict] ?? "text-muted-foreground"}`}>
                                            {r.verdict}
                                        </td>
                                        <td className="px-5 py-3 text-right font-mono text-muted-foreground">
                                            {r.executionTimeMs > 0 ? `${r.executionTimeMs}ms` : "—"}
                                        </td>
                                        <td className="px-5 py-3 text-right font-black">
                                            +{r.score}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </motion.div>
                )}

                {/* CTA */}
                <motion.div
                    className="flex gap-6 justify-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                >
                    <motion.button
                        className="arcade-btn bg-primary px-10 py-5 border-2 border-foreground shadow-retro text-lg font-black uppercase tracking-widest"
                        whileHover={{ scale: 1.05, boxShadow: "6px 6px 0px 0px hsl(var(--navy))" }}
                        whileTap={{ scale: 0.95, x: 2, y: 2, boxShadow: "0px 0px 0px 0px hsl(var(--navy))" }}
                        onClick={() => (window.location.href = "/arcade")}
                    >
                        Play Again
                    </motion.button>
                    <motion.button
                        className="arcade-btn bg-card px-10 py-5 border-2 border-foreground shadow-retro text-lg font-black uppercase tracking-widest"
                        whileHover={{ scale: 1.05, boxShadow: "6px 6px 0px 0px hsl(var(--navy))" }}
                        whileTap={{ scale: 0.95, x: 2, y: 2, boxShadow: "0px 0px 0px 0px hsl(var(--navy))" }}
                        onClick={() => (window.location.href = "/")}
                    >
                        Home
                    </motion.button>
                </motion.div>
            </div>
        </div>
    );
}
