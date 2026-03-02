// apps/web/app/(game)/arcade/page.tsx
"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { MatchLobby }    from "@/components/game/lobby";
import { GameArena }     from "@/components/game/arena";
import { ResultsScreen } from "@/components/game/results-screen";
import { useGameEngine } from "@/hooks/use-game-engine";
import {
    Loader2, RefreshCw, Zap, Shield, Cpu,
    User, Users, Timer, Braces, ArrowLeft, CheckCircle2,
} from "lucide-react";

type PlayerFormat  = "SINGLE" | "DUAL";
type SessionType   = "TIMER" | "LIVE";
type TimerCategory = "MISSING_LINK" | "BOTTLENECK" | "TRACING";

const ease = [0.22, 1, 0.36, 1] as const;

// ── Wizard option definitions ─────────────────────────────────────────────
const FORMAT_OPTIONS = [
    { value: "SINGLE" as PlayerFormat, icon: User,   label: "Solo Run",     desc: "You vs. the system. Pure skill, no excuses." },
    { value: "DUAL"   as PlayerFormat, icon: Users,  label: "Dual Engine",  desc: "Head-to-head. Find a rival, settle it live." },
] as const;

const TYPE_OPTIONS = [
    { value: "TIMER" as SessionType, icon: Timer, label: "Timer Mode", desc: "One category, five rounds, increasing pressure.", color: "text-primary" },
    { value: "LIVE"  as SessionType, icon: Zap,   label: "Live Mode",  desc: "Random categories every round. Lives system active.", color: "text-yellow-400" },
] as const;

const CATEGORY_OPTIONS = [
    { value: "MISSING_LINK" as TimerCategory, icon: Braces, label: "Missing Link",       desc: "Complete the missing logical condition." },
    { value: "BOTTLENECK"   as TimerCategory, icon: Zap,    label: "Bottleneck Breaker", desc: "Identify the optimal algorithm or structure." },
    { value: "TRACING"      as TimerCategory, icon: Cpu,    label: "State Tracing",      desc: "Predict the final state after execution." },
] as const;

// ── Step copy ─────────────────────────────────────────────────────────────
const STEP_COPY = [
    { eyebrow: "Step 1 of 3", headline: "Choose your\nformat.", sub: "Determines matchmaking and scoring logic." },
    { eyebrow: "Step 2 of 3", headline: "Session\ntype.",       sub: "Defines how challenges are selected and paced." },
    { eyebrow: "Step 3 of 3", headline: "Pick your\ncategory.", sub: "All five rounds will use this challenge type." },
    { eyebrow: "Ready",       headline: "Parameters\nlocked.",  sub: "Review your session config, then enter the arena." },
];

// ── Reusable card button ──────────────────────────────────────────────────
function SelectCard({ icon: Icon, label, desc, iconClass = "text-primary", onClick }: {
    icon: React.ElementType; label: string; desc: string;
    iconClass?: string; onClick: () => void;
}) {
    return (
        <motion.button
            className="arcade-btn group flex flex-col gap-3 p-6 border-2 border-foreground bg-card shadow-retro text-left w-full cursor-pointer"
            whileHover={{ scale: 1.02, boxShadow: "5px 5px 0px 0px hsl(var(--foreground) / 0.15)" }}
            whileTap={{ scale: 0.98, x: 2, y: 2, boxShadow: "0px 0px 0px 0px" }}
            onClick={onClick}
        >
            <Icon className={`size-7 shrink-0 ${iconClass} group-hover:scale-110 transition-transform`} />
            <div>
                <p className="font-black uppercase tracking-widest text-sm text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 font-medium">{desc}</p>
            </div>
        </motion.button>
    );
}

function ConfigPill({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div className="border border-foreground/20 px-2 py-2 bg-background/5">
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-mono">{label}</p>
            <p className={`text-sm font-black uppercase mt-0.5 ${highlight ? "text-yellow-400" : "text-foreground"}`}>{value}</p>
        </div>
    );
}

