"use client";

import { useState } from "react";
import { CodeEditor } from "./code-editor";

interface McqSelectorProps {
    options: Record<string, string>;
    language: string;
    selected: string | null;
    onSelect: (key: string) => void;
}

const OPTION_LABELS: Record<string, string> = { A: "A", B: "B", C: "C", D: "D" };

export function McqSelector({ options, language, selected, onSelect }: McqSelectorProps) {
    return (
        <div className="h-full overflow-y-auto flex flex-col gap-3 p-1">
            {Object.entries(options).map(([key, code]) => {
                const isSelected = selected === key;
                return (
                    <button
                        key={key}
                        onClick={() => onSelect(key)}
                        className={`w-full text-left border-2 transition-all duration-150 rounded-none
                            ${isSelected
                                ? "border-primary shadow-retro-sm bg-primary/10"
                                : "border-foreground/30 hover:border-foreground/60 bg-transparent"
                            }`}
                    >
                        {/* Option label bar */}
                        <div className={`flex items-center gap-2 px-3 py-1.5 border-b-2
                            ${isSelected ? "border-primary bg-primary/20" : "border-foreground/20 bg-foreground/5"}`}>
                            <span className={`font-black text-sm font-mono
                                ${isSelected ? "text-primary" : "text-slate-400"}`}>
                                {OPTION_LABELS[key]}
                            </span>
                            {isSelected && (
                                <span className="text-[9px] font-black uppercase tracking-widest text-primary ml-auto">
                                    ● Selected
                                </span>
                            )}
                        </div>
                        {/* Code preview — non-editable */}
                        <div className="h-28 pointer-events-none">
                            <CodeEditor
                                language={language}
                                code={code}
                                onChange={() => {}}
                                readOnly={true}
                            />
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
