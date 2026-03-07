"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

interface McqSelectorProps {
    options: Record<string, string>;
    language: string;
    selected: string | null;
    onSelect: (key: string) => void;
}

const OPTION_KEYS = ["A", "B", "C", "D", "E", "F"];

export function McqSelector({ options, language, selected, onSelect }: McqSelectorProps) {
    const entries = Object.entries(options);

    // Keyboard shortcuts: press A/B/C/D
    const handleKey = useCallback((e: KeyboardEvent) => {
        const key = e.key.toUpperCase();
        if (!OPTION_KEYS.includes(key)) return;
        const entry = entries.find(([k]) => k === key);
        if (entry) onSelect(entry[0]);
    }, [entries, onSelect]);

    useEffect(() => {
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [handleKey]);

    return (
        <div className="h-full overflow-y-auto flex flex-col gap-2.5 pr-1">
            {entries.map(([key, code], idx) => {
                const isSelected = selected === key;

                return (
                    <motion.button
                        key={key}
                        onClick={() => onSelect(key)}
                        className={`
                            w-full text-left border-2 overflow-hidden transition-all duration-150
                            ${isSelected
                                ? "border-primary bg-primary/5 shadow-[3px_3px_0px_0px_hsl(var(--primary))]"
                                : "border-foreground/20 bg-foreground/[0.03] hover:border-foreground/50 hover:bg-foreground/[0.06]"
                            }
                        `}
                        whileTap={{ scale: 0.995 }}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                    >
                        {/* ── Header bar ── */}
                        <div className={`
                            flex items-center justify-between px-3 py-2 border-b-2
                            ${isSelected
                                ? "border-primary bg-primary/10"
                                : "border-foreground/15 bg-foreground/5"
                            }
                        `}>
                            <div className="flex items-center gap-2">
                                {/* Key badge */}
                                <div className={`
                                    w-5 h-5 flex items-center justify-center border font-black text-xs font-mono shrink-0
                                    ${isSelected
                                        ? "border-primary text-primary bg-primary/10"
                                        : "border-foreground/30 text-foreground/50"
                                    }
                                `}>
                                    {key}
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-widest font-mono
                                    ${isSelected ? "text-primary" : "text-foreground/40"}`}>
                                    Option {key}
                                </span>
                                <span className="text-[8px] font-mono text-foreground/20 border border-foreground/10 px-1 py-0.5">
                                    [{key}]
                                </span>
                            </div>

                            <AnimatePresence>
                                {isSelected && (
                                    <motion.div
                                        className="flex items-center gap-1.5"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                    >
                                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-primary">
                                            Selected
                                        </span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* ── Code block — fixed height, scrollable ── */}
                        <div className="flex overflow-hidden" style={{ maxHeight: "8.5rem", backgroundColor: "hsl(230 40% 7%)" }}>
                            {/* Line numbers */}
                            <div
                                className="select-none shrink-0 px-3 py-2.5 text-right border-r border-foreground/10"
                                style={{ backgroundColor: "hsl(230 40% 9%)", minWidth: "2.25rem" }}
                            >
                                {code.split("\n").map((_, i) => (
                                    <div key={i} className="text-[10px] font-mono text-foreground/20 leading-6">
                                        {i + 1}
                                    </div>
                                ))}
                            </div>

                            {/* Code — horizontally scrollable, never wraps */}
                            <pre className={`
                                flex-1 px-4 py-2.5 text-[12px] font-mono leading-6
                                overflow-x-auto overflow-y-auto whitespace-pre
                                ${isSelected ? "text-primary/90" : "text-slate-300"}
                            `}>
                                {code}
                            </pre>
                        </div>

                        {/* Selected bottom accent line */}
                        {isSelected && (
                            <div className="h-0.5 bg-primary w-full" />
                        )}
                    </motion.button>
                );
            })}
        </div>
    );
}
