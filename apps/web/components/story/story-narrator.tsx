"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStoryStore } from "@/store/story-store";
import type { Scar, Debt } from "@/store/story-store";
import { storyData, StoryChoice } from "@/lib/story-data";
import { NpcDialogue } from "@/components/story/npc-dialogue";
import { SceneAtmosphere } from "@/components/story/scene-atmosphere";
import { ChoiceCards } from "@/components/story/choice-cards";
import { useStorySFX } from "@/components/story/story-sfx-context";

type ScenePhase = "dialogue" | "question" | "consequence" | "transition";

export function StoryNarrator() {
  const {
    zone,
    act,
    scars,
    isStreaming,
    consequencePayload,
    setStreaming,
    commitAssistantMessage,
    addUserMessage,
    updateXP,
    addScar,
    addDebt,
    setAct,
    setConsequencePayload,
    setShowBossGate,
    setZoneCompleteScreen,
    incrementActStreak,
    actStreakWithoutScar,
    setStreamingText,
    appendStreamingText,
    applyEnergyDelta,
  } = useStoryStore();

  const sfx = useStorySFX();
  const [phase, setPhase] = useState<ScenePhase>("dialogue");
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const hasStarted = useRef(false);
  const pendingRef = useRef<{
    choice: StoryChoice;
    onComplete: () => void;
    hadScar: boolean;
  } | null>(null);

  const zoneInfo = zone ? storyData[zone] : null;
  const currentActData = zoneInfo && act >= 1 ? zoneInfo.acts[act - 1] : null;
  const isBossAct = zoneInfo ? act === zoneInfo.acts.length : false;

  useEffect(() => {
    if (zone && !hasStarted.current) {
      hasStarted.current = true;
      setPhase("dialogue");
    }
  }, [zone]);

  const handleDialogueComplete = useCallback(() => {
    setPhase("question");
  }, []);

  useEffect(() => {
    if (consequencePayload === null && pendingRef.current) {
      const p = pendingRef.current;
      pendingRef.current = null;
      if (!p.hadScar) incrementActStreak();
      sfx.play("sceneTransition");
      setPhase("transition");
      setTimeout(() => {
        p.onComplete();
        setPhase("dialogue");
        setSelectedChoice(null);
      }, 400);
    }
  }, [consequencePayload, incrementActStreak, sfx]);

  const handleChoice = useCallback(
    (choice: StoryChoice) => {
      if (!zone) return;
      sfx.play("choiceSelect");
      setSelectedChoice(choice.id);
      addUserMessage(`I choose: ${choice.id}) ${choice.text}`);

      if (choice.xp > 0) updateXP(choice.xp);
      if (choice.scar) addScar({ ...choice.scar, zone, act } as Scar);
      if (choice.debt) addDebt({ ...choice.debt, zone, act } as Debt);
      if (zone === "FORGE_VILLAGE") applyEnergyDelta(choice.tier);

      setConsequencePayload({
        xp: choice.xp > 0 ? choice.xp : undefined,
        scar: choice.scar ? { ...choice.scar, zone, act } : undefined,
        debt: choice.debt ? { ...choice.debt, zone, act } : undefined,
      });

      const zi = storyData[zone];
      const nextIdx = act;

      if (nextIdx < zi.acts.length) {
        const nextAct = zi.acts[nextIdx]!;
        pendingRef.current = {
          choice,
          hadScar: !!choice.scar,
          onComplete: () => {
            setAct(nextAct.actNumber);
            if (nextIdx === zi.acts.length - 1) setShowBossGate(true);
          },
        };
      } else {
        pendingRef.current = {
          choice,
          hadScar: !!choice.scar,
          onComplete: () => {
            setZoneCompleteScreen(true);
          },
        };
      }
    },
    [zone, act, addUserMessage, updateXP, addScar, addDebt, setConsequencePayload, setAct, setShowBossGate, setZoneCompleteScreen, sfx, applyEnergyDelta],
  );

  if (!zone || !currentActData) return null;

  const scarWarning = scars.length >= 3
    ? "Scars weigh on you... some paths grow unclear."
    : scars.length > 0
      ? "Scars weigh on you... time runs shorter."
      : null;

  const streakMsg = actStreakWithoutScar >= 3
    ? `Streak ${actStreakWithoutScar} — Insight sharpens your vision.`
    : actStreakWithoutScar >= 2
      ? `Streak ${actStreakWithoutScar} — Momentum builds.`
      : null;

  return (
    <div className="relative flex flex-col h-full min-h-0">
      <SceneAtmosphere zone={zone} isBoss={isBossAct} />

      <div className="relative z-10 flex flex-col h-full min-h-0">
        {/* Act header */}
        <div className="shrink-0 px-6 pt-5 pb-2">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary">
            Act {currentActData.actNumber}
          </p>
          <h2 className="font-story-title text-lg font-bold text-foreground mt-0.5">
            {currentActData.title}
          </h2>
          {scarWarning && (
            <p className="text-[10px] font-mono text-destructive mt-1 opacity-80">
              {scarWarning}
            </p>
          )}
          {streakMsg && (
            <p className="text-[10px] font-mono text-accent mt-0.5 opacity-80">
              {streakMsg}
            </p>
          )}
        </div>

        {/* Scene content: single scene at a time with crossfade */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={`act-${act}-${phase}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {phase === "dialogue" && (
                <NpcDialogue
                  zone={zone}
                  text={currentActData.sceneText}
                  onComplete={handleDialogueComplete}
                />
              )}

              {phase === "question" && (
                <>
                  <NpcDialogue
                    zone={zone}
                    text={currentActData.sceneText}
                    speed={0}
                  />
                  <div className="mt-4 p-4 rounded-lg border border-primary/30 bg-primary/5">
                    <p className="text-[9px] font-mono uppercase tracking-widest text-primary mb-2">
                      The Moment of Truth
                    </p>
                    <p className="font-story-body text-sm text-foreground leading-relaxed">
                      {currentActData.question}
                    </p>
                  </div>
                </>
              )}

              {phase === "transition" && (
                <div className="flex items-center justify-center py-12">
                  <motion.div
                    className="w-16 h-0.5 bg-primary/30 rounded-full"
                    animate={{ scaleX: [0, 1, 0] }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Choice cards */}
        <AnimatePresence>
          {phase === "question" && currentActData.choices.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="shrink-0"
            >
              <ChoiceCards
                choices={currentActData.choices}
                onSelect={handleChoice}
                disabled={!!selectedChoice}
                selectedId={selectedChoice}
                scars={scars}
                streakCount={actStreakWithoutScar}
                isBossAct={isBossAct}
                zone={zone}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
