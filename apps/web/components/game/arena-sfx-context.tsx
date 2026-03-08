"use client";

import { createContext, useContext, useRef, useEffect } from "react";
import { useGameStore } from "@/store/game-store";

export interface ArenaSFX {
    opponentProgress: () => void;
    streakUp: () => void;
    bonusTime: () => void;
    survivalEnd: () => void;
}

const ArenaSFXContext = createContext<ArenaSFX | null>(null);

export function ArenaSFXProvider({
    value,
    children,
}: {
    value: ArenaSFX;
    children: React.ReactNode;
}) {
    return (
        <ArenaSFXContext.Provider value={value}>
            {children}
            <SurvivalSFXListener />
        </ArenaSFXContext.Provider>
    );
}

function SurvivalSFXListener() {
    const sfx = useContext(ArenaSFXContext);
    const prevStreakRef = useRef(0);
    const prevActiveRef = useRef(false);

    const survivalStreak = useGameStore((s) => s.survivalStreak);
    const survivalActive = useGameStore((s) => s.survivalActive);
    const survivalTotalWins = useGameStore((s) => s.survivalTotalWins);

    useEffect(() => {
        if (!sfx) return;
        if (survivalStreak > prevStreakRef.current && survivalStreak >= 1) {
            sfx.streakUp();
            sfx.bonusTime();
        }
        prevStreakRef.current = survivalStreak;
    }, [survivalStreak, sfx]);

    useEffect(() => {
        if (!sfx) return;
        if (prevActiveRef.current && !survivalActive && survivalTotalWins > 0) {
            sfx.survivalEnd();
        }
        prevActiveRef.current = survivalActive;
    }, [survivalActive, survivalTotalWins, sfx]);

    return null;
}

export function useArenaSFX(): ArenaSFX | null {
    return useContext(ArenaSFXContext);
}
