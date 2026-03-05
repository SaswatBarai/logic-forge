"use client";

import { motion } from "framer-motion";
import { BookOpen, Cog, Shield } from "lucide-react";
import type { StoryZone } from "@/store/story-store";

const ZONES: {
    id: StoryZone;
    icon: React.ElementType;
    title: string;
    subtitle: string;
    realm: string;
    enemy: string;
    desc: string;
    accent: string;
    border: string;
    glow: string;
}[] = [
        {
            id: "ARCHIVE_CITADEL",
            icon: BookOpen,
            title: "The Archive Citadel",
            subtitle: "📚 Database Realm",
            realm: "Databases",
            enemy: "🐉 Nullus the Dread Wyrm",
            desc: "A library of 10 million tomes, guarded by Elder Query. Master relational databases to find the weapon that slays the wyrm.",
            accent: "text-blue-400",
            border: "border-blue-400/40",
            glow: "bg-blue-400/10",
        },
        {
            id: "FORGE_VILLAGE",
            icon: Cog,
            title: "The Forge Village",
            subtitle: "⚙️ Operating Systems Realm",
            realm: "Operating Systems",
            enemy: "⚙️ Deadlock the Iron Golem",
            desc: "Ferron the Iron Golem is dying from mismanaged energy. Restore proper scheduling, resolve deadlocks, and manage memory.",
            accent: "text-amber-400",
            border: "border-amber-400/40",
            glow: "bg-amber-400/10",
        },
        {
            id: "WALL_OF_GATES",
            icon: Shield,
            title: "The Wall of Gates",
            subtitle: "🔒 Computer Networks Realm",
            realm: "Computer Networks",
            enemy: "🌑 Overflow the Shadow Mob",
            desc: "Fight deception with routing algorithms, verify messengers, and defend against flood attacks. Every road is a trap.",
            accent: "text-emerald-400",
            border: "border-emerald-400/40",
            glow: "bg-emerald-400/10",
        },
    ];

const ease = [0.16, 1, 0.3, 1] as const;

export function ZoneSelector({ onSelect }: { onSelect: (zone: StoryZone) => void }) {
    return (
        <div className="flex flex-col items-center gap-12 w-full max-w-5xl mx-auto px-6 py-16">
            {/* Title */}
            <motion.div
                className="text-center space-y-4"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease }}
            >
                <div className="flex items-center justify-center gap-2 font-mono text-[9px] uppercase tracking-[0.3em]">
                    <span className="text-primary">▶</span>
                    <span className="text-foreground/40">IRONCLAD CHRONICLES</span>
                </div>
                <h1 className="text-5xl sm:text-6xl md:text-7xl font-black leading-[0.88] tracking-tighter uppercase text-foreground">
                    Choose your<br />
                    <span className="text-primary">front.</span>
                </h1>
                <p className="text-sm text-muted-foreground font-medium max-w-md mx-auto leading-relaxed">
                    Three zones. Three wars. One knight. Every CS decision has real consequences.
                </p>
            </motion.div>

            {/* Zone Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                {ZONES.map((zone, i) => (
                    <motion.button
                        key={zone.id}
                        onClick={() => onSelect(zone.id)}
                        className={`group relative flex flex-col gap-5 p-6 text-left border-2 border-foreground/20 bg-card cursor-pointer transition-all duration-200
                            shadow-[3px_3px_0px_0px_hsl(var(--foreground)/0.1)]
                            hover:shadow-[5px_5px_0px_0px_hsl(var(--foreground)/0.2)]
                            hover:${zone.border}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + i * 0.1, duration: 0.5, ease }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.97, x: 2, y: 2 }}
                    >
                        {/* Glow */}
                        <div className={`absolute inset-0 ${zone.glow} opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`} />

                        {/* Icon */}
                        <div className={`relative size-14 border-2 border-foreground/15 flex items-center justify-center shrink-0
                            group-hover:border-current ${zone.accent} transition-colors`}>
                            <zone.icon className="size-7" />
                        </div>

                        {/* Content */}
                        <div className="relative space-y-2">
                            <p className={`text-[9px] font-mono uppercase tracking-widest ${zone.accent}`}>
                                {zone.subtitle}
                            </p>
                            <h2 className="text-xl font-black uppercase tracking-tight text-foreground">
                                {zone.title}
                            </h2>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {zone.desc}
                            </p>
                        </div>

                        {/* Enemy badge */}
                        <div className="relative flex items-center gap-2 px-3 py-2 border border-foreground/10 bg-foreground/5 mt-auto">
                            <span className="text-[9px] font-mono uppercase tracking-widest text-foreground/40">BOSS:</span>
                            <span className="text-[10px] font-black text-foreground/70">{zone.enemy}</span>
                        </div>

                        {/* Realm tag */}
                        <div className="absolute top-4 right-4">
                            <span className={`text-[8px] font-mono px-2 py-0.5 border ${zone.border} ${zone.accent} uppercase tracking-widest`}>
                                {zone.realm}
                            </span>
                        </div>
                    </motion.button>
                ))}
            </div>

            {/* Lore footer */}
            <motion.div
                className="border-2 border-foreground/15 bg-card px-6 py-4 max-w-2xl w-full shadow-retro-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
            >
                <p className="text-xs text-muted-foreground text-center leading-relaxed">
                    You are <span className="text-primary font-bold">Sir Axiom</span> — a knight of the Kingdom of Bitfeld.
                    The kingdom is under siege from three ancient forces.
                    Your CS knowledge is your only weapon.
                </p>
            </motion.div>
        </div>
    );
}
