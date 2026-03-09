"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useAnimationControls } from "framer-motion";
import { useStoryStore } from "@/store/story-store";
import type { Scar, Debt } from "@/store/story-store";
import { storyData, StoryChoice } from "@/lib/story-data";
import { CHARACTER_CONFIG } from "@/lib/character-config";
import { NarratorBox } from "@/components/story/narrator-box";
import { NpcDialogue } from "@/components/story/npc-dialogue";
import { SceneAtmosphere } from "@/components/story/scene-atmosphere";
import { ChoiceCards } from "@/components/story/choice-cards";
import { useStorySFX } from "@/components/story/story-sfx-context";

type ScenePhase = "dialogue" | "question-reveal" | "question-ready" | "consequence" | "transition";

export function StoryNarrator() {
  const {
    zone,
    act,
    xp,
    rank,
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
    setAudioIntensity,
  } = useStoryStore();

  const sfx = useStorySFX();
  const [phase, setPhase] = useState<ScenePhase>("dialogue");
  const [lineIdx, setLineIdx] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [flashKey, setFlashKey] = useState<number | null>(null);
  const controls = useAnimationControls();
  const hasStarted = useRef(false);
  const pendingRef = useRef<{
    choice: StoryChoice;
    onComplete: () => void;
    hadScar: boolean;
  } | null>(null);

  const zoneInfo = zone ? storyData[zone] : null;
  const currentActData = zoneInfo && act >= 1 ? zoneInfo.acts[act - 1] : null;
  const isBossAct = zoneInfo ? act === zoneInfo.acts.length : false;

  // Reset line index whenever the act changes
  useEffect(() => {
    setLineIdx(0);
    setPhase("dialogue");
  }, [act, zone]);

  useEffect(() => {
    if (zone && !hasStarted.current) {
      hasStarted.current = true;
      setPhase("dialogue");
    }
  }, [zone]);

  /** Advance to next scene line, or move to question-reveal when all lines are done. */
  const handleLineComplete = useCallback(() => {
    if (!currentActData) return;
    const nextIdx = lineIdx + 1;
    if (nextIdx < currentActData.lines.length) {
      setLineIdx(nextIdx);
    } else {
      setPhase("question-reveal");
    }
  }, [currentActData, lineIdx]);

  const handleDialogueComplete = handleLineComplete;

  useEffect(() => {
    if (phase !== "question-reveal") return;
    const t = setTimeout(() => setPhase("question-ready"), 1200);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (consequencePayload === null && pendingRef.current) {
      const p = pendingRef.current;
      pendingRef.current = null;
      setAudioIntensity(3);
      if (!p.hadScar) incrementActStreak();
      sfx.play("sceneTransition");
      setPhase("transition");
      setTimeout(() => {
        p.onComplete();
        setPhase("dialogue");
        setSelectedChoice(null);
      }, 400);
    }
  }, [consequencePayload, incrementActStreak, sfx, setAudioIntensity]);

  const handleChoice = useCallback(
    (choice: StoryChoice) => {
      if (!zone) return;
      sfx.play("choiceSelect");
      setSelectedChoice(choice.id);
      if (choice.tier >= 3) {
        controls.start({
          x: [0, -8, 8, -6, 6, 0],
          transition: { duration: 0.4 },
        });
      }
      if (choice.tier === 4) {
        setFlashKey(Date.now());
      }
      if (choice.tier === 1) setAudioIntensity(2);
      else if (choice.tier === 2) setAudioIntensity(1);
      else setAudioIntensity(2);
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
        const isNextBoss = nextIdx === zi.acts.length - 1;
        pendingRef.current = {
          choice,
          hadScar: !!choice.scar,
          onComplete: () => {
            if (isNextBoss) setAudioIntensity(2);
            setAct(nextAct.actNumber);
            if (isNextBoss) setShowBossGate(true);
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
    [zone, act, addUserMessage, updateXP, addScar, addDebt, setConsequencePayload, setAct, setShowBossGate, setZoneCompleteScreen, sfx, applyEnergyDelta, controls, setAudioIntensity],
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

  const zoneTitle = zoneInfo?.title ?? zone;
  const totalActs = zoneInfo?.acts.length ?? 1;
  const progressPct = totalActs > 0 ? (act / totalActs) * 100 : 0;
  const charConfig = zone ? CHARACTER_CONFIG[zone] : null;
  const statusPrompt =
    phase === "question-ready" && currentActData.choices.length > 0
      ? "SELECT A PATH"
      : "CLICK TO ADVANCE";

  const currentLine = currentActData?.lines[lineIdx];
  const statusSpeaker =
    phase !== "dialogue"
      ? `◈ ${charConfig?.name ?? "Narrator"}`
      : currentLine?.type === "character"
        ? `◈ ${currentLine.name}`
        : "⟨ NARRATOR ⟩";

  return (
    <div className="story-mode relative flex h-full min-h-0 flex-col">
      {/* CRT scanline overlay — full screen */}
      <div
        className="pointer-events-none fixed inset-0 z-[100]"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 4px)",
        }}
        aria-hidden
      />
      <SceneAtmosphere zone={zone} mood={currentActData.mood} isBoss={isBossAct} />

      {flashKey !== null && (
        <motion.div
          key={flashKey}
          className="fixed inset-0 z-40 pointer-events-none bg-destructive/20"
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onAnimationComplete={() => setFlashKey(null)}
        />
      )}

      <motion.div
        className="relative z-10 flex h-full min-h-0 flex-col rounded-none border-2 border-[hsl(38,70%,30%)] bg-[hsl(30,50%,6%)] shadow-lg"
        initial={{ x: 0 }}
        animate={controls}
      >
        {/* Title bar: [■ ■ ■] IRONCLAD CHRONICLES · ZONE · ACT — N/TOTAL */}
        <div
          className="flex shrink-0 items-center gap-2 border-b border-[hsl(38,70%,30%)] px-3 py-2"
          style={{ background: "linear-gradient(180deg, #1a1408 0%, #130f04 100%)" }}
        >
          <div className="flex gap-1">
            <span className="h-2 w-2 shrink-0 rounded-sm bg-[#8B0000]" aria-hidden />
            <span className="h-2 w-2 shrink-0 rounded-sm bg-[#5A3E10]" aria-hidden />
            <span className="h-2 w-2 shrink-0 rounded-sm bg-[#1B4332]" aria-hidden />
          </div>
          <span
            className="font-mono text-[10px] font-bold uppercase tracking-widest"
            style={{ color: "#C9A84C", fontFamily: "'Courier New', monospace" }}
          >
            IRONCLAD CHRONICLES
          </span>
          <span className="text-[hsl(38,40%,45%)]">·</span>
          <span
            className="truncate font-mono text-[10px] uppercase tracking-wider"
            style={{ color: "#E8D9B0", fontFamily: "'Courier New', monospace" }}
          >
            {zoneTitle}
          </span>
          <span className="text-[hsl(38,40%,45%)]">·</span>
          <span
            className="truncate font-mono text-[10px]"
            style={{ color: "#D4C090", fontFamily: "'Courier New', monospace" }}
          >
            Act {currentActData.actNumber}: {currentActData.title}
          </span>
          <span className="ml-auto font-mono text-[10px] tabular-nums" style={{ color: "#C9A84C" }}>
            {act} / {totalActs}
          </span>
          {/* HUD: XP / Rank */}
          <div className="ml-2 flex gap-3 border-l border-[hsl(38,70%,30%)] pl-3">
            <div className="text-center">
              <div className="text-[9px] uppercase tracking-wider" style={{ color: "#5a4a20" }}>
                XP
              </div>
              <div className="text-xs font-bold tabular-nums" style={{ color: "#C9A84C" }}>
                {xp}
              </div>
            </div>
            <div className="text-center">
              <div className="text-[9px] uppercase tracking-wider" style={{ color: "#5a4a20" }}>
                RANK
              </div>
              <div className="text-xs font-bold" style={{ color: "#7EB8D4" }}>
                {rank}
              </div>
            </div>
          </div>
        </div>

        {/* Thin gold progress bar */}
        <div className="h-0.5 w-full shrink-0 overflow-hidden bg-black/30">
          <motion.div
            className="h-full bg-[hsl(38,100%,55%)]"
            style={{ width: `${progressPct}%` }}
            transition={{ duration: 0.25 }}
          />
        </div>

        {/* Scene content: one line at a time */}
        <div className="flex min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={`act-${act}-line-${lineIdx}-${phase}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="w-full space-y-4"
            >
              {phase === "dialogue" && currentActData.lines[lineIdx] && (() => {
                const line = currentActData.lines[lineIdx]!;
                if (line.type === "narrator") {
                  return (
                    <NarratorBox
                      key={`narrator-${lineIdx}`}
                      text={line.text}
                      onNext={handleLineComplete}
                    />
                  );
                }
                return (
                  <NpcDialogue
                    key={`char-${lineIdx}`}
                    zone={zone}
                    text={line.text}
                    speakerName={line.name}
                    onComplete={handleLineComplete}
                  />
                );
              })()}

              {phase === "transition" && (
                <div className="flex items-center justify-center py-12">
                  <motion.div
                    className="h-0.5 w-16 rounded-full bg-[hsl(38,100%,55%)]/30"
                    animate={{ scaleX: [0, 1, 0] }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Choice cards — only after question-reveal delay */}
        <AnimatePresence>
              {phase === "question-ready" && currentActData.choices.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="shrink-0 px-4 pb-4"
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
                prompt={currentActData.question}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom status bar */}
        <div
          className="flex shrink-0 items-center justify-between gap-2 border-t border-[hsl(38,70%,30%)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider"
          style={{
            background: "#130f04",
            color: "#D4C090",
            fontFamily: "'Courier New', monospace",
          }}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2 truncate">
            <span style={{ color: "#C9A84C" }}>
              ⟨ Act {currentActData.actNumber}: {currentActData.title} ⟩
            </span>
            <span style={{ color: "#8B6914" }}>—</span>
            <span
              style={{
                color:
                  phase !== "dialogue"
                    ? (charConfig?.color ?? "#C9A84C")
                    : currentLine?.type === "character"
                      ? "#E8D9B0"
                      : "#C9A84C88",
              }}
            >
              {statusSpeaker}
            </span>
            {scarWarning && (
              <span className="truncate text-[#dc2626] opacity-90"> · {scarWarning}</span>
            )}
            {streakMsg && (
              <span className="truncate opacity-90" style={{ color: "#C9A84C" }}>
                {" "}
                · {streakMsg}
              </span>
            )}
          </div>
          <span className="shrink-0" style={{ color: "rgba(201, 168, 76, 0.8)" }}>
            {statusPrompt}
          </span>
        </div>
      </motion.div>
    </div>
  );
}
