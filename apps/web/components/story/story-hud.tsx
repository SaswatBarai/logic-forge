"use client";

import { motion } from "framer-motion";
import { Sword, Star, Skull, AlertTriangle, Zap, Activity } from "lucide-react";
import { useStoryStore } from "@/store/story-store";

const ZONE_LABELS: Record<string, string> = {
    ARCHIVE_CITADEL: "Archive Citadel",
    FORGE_VILLAGE: "Forge Village",
    WALL_OF_GATES: "Wall of Gates",
};

export function StoryHud() {
    const { zone, act, xp, rank, scars, debts, energyMeter } = useStoryStore();

    return (
        <div
            className="flex items-center justify-between px-6 py-3 border-b-2 border-foreground/15 bg-foreground text-background z-20 relative"
        >
            {/* Left: Breadcrumb */}
            <div className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest">
                <span className="text-primary font-black">LOGICFORGE</span>
                <span className="opacity-30 mx-1">/</span>
                <span className="opacity-40">STORY</span>
                <span className="opacity-20 mx-1">/</span>
                <span className="opacity-60">{zone ? ZONE_LABELS[zone] ?? zone : "SELECT"}</span>
                {zone && (
                    <>
                        <span className="opacity-20 mx-1">/</span>
                        <span className="text-primary opacity-80">ACT {act}</span>
                    </>
                )}
            </div>

            {/* Center: Stats */}
            <div className="flex items-center gap-4">
                {/* XP */}
                <div className="flex items-center gap-1.5">
                    <Sword className="size-3 text-primary" />
                    <span className="text-[10px] font-mono font-bold text-primary">{xp} XP</span>
                </div>

                {/* Rank */}
                <div className="flex items-center gap-1.5">
                    <Star className="size-3 text-yellow-400" />
                    <span className="text-[10px] font-mono font-bold text-yellow-400">{rank}</span>
                </div>

                {/* Energy (Zone 2 only) */}
                {energyMeter !== null && (
                    <div className="flex items-center gap-1.5">
                        <Activity className="size-3 text-amber-400" />
                        <div className="w-16 h-2 bg-white/10 overflow-hidden">
                            <motion.div
                                className={`h-full ${energyMeter > 70 ? "bg-emerald-400" :
                                        energyMeter > 40 ? "bg-amber-400" :
                                            "bg-destructive"
                                    }`}
                                animate={{ width: `${energyMeter}%` }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>
                        <span className="text-[9px] font-mono text-white/50">{energyMeter}%</span>
                    </div>
                )}
            </div>

            {/* Right: Scars & Debts */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5" title={scars.length > 0 ? scars.map(s => s.name).join(", ") : "No scars"}>
                    <Skull className={`size-3 ${scars.length > 0 ? "text-destructive" : "text-white/20"}`} />
                    <span className={`text-[10px] font-mono font-bold ${scars.length > 0 ? "text-destructive" : "text-white/20"}`}>
                        {scars.length}
                    </span>
                </div>

                <div className="flex items-center gap-1.5" title={debts.length > 0 ? debts.map(d => d.name).join(", ") : "No debts"}>
                    <AlertTriangle className={`size-3 ${debts.length > 0 ? "text-amber-400" : "text-white/20"}`} />
                    <span className={`text-[10px] font-mono font-bold ${debts.length > 0 ? "text-amber-400" : "text-white/20"}`}>
                        {debts.length}
                    </span>
                </div>

                {/* Rank badge */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 border border-primary/30">
                    <Zap className="size-3 text-primary" />
                    <span className="text-[9px] font-mono text-primary uppercase tracking-widest font-bold">{rank}</span>
                </div>
            </div>
        </div>
    );
}
