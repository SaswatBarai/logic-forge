// apps/web/app/(game)/story/page.tsx
"use client";

import { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useStoryStore, StoryZone } from "@/store/story-store";
import { ZoneSelector } from "@/components/story/zone-selector";
import { StoryHud } from "@/components/story/story-hud";
import { StoryNarrator } from "@/components/story/story-narrator";

const ease = [0.16, 1, 0.3, 1] as const;

// ── Arcade-style background ───────────────────────────────────────────────
function StoryBackground() {
    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: "radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)",
                    backgroundSize: "32px 32px",
                }}
            />
            <div
                className="absolute inset-0 opacity-[0.02]"
                style={{
                    backgroundImage: "repeating-linear-gradient(0deg, hsl(var(--foreground)) 0px, hsl(var(--foreground)) 1px, transparent 1px, transparent 4px)",
                }}
            />
            <div
                className="absolute -top-32 -left-32 w-[700px] h-[700px] rounded-full opacity-[0.04]"
                style={{ background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 65%)" }}
            />
            <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-background to-transparent" />
        </div>
    );
}

// ── Main story page ───────────────────────────────────────────────────────
export default function StoryModePage() {
    const { isActive, zone, reset, startZone } = useStoryStore();

    const handleSelectZone = useCallback((z: StoryZone) => {
        startZone(z);
    }, [startZone]);

    const handleBack = useCallback(() => {
        reset();
    }, [reset]);

    // ── Zone selection screen ─────────────────────────────────────────────
    if (!isActive || !zone) {
        return (
            <div className="relative min-h-screen flex flex-col bg-background selection:bg-primary selection:text-primary-foreground select-none">
                <StoryBackground />
                {/* Minimal HUD */}
                <div className="flex items-center justify-between px-6 py-3 border-b-2 border-foreground/15 bg-foreground text-background z-20 relative">
                    <div className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest">
                        <span className="text-primary font-black">LOGICFORGE</span>
                        <span className="opacity-30 mx-1">/</span>
                        <span className="opacity-40">STORY MODE</span>
                        <span className="opacity-20 mx-1">/</span>
                        <span className="opacity-60">SELECT ZONE</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 border border-primary/30">
                        <span className="text-[9px] font-mono text-primary uppercase tracking-widest font-bold">
                            IRONCLAD CHRONICLES
                        </span>
                    </div>
                </div>
                <main className="flex-1 relative z-10">
                    <ZoneSelector onSelect={handleSelectZone} />
                </main>
            </div>
        );
    }

    // ── Active story screen ───────────────────────────────────────────────
    return (
        <div className="relative min-h-screen flex flex-col bg-background select-none">
            <StoryBackground />
            <StoryHud />

            <main className="flex-1 relative z-10 flex flex-col min-h-0 overflow-hidden" style={{ height: "calc(100vh - 52px)" }}>
                {/* Back button */}
                <div className="px-4 py-3 border-b border-foreground/10 bg-card/30 flex items-center shrink-0">
                    <motion.button
                        onClick={handleBack}
                        className="flex items-center gap-2 text-foreground/40 hover:text-foreground transition-colors text-xs font-mono uppercase tracking-widest"
                        whileHover={{ x: -2 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <ArrowLeft className="size-3.5" />
                        <span>Exit Story</span>
                    </motion.button>
                </div>

                {/* Narrator */}
                <div className="flex-1 min-h-0 flex flex-col">
                    <StoryNarrator />
                </div>
            </main>
        </div>
    );
}
