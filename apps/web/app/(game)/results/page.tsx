"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/game-store";
import { ResultsScreen } from "@/components/game/results-screen";

export default function ResultsPage() {
    const status = useGameStore((s) => s.status);
    const router = useRouter();

    // If user navigates here without a completed session, redirect home
    useEffect(() => {
        if (status !== "COMPLETED") {
            router.push("/arcade");
        }
    }, [status, router]);

    if (status !== "COMPLETED") return null;

    return <ResultsScreen />;
}
