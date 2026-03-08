// apps/web/app/(game)/story/page.tsx
"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useStoryStore, StoryZone } from "@/store/story-store";
import { storyData } from "@/lib/story-data";
import { WorldMap } from "@/components/story/world-map";
import { AchievementsPanel } from "@/components/story/achievements-panel";
import { CinematicZoneEnter } from "@/components/story/cinematic-zone-enter";
import { StoryHud } from "@/components/story/story-hud";
import { StoryNarrator } from "@/components/story/story-narrator";
import { ConsequenceOverlay } from "@/components/story/consequence-overlay";
import { RankUpOverlay } from "@/components/story/rank-up-overlay";
import { BossGateTransition } from "@/components/story/boss-gate-transition";
import { ZoneCompleteScreen } from "@/components/story/zone-complete-screen";
import { StoryStatusPanel } from "@/components/story/story-status-panel";

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

export default function StoryModePage() {
    const {
        isActive,
        zone,
        act,
        zoneCompletion,
        consequencePayload,
        showRankUp,
        showBossGate,
        zoneCompleteScreen,
        debts,
        achievements,
        reset,
        startZone,
        clearConsequencePayload,
        clearShowRankUp,
        setShowBossGate,
    } = useStoryStore();

    const handleBossGateDismiss = useCallback(() => setShowBossGate(false), [setShowBossGate]);
    const [pendingZone, setPendingZone] = useState<StoryZone | null>(null);

    const handleSelectZone = useCallback((z: StoryZone) => {
        setPendingZone(z);
    }, []);

    const handleCinematicComplete = useCallback(() => {
        if (pendingZone) {
            startZone(pendingZone);
            setPendingZone(null);
        }
    }, [pendingZone, startZone]);

    const handleBack = useCallback(() => {
        reset();
    }, [reset]);

    if (pendingZone) {
        return (
            <div className="relative min-h-screen bg-background select-none">
                <CinematicZoneEnter zone={pendingZone} onComplete={handleCinematicComplete} />
            </div>
        );
    }

    if (!isActive || !zone) {
        return (
            <div className="relative min-h-screen flex flex-col bg-background selection:bg-primary selection:text-primary-foreground select-none">
                <StoryBackground />
                <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card z-20 relative">
                    <div className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        <span className="text-primary font-black">LOGICFORGE</span>
                        <span className="opacity-30 mx-1">/</span>
                        <span className="opacity-60">STORY MODE</span>
                        <span className="opacity-20 mx-1">/</span>
                        <span className="opacity-60">SELECT ZONE</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 border border-primary/40 bg-primary/5 font-story-title text-sm text-primary">
                        IRONCLAD CHRONICLES
                    </div>
                </div>
                <main className="flex-1 relative z-10 flex flex-col items-center justify-center py-12 px-6">
                    <motion.div
                        className="text-center mb-10"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="font-story-title text-3xl sm:text-4xl font-bold text-foreground">
                            Choose your front
                        </h1>
                        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                            Three zones. Three wars. One knight.
                        </p>
                    </motion.div>
                    <WorldMap
                        zoneCompletion={zoneCompletion}
                        onSelectZone={handleSelectZone}
                        achievements={achievements}
                    />
                    <AchievementsPanel unlockedIds={achievements} />
                </main>
            </div>
        );
    }

    const zoneInfo = zone ? storyData[zone] : null;
    const currentAct = zoneInfo && act >= 1 ? zoneInfo.acts[act - 1] : null;
    const bossTitle = currentAct?.title ?? "Boss Gate";
    const debtsTriggeringBoss = debts.filter((d) => d.triggersAt.toLowerCase().includes("boss"));

    return (
        <div className="relative min-h-screen flex flex-col bg-background select-none">
            <StoryBackground />
            <StoryHud />

            <main className="flex-1 relative z-10 flex flex-col md:flex-row min-h-0 overflow-hidden" style={{ height: "calc(100vh - 52px)" }}>
                <div className="flex-1 min-h-0 flex flex-col min-w-0">
                    <div className="px-4 py-3 border-b border-border bg-card flex items-center shrink-0">
                        <motion.button
                            onClick={handleBack}
                            className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
                            whileHover={{ x: -2 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <ArrowLeft className="size-3.5" />
                            <span>Exit Story</span>
                        </motion.button>
                    </div>
                    <div className="flex-1 min-h-0 flex flex-col">
                        <StoryNarrator />
                    </div>
                </div>
                <StoryStatusPanel />
            </main>

            <AnimatePresence>
                {consequencePayload && (
                    <ConsequenceOverlay payload={consequencePayload} onDismiss={clearConsequencePayload} />
                )}
                {showRankUp && <RankUpOverlay rank={showRankUp} onDismiss={clearShowRankUp} />}
                {showBossGate && (
                    <BossGateTransition
                        title={bossTitle}
                        zone={zone}
                        debtsTriggering={debtsTriggeringBoss}
                        onDismiss={handleBossGateDismiss}
                    />
                )}
                {zoneCompleteScreen && <ZoneCompleteScreen onReturnToMap={reset} />}
            </AnimatePresence>
        </div>
    );
}
