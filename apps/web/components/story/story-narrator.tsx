"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useStoryStore } from "@/store/story-store";
import type { Scar, Debt } from "@/store/story-store";
import { storyData, StoryAct, StoryChoice } from "@/lib/story-data";

function parseChoices(text: string): string[] | null {
    const pattern = /▶\s*([A-E])\)\s*(.+?)(?=\n▶|\n\n|$)/gs;
    const choices: string[] = [];
    let match;
    while ((match = pattern.exec(text)) !== null) {
        choices.push(`${match[1]}) ${match[2].trim()}`);
    }
    return choices.length >= 2 ? choices : null;
}

function formatActText(act: StoryAct): string {
    let text = act.sceneText + "\n\n";
    text += "⚡ THE MOMENT OF TRUTH\n";
    text += act.question + "\n\n";
    act.choices.forEach((c) => {
        text += `▶ ${c.id}) ${c.text}\n`;
    });
    return text;
}

function formatConsequenceText(choice: StoryChoice): string {
    let text = choice.consequence + "\n\n";
    if (choice.xp > 0) text += `[⚔️ XP: +${choice.xp}]\n`;
    if (choice.scar) text += `[SCAR EARNED: "${choice.scar.name}" - ${choice.scar.description}]\n`;
    if (choice.debt) text += `[DEBT PLANTED: "${choice.debt.name}" - ${choice.debt.description} - triggers at: ${choice.debt.triggersAt}]\n`;
    return text;
}

