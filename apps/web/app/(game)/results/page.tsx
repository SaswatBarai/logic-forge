"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/game-store";
import { ResultsScreen } from "@/components/game/results-screen";

export default function ResultsPage() {
    const sessionStatus = useGameStore((s) => s.sessionStatus);
    const router = useRouter();

    // If user navigates here without a completed session, redirect home
    useEffect(() => {
        if (sessionStatus !== "COMPLETED") {
            router.push("/arcade");
        }
    }, [sessionStatus, router]);

    if (sessionStatus !== "COMPLETED") return null;

    return <ResultsScreen />;
}