export default function ArcadeModePage() {
    const { data: session } = useSession();

    const {
        connected, socketStatus, matchStatus,
        sessionStatus, queueError, enterQueue, reset,
    } = useGameEngine();

    // ── Wizard state ──────────────────────────────────────────────────────
    const [step,         setStep]         = useState(0);
    const [playerFormat, setPlayerFormat] = useState<PlayerFormat | null>(null);
    const [sessionType,  setSessionType]  = useState<SessionType  | null>(null);
    const [category,     setCategory]     = useState<TimerCategory | null>(null);
    const [isQueuing,    setIsQueuing]    = useState(false);

    const isInSession = matchStatus === "MATCHED" || sessionStatus !== "IDLE";
    const hasError    = socketStatus === "ERROR";
    const copy        = STEP_COPY[step] ?? STEP_COPY[0];

    const handleBack = useCallback(() => {
        if (step === 3 && sessionType === "LIVE") setStep(1);
        else setStep((p) => Math.max(0, p - 1));
    }, [step, sessionType]);

    const handleEnterArena = useCallback(async () => {
        if (!playerFormat || !sessionType) return;
        setIsQueuing(true);
        await enterQueue({ playerFormat, sessionType, category });
        setIsQueuing(false);
    }, [playerFormat, sessionType, category, enterQueue]);

    // ── In-session views ──────────────────────────────────────────────────
    if (isInSession) {
        return (
            <div className="relative min-h-screen flex flex-col bg-background select-none">
                <div className="flex-1 flex flex-col">
                    {sessionStatus === "LOBBY"     && <MatchLobby />}
                    {sessionStatus === "ACTIVE"    && <GameArena />}
                    {sessionStatus === "COMPLETED" && <ResultsScreen />}
                    {sessionStatus === "ABORTED"   && (
                        <div className="flex-1 flex flex-col items-center justify-center gap-6">
                            <p className="text-destructive font-black text-xl uppercase">Session Aborted</p>
                            <button
                                className="arcade-btn px-8 py-4 border-2 border-foreground bg-card shadow-retro font-black uppercase tracking-widest"
                                onClick={reset}
                            >
                                Return to Lobby
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ── Wizard ────────────────────────────────────────────────────────────
    return (
        <div className="relative min-h-screen flex flex-col bg-background selection:bg-primary selection:text-primary-foreground select-none">
            <main className="flex-1 flex flex-col">
                <section className="flex-1 min-h-[85vh] relative overflow-hidden">
                    {/* Background dot grid */}
                    <div className="absolute inset-0 opacity-[0.03]"
                        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)", backgroundSize: "24px 24px" }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/50 pointer-events-none" />

                    <div className="relative max-w-7xl mx-auto px-6 py-16 lg:py-24 grid lg:grid-cols-2 gap-16 lg:gap-20 items-center min-h-[85vh]">

                        {/* ── LEFT: Copy + Wizard ── */}
                        <div className="flex flex-col gap-8 z-10 order-2 lg:order-1">

                            {/* Eyebrow + Headline */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={`copy-${step}`}
                                    className="space-y-2"
                                    initial={{ opacity: 0, x: -16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 16 }}
                                    transition={{ duration: 0.35, ease }}
                                >
                                    <div className="flex items-center gap-3">
                                        {step > 0 && (
                                            <button onClick={handleBack} className="text-muted-foreground hover:text-foreground transition-colors">
                                                <ArrowLeft className="size-5" />
                                            </button>
                                        )}
                                        <p className="text-sm font-black uppercase tracking-[0.2em] text-primary">{copy.eyebrow}</p>
                                    </div>
                                    <h1 className="text-5xl sm:text-6xl md:text-7xl font-black leading-[0.92] tracking-tighter uppercase text-foreground whitespace-pre-line">
                                        {copy.headline}
                                    </h1>
                                    <p className="text-muted-foreground text-base font-medium max-w-md pt-1">{copy.sub}</p>
                                </motion.div>
                            </AnimatePresence>

                            {/* ── STEP 0: Player Format ── */}
                            <AnimatePresence mode="wait">
                                {step === 0 && (
                                    <motion.div key="step-0" className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg"
                                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35, ease }}>
                                        {FORMAT_OPTIONS.map((opt) => (
                                            <SelectCard key={opt.value} icon={opt.icon} label={opt.label} desc={opt.desc}
                                                onClick={() => { setPlayerFormat(opt.value); setStep(1); }} />
                                        ))}
                                    </motion.div>
                                )}

                                {/* ── STEP 1: Session Type ── */}
                                {step === 1 && (
                                    <motion.div key="step-1" className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg"
                                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35, ease }}>
                                        {TYPE_OPTIONS.map((opt) => (
                                            <SelectCard key={opt.value} icon={opt.icon} label={opt.label} desc={opt.desc}
                                                iconClass={opt.color}
                                                onClick={() => {
                                                    setSessionType(opt.value);
                                                    if (opt.value === "LIVE") { setCategory(null); setStep(3); }
                                                    else setStep(2);
                                                }} />
                                        ))}
                                    </motion.div>
                                )}

                                {/* ── STEP 2: Category (Timer only) ── */}
                                {step === 2 && (
                                    <motion.div key="step-2" className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl"
                                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35, ease }}>
                                        {CATEGORY_OPTIONS.map((opt) => (
                                            <SelectCard key={opt.value} icon={opt.icon} label={opt.label} desc={opt.desc}
                                                onClick={() => { setCategory(opt.value); setStep(3); }} />
                                        ))}
                                    </motion.div>
                                )}

                                {/* ── STEP 3: Confirm + Enter ── */}
                                {step === 3 && (
                                    <motion.div key="step-3" className="flex flex-col gap-6 max-w-lg"
                                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35, ease }}>

                                        {/* Config summary */}
                                        <div className="border-2 border-foreground bg-card shadow-retro-lg p-5 space-y-3">
                                            <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Session Config</p>
                                            <div className="grid grid-cols-3 gap-3 text-center">
                                                <ConfigPill label="Format"   value={playerFormat ?? "—"} />
                                                <ConfigPill label="Type"     value={sessionType  ?? "—"} />
                                                <ConfigPill label="Category"
                                                    value={sessionType === "LIVE" ? "Random" : (category?.replace(/_/g, " ") ?? "—")}
                                                    highlight={sessionType === "LIVE"}
                                                />
                                            </div>
                                        </div>

                                        {/* Feature strip */}
                                        <div className="flex flex-wrap gap-3">
                                            {[
                                                { icon: Zap,    label: "5 Rounds" },
                                                { icon: Shield, label: "AI-Proof" },
                                                { icon: Cpu,    label: "Live Execution" },
                                            ].map((item, i) => (
                                                <motion.div key={item.label}
                                                    className="flex items-center gap-2 px-4 py-2 border-2 border-foreground shadow-retro-sm font-bold uppercase tracking-widest text-xs bg-card"
                                                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.1 + i * 0.06 }} whileHover={{ scale: 1.02 }}>
                                                    <item.icon className="size-4 text-primary shrink-0" />
                                                    <span>{item.label}</span>
                                                </motion.div>
                                            ))}
                                        </div>

                                        {/* Errors */}
                                        {queueError && (
                                            <div className="border-2 border-destructive bg-destructive/10 px-5 py-3 shadow-retro-sm">
                                                <p className="text-sm font-bold text-destructive">{queueError}</p>
                                            </div>
                                        )}
                                        {hasError && (
                                            <div className="flex flex-col gap-3">
                                                <div className="border-2 border-destructive bg-destructive/10 px-5 py-3 shadow-retro-sm">
                                                    <p className="text-sm font-bold text-destructive">
                                                        Unable to reach the game server. Ensure services are running.
                                                    </p>
                                                </div>
                                                <button
                                                    className="arcade-btn w-fit bg-card px-5 py-2.5 border-2 border-foreground shadow-retro text-sm font-black uppercase tracking-widest flex items-center gap-2"
                                                    onClick={() => window.location.reload()}
                                                >
                                                    <RefreshCw className="size-4" /> Retry Connection
                                                </button>
                                            </div>
                                        )}

                                        {/* CTA */}
                                        <motion.button
                                            className="arcade-btn bg-primary px-10 py-5 border-2 border-foreground shadow-retro text-xl font-black uppercase tracking-widest flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden w-fit"
                                            whileHover={connected && !isQueuing ? { scale: 1.04, boxShadow: "6px 6px 0px 0px hsl(var(--navy))" } : {}}
                                            whileTap={connected && !isQueuing   ? { scale: 0.97, x: 2, y: 2, boxShadow: "0px 0px 0px 0px hsl(var(--navy))" } : {}}
                                            onClick={handleEnterArena}
                                            disabled={!connected || isQueuing}
                                        >
                                            {isQueuing ? (
                                                <><Loader2 className="size-6 animate-spin shrink-0" /><span>Joining Queue…</span></>
                                            ) : !connected ? (
                                                <><Loader2 className="size-6 animate-spin shrink-0" /><span>Connecting…</span></>
                                            ) : (
                                                <><span className="text-2xl shrink-0">▶</span><span>Enter Arena</span></>
                                            )}
                                        </motion.button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* ── RIGHT: CRT Preview Screen ── */}
                        <motion.div
                            className="relative order-1 lg:order-2 flex justify-center lg:justify-end"
                            initial={{ opacity: 0, x: 24 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.2, ease }}
                        >
                            <div className="w-full max-w-md border-4 border-foreground bg-foreground shadow-retro-lg p-2 relative">
                                <div className="aspect-[4/3] flex flex-col items-center justify-center gap-6 p-8 text-background overflow-hidden"
                                    style={{ backgroundColor: "hsl(var(--editor-bg))" }}>
                                    {/* Scanline overlay */}
                                    <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
                                        style={{ backgroundImage: "repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 4px)" }} />

                                    <AnimatePresence mode="wait">
                                        <motion.div key={`crt-${step}`} className="flex flex-col items-center gap-5 w-full"
                                            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>

                                            {step === 3 ? (
                                                <>
                                                    <CheckCircle2 className="size-10 text-primary" />
                                                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary">Parameters Locked</p>
                                                    <div className="flex flex-col gap-2 w-full px-4 font-mono text-xs">
                                                        {[
                                                            ["FORMAT",   playerFormat ?? "—"],
                                                            ["TYPE",     sessionType  ?? "—"],
                                                            ["CATEGORY", sessionType === "LIVE" ? "RANDOM" : (category ?? "—")],
                                                        ].map(([k, v]) => (
                                                            <div key={k} className="flex justify-between border-b border-white/10 pb-1">
                                                                <span className="text-white/50">{k}</span>
                                                                <span className={`font-bold ${k === "CATEGORY" && sessionType === "LIVE" ? "text-yellow-400" : "text-white"}`}>{v}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            ) : step === 2 ? (
                                                <>
                                                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary">Timer Mode</p>
                                                    <div className="flex flex-col gap-2 w-full px-2">
                                                        {CATEGORY_OPTIONS.map((c) => (
                                                            <div key={c.value} className="border border-white/10 px-3 py-2 flex items-center gap-3">
                                                                <c.icon className="size-4 text-primary shrink-0" />
                                                                <p className="text-[10px] font-mono text-white/70">{c.label}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            ) : step === 1 ? (
                                                <>
                                                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary">
                                                        Format: <span className="text-white">{playerFormat}</span>
                                                    </p>
                                                    <div className="flex flex-col gap-3 w-full px-4">
                                                        <div className="border border-primary/40 px-4 py-3 text-center">
                                                            <Timer className="size-5 text-primary mx-auto mb-1" />
                                                            <p className="text-xs font-mono text-white/80">TIMER — Fixed category, 5 rounds</p>
                                                        </div>
                                                        <div className="border border-yellow-400/40 px-4 py-3 text-center">
                                                            <Zap className="size-5 text-yellow-400 mx-auto mb-1" />
                                                            <p className="text-xs font-mono text-white/80">LIVE — Random + Lives system</p>
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary">Select Format</p>
                                                    <div className="flex items-center gap-8">
                                                        <div className="w-20 h-20 rounded-full border-2 border-primary bg-primary/20 flex items-center justify-center text-2xl font-black text-white">P1</div>
                                                        <span className="text-3xl font-black text-primary">VS</span>
                                                        <div className="w-20 h-20 rounded-full border-2 border-destructive bg-destructive/20 flex items-center justify-center text-2xl font-black text-white">P2</div>
                                                    </div>
                                                    <p className="text-xs font-mono text-center text-white/60 max-w-[200px]">
                                                        Solo challenge or live 1v1? Choose your battle format.
                                                    </p>
                                                </>
                                            )}
                                        </motion.div>
                                    </AnimatePresence>
                                </div>
                                {/* Corner accent */}
                                <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-2 border-r-2 border-primary/50" />
                            </div>
                        </motion.div>

                    </div>
                </section>
            </main>
        </div>
    );
}