export function StoryNarrator() {
    const {
        zone, act, messages, isStreaming, streamingText,
        setStreaming, setStreamingText, appendStreamingText,
        commitAssistantMessage, addUserMessage,
        updateXP, addScar, addDebt, setAct
    } = useStoryStore();

    const scrollRef = useRef<HTMLDivElement>(null);
    const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
    const hasStarted = useRef(false);
    const streamIdRef = useRef<number>(0);

    // ✅ FIXED: removed useState for showChoices
    // ✅ FIXED: removed showChoices from useEffect deps
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, streamingText]);

    const simulateStream = useCallback(async (text: string, onComplete?: () => void) => {
        setStreaming(true);
        setStreamingText("");
        const currentId = ++streamIdRef.current;

        const chunks = text.match(/[\s\S]{1,4}/g) || [];
        for (const chunk of chunks) {
            if (streamIdRef.current !== currentId) break;
            appendStreamingText(chunk);
            await new Promise(r => setTimeout(r, 6));
        }

        if (streamIdRef.current === currentId) {
            commitAssistantMessage();
            if (onComplete) onComplete();
        }
    }, [setStreaming, setStreamingText, appendStreamingText, commitAssistantMessage]);

    useEffect(() => {
        if (zone && !hasStarted.current && messages.length === 0) {
            hasStarted.current = true;
            const zoneInfo = storyData[zone];
            if (!zoneInfo) return;

            const firstAct = zoneInfo.acts[0];
            let initialText = `Entering ${zoneInfo.title}...\n\n`;
            initialText += "=".repeat(36) + "\n";
            initialText += `ACT ${firstAct.actNumber} — ${firstAct.title}\n`;
            initialText += "=".repeat(36) + "\n\n";
            initialText += formatActText(firstAct);

            simulateStream(initialText);
        }
    }, [zone, messages.length, simulateStream]);

    const handleChoice = async (choiceString: string) => {
        if (isStreaming || !zone) return;

        setSelectedChoice(choiceString);
        addUserMessage(`I choose: ${choiceString}`);

        const zoneInfo = storyData[zone];
        const currentActIndex = act - 1;
        const currentActData = zoneInfo.acts[currentActIndex];

        if (!currentActData) return;

        const choiceLetter = choiceString.charAt(0);
        const choiceData = currentActData.choices.find(c => c.id === choiceLetter);

        if (!choiceData) return;

        if (choiceData.xp > 0) updateXP(choiceData.xp);
        if (choiceData.scar) addScar({ ...choiceData.scar, zone, act } as Scar);
        if (choiceData.debt) addDebt({ ...choiceData.debt, zone, act } as Debt);

        let responseText = formatConsequenceText(choiceData);
        const nextActIndex = currentActIndex + 1;

        if (nextActIndex < zoneInfo.acts.length) {
            const nextAct = zoneInfo.acts[nextActIndex];
            responseText += "\n\n" + "=".repeat(36) + "\n";
            responseText += `ACT ${nextAct.actNumber} — ${nextAct.title}\n`;
            responseText += "=".repeat(36) + "\n\n";
            responseText += formatActText(nextAct);

            simulateStream(responseText, () => {
                setAct(nextAct.actNumber);
                setSelectedChoice(null);
            });
        } else {
            responseText += "\n\n" + "=".repeat(36) + "\n";
            responseText += "ZONE COMPLETE\n";
            responseText += "=".repeat(36) + "\n";
            responseText += `You have survived ${zoneInfo.title}. Your choices have shaped your destiny.\n\n[Return to Zone Selection to continue your journey]`;

            simulateStream(responseText, () => {
                setSelectedChoice(null);
            });
        }
    };

    const latestAssistant = messages.findLast((m) => m.role === "assistant");
    const currentChoices = latestAssistant ? parseChoices(latestAssistant.content) : null;

    // ✅ FIXED: plain const instead of var + useState
    const showChoices = currentChoices && !isStreaming;

    const renderText = (text: string) => {
        return text.split("\n").map((line, i) => {
            if (/^▶\s*[A-E]\)/.test(line)) {
                return (
                    <div key={i} className="text-primary font-bold font-mono text-sm my-1">
                        {line}
                    </div>
                );
            }
            if (/^\[⚔️/.test(line) || /^\[SCAR/.test(line) || /^\[DEBT/.test(line)) {
                return (
                    <div key={i} className="font-mono text-xs text-yellow-400 bg-yellow-400/5 border border-yellow-400/20 px-3 py-1.5 my-2">
                        {line}
                    </div>
                );
            }
            if (/^⏳/.test(line)) {
                return (
                    <div key={i} className="text-destructive font-bold italic text-sm my-1">
                        {line}
                    </div>
                );
            }
            if (/^[═━=]+/.test(line) || /^ACT\s+\d/i.test(line) || /^ZONE COMPLETE/i.test(line)) {
                return (
                    <div key={i} className="text-primary font-black uppercase tracking-widest text-xs my-3">
                        {line}
                    </div>
                );
            }
            if (line.trim() === "") return <div key={i} className="h-2" />;
            return (
                <p key={i} className="text-foreground/90 leading-relaxed text-sm">
                    {line}
                </p>
            );
        });
    };

    return (
        <div className="flex flex-col h-full min-h-0">
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-foreground/10"
            >
                {messages
                    .filter((m) => m.role !== "system")
                    .map((msg, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className={
                                msg.role === "user"
                                    ? "ml-auto max-w-[80%] bg-primary/10 border border-primary/20 px-4 py-3"
                                    : "max-w-full"
                            }
                        >
                            {msg.role === "user" ? (
                                <p className="text-sm text-primary font-bold font-mono">
                                    ⚔️ {msg.content}
                                </p>
                            ) : (
                                <div className="space-y-1">{renderText(msg.content)}</div>
                            )}
                        </motion.div>
                    ))}

                {isStreaming && streamingText && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-1"
                    >
                        {renderText(streamingText)}
                        <motion.span
                            className="inline-block w-2 h-4 bg-primary ml-1"
                            animate={{ opacity: [1, 0, 1] }}
                            transition={{ duration: 0.8, repeat: Infinity }}
                        />
                    </motion.div>
                )}

                {isStreaming && !streamingText && (
                    <motion.div
                        className="flex items-center gap-3 text-muted-foreground"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <Loader2 className="size-4 animate-spin text-primary" />
                        <span className="text-xs font-mono uppercase tracking-widest text-primary/60">
                            The Game Master speaks...
                        </span>
                    </motion.div>
                )}
            </div>

            <AnimatePresence>
                {showChoices && (
                    <motion.div
                        className="border-t-2 border-foreground/10 bg-card/50 p-4 space-y-2"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                    >
                        <p className="text-[9px] font-mono uppercase tracking-widest text-foreground/40 px-1">
                            ⚡ What do you do?
                        </p>
                        <div className="grid gap-2">
                            {currentChoices.map((choice, idx) => (
                                <motion.button
                                    key={choice}
                                    onClick={() => handleChoice(choice)}
                                    disabled={isStreaming}
                                    className={`text-left px-4 py-3 border-2 text-sm font-medium transition-all duration-150 cursor-pointer
                                        ${selectedChoice === choice
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "border-foreground/15 bg-card hover:border-primary/50 hover:bg-primary/5 text-foreground/80"
                                        }
                                        disabled:opacity-40 disabled:cursor-not-allowed`}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    whileHover={{ x: 4 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <span className="font-mono font-black text-primary mr-2">
                                        ▶ {choice.slice(0, 2)}
                                    </span>
                                    {choice.slice(3)}
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
