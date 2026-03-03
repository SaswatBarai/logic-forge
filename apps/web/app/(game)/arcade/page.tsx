// apps/web/app/(game)/arcade/page.tsx
"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { MatchLobby } from "@/components/game/lobby";
import { GameArena } from "@/components/game/arena";
import { ResultsScreen } from "@/components/game/results-screen";
import { useGameEngine } from "@/hooks/use-game-engine";
import {
    Loader2, RefreshCw, Zap, Shield, Cpu,
    User, Users, Timer, Braces, ArrowLeft, CheckCircle2,
} from "lucide-react";

type PlayerFormat = "SINGLE" | "DUAL";
type SessionType  = "TIMER" | "LIVE";
type TimerCategory = "MISSING_LINK" | "BOTTLENECK" | "TRACING";

const ease = [0.22, 1, 0.36, 1] as const;

const FORMAT_OPTIONS = [
    { value: "SINGLE" as PlayerFormat, icon: User,  label: "Solo Run",     desc: "You vs. the system. Pure skill, no excuses." },
    { value: "DUAL"   as PlayerFormat, icon: Users, label: "Dual Engine",  desc: "Head-to-head. Find a rival, settle it live." },
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

const STEP_COPY = [
    { eyebrow: "Step 1 of 3", headline: "Choose your\nformat.",    sub: "Determines matchmaking and scoring logic." },
    { eyebrow: "Step 2 of 3", headline: "Session\ntype.",          sub: "Defines how challenges are selected and paced." },
    { eyebrow: "Step 3 of 3", headline: "Pick your\ncategory.",   sub: "All five rounds will use this challenge type." },
    { eyebrow: "Ready",       headline: "Parameters\nlocked.",     sub: "Review your session config, then enter the arena." },
];

// ── Step indicator dots ───────────────────────────────────────────────────
function StepDots({ current, total }: { current: number; total: number }) {
    return (
        <div className="flex items-center gap-2">
            {Array.from({ length: total }).map((_, i) => (
                <motion.div
                    key={i}
                    className="h-1.5 rounded-full bg-foreground/20"
                    animate={{ width: i === current ? 24 : 6, backgroundColor: i <= current ? "hsl(var(--primary))" : "hsl(var(--foreground) / 0.2)" }}
                    transition={{ duration: 0.3 }}
                />
            ))}
        </div>
    );
}

// ── Select card ───────────────────────────────────────────────────────────
function SelectCard({ icon: Icon, label, desc, iconClass = "text-primary", selected = false, onClick }: {
    icon: React.ElementType; label: string; desc: string;
    iconClass?: string; selected?: boolean; onClick: () => void;
}) {
    return (
        <motion.button
            className={`group relative flex flex-col gap-3 p-6 border-2 text-left w-full cursor-pointer transition-colors duration-150
                ${selected
                    ? "border-primary bg-primary/5 shadow-[4px_4px_0px_0px_hsl(var(--primary))]"
                    : "border-foreground bg-card shadow-[4px_4px_0px_0px_hsl(var(--foreground)/0.12)] hover:border-primary/60 hover:shadow-[4px_4px_0px_0px_hsl(var(--primary)/0.3)]"
                }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97, x: 2, y: 2 }}
            onClick={onClick}
        >
            {selected && (
                <motion.div
                    className="absolute top-3 right-3"
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                    <CheckCircle2 className="size-4 text-primary" />
                </motion.div>
            )}
            <div className={`size-10 border-2 flex items-center justify-center transition-colors ${selected ? "border-primary bg-primary/10" : "border-foreground/20 bg-foreground/5 group-hover:border-primary/40"}`}>
                <Icon className={`size-5 shrink-0 ${iconClass}`} />
            </div>
            <div>
                <p className="font-black uppercase tracking-widest text-sm text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground mt-1 font-medium leading-relaxed">{desc}</p>
            </div>
        </motion.button>
    );
}

function ConfigPill({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div className="border border-foreground/20 px-3 py-2.5 bg-background/5 flex flex-col gap-1">
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-mono">{label}</p>
            <p className={`text-sm font-black uppercase ${highlight ? "text-yellow-400" : "text-foreground"}`}>{value}</p>
        </div>
    );
}

// ── CRT screen right panel ────────────────────────────────────────────────
function CrtScreen({ step, playerFormat, sessionType, category }: {
    step: number; playerFormat: PlayerFormat | null;
    sessionType: SessionType | null; category: TimerCategory | null;
}) {
    return (
        <div className="w-full max-w-[420px] relative">
            {/* Monitor bezel */}
            <div className="border-[3px] border-foreground bg-foreground shadow-[8px_8px_0px_0px_hsl(var(--foreground)/0.3)] p-2.5">
                {/* Screen */}
                <div
                    className="relative aspect-[4/3] overflow-hidden flex flex-col"
                    style={{ backgroundColor: "hsl(220 40% 8%)" }}
                >
                    {/* Scanlines */}
                    <div className="absolute inset-0 pointer-events-none z-10 opacity-[0.035]"
                        style={{ backgroundImage: "repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 3px)" }} />
                    {/* Screen glow vignette */}
                    <div className="absolute inset-0 pointer-events-none z-10"
                        style={{ background: "radial-gradient(ellipse at center, transparent 60%, hsl(220 40% 4% / 0.7) 100%)" }} />
                    {/* Status bar */}
                    <div className="flex items-center gap-2 px-4 pt-3 pb-2 border-b border-white/5 shrink-0">
                        <div className="flex gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-destructive/80" />
                            <div className="w-2 h-2 rounded-full bg-yellow-400/80" />
                            <div className="w-2 h-2 rounded-full bg-accent/80" />
                        </div>
                        <p className="text-[9px] font-mono text-white/30 ml-auto tracking-widest uppercase">LOGICFORGE · ARENA CONFIG</p>
                    </div>
                    {/* Content */}
                    <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-0">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={`crt-${step}`}
                                className="flex flex-col items-center gap-4 w-full"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.25 }}
                            >
                                {step === 3 ? (
                                    <>
                                        <motion.div
                                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                                            transition={{ type: "spring", stiffness: 300, damping: 18 }}
                                        >
                                            <CheckCircle2 className="size-12 text-primary drop-shadow-[0_0_12px_hsl(var(--primary)/0.6)]" />
                                        </motion.div>
                                        <p className="text-[9px] font-mono uppercase tracking-[0.35em] text-primary">Config Confirmed</p>
                                        <div className="flex flex-col gap-1.5 w-full font-mono text-xs mt-1">
                                            {[
                                                { k: "FORMAT",   v: playerFormat ?? "—" },
                                                { k: "TYPE",     v: sessionType ?? "—" },
                                                { k: "CATEGORY", v: sessionType === "LIVE" ? "RANDOM" : (category ?? "—"), highlight: sessionType === "LIVE" },
                                                { k: "ROUNDS",   v: "5" },
                                            ].map(({ k, v, highlight }) => (
                                                <div key={k} className="flex justify-between items-center border-b border-white/8 pb-1.5">
                                                    <span className="text-white/40">{k}</span>
                                                    <span className={`font-bold tracking-wide ${highlight ? "text-yellow-400" : "text-white"}`}>{v}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-2 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                            <p className="text-[8px] font-mono text-primary/60 uppercase tracking-widest">Ready to deploy</p>
                                        </div>
                                    </>
                                ) : step === 2 ? (
                                    <>
                                        <p className="text-[9px] font-mono uppercase tracking-[0.3em] text-primary mb-1">
                                            Timer Mode · <span className="text-white/60">Select Category</span>
                                        </p>
                                        <div className="flex flex-col gap-2 w-full">
                                            {CATEGORY_OPTIONS.map((c, i) => (
                                                <motion.div
                                                    key={c.value}
                                                    className="border border-white/10 px-3 py-2.5 flex items-center gap-3 hover:border-primary/40 transition-colors"
                                                    initial={{ opacity: 0, x: -8 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.07 }}
                                                >
                                                    <c.icon className="size-3.5 text-primary shrink-0" />
                                                    <div>
                                                        <p className="text-[10px] font-mono text-white/80 font-bold">{c.label}</p>
                                                        <p className="text-[8px] font-mono text-white/30 mt-0.5">{c.desc}</p>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </>
                                ) : step === 1 ? (
                                    <>
                                        <p className="text-[9px] font-mono uppercase tracking-[0.3em] text-primary">
                                            Format: <span className="text-white">{playerFormat}</span>
                                        </p>
                                        <div className="flex flex-col gap-2.5 w-full mt-1">
                                            <motion.div
                                                className="border border-primary/30 bg-primary/5 px-4 py-3"
                                                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Timer className="size-4 text-primary shrink-0" />
                                                    <div>
                                                        <p className="text-[10px] font-mono text-white font-bold uppercase tracking-wide">Timer Mode</p>
                                                        <p className="text-[8px] font-mono text-white/40 mt-0.5">Fixed category · Escalating time pressure</p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                            <motion.div
                                                className="border border-yellow-400/30 bg-yellow-400/5 px-4 py-3"
                                                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Zap className="size-4 text-yellow-400 shrink-0" />
                                                    <div>
                                                        <p className="text-[10px] font-mono text-white font-bold uppercase tracking-wide">Live Mode</p>
                                                        <p className="text-[8px] font-mono text-white/40 mt-0.5">Random categories · Lives system</p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-[9px] font-mono uppercase tracking-[0.35em] text-white/40">Battle Format</p>
                                        <div className="flex items-center gap-6 mt-1">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-16 h-16 rounded-full border-2 border-primary bg-primary/15 flex items-center justify-center">
                                                    <span className="text-lg font-black text-white font-mono">P1</span>
                                                </div>
                                                <p className="text-[8px] font-mono text-white/30">YOU</p>
                                            </div>
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="text-2xl font-black text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]">VS</span>
                                                <div className="w-px h-8 bg-white/10" />
                                            </div>
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-16 h-16 rounded-full border-2 border-destructive bg-destructive/15 flex items-center justify-center">
                                                    <span className="text-lg font-black text-white font-mono">P2</span>
                                                </div>
                                                <p className="text-[8px] font-mono text-white/30">RIVAL</p>
                                            </div>
                                        </div>
                                        <p className="text-[9px] font-mono text-center text-white/40 max-w-[180px] leading-relaxed mt-1">
                                            Solo challenge or live 1v1?<br />Choose your battle format.
                                        </p>
                                    </>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                    {/* Bottom status bar */}
                    <div className="flex items-center justify-between px-4 py-2 border-t border-white/5 shrink-0">
                        <p className="text-[8px] font-mono text-white/20">SYS:ONLINE</p>
                        <div className="flex gap-1">
                            {[0, 1, 2, 3].map((i) => (
                                <div key={i} className={`w-1 h-1 rounded-full ${i <= step ? "bg-primary" : "bg-white/10"}`} />
                            ))}
                        </div>
                        <p className="text-[8px] font-mono text-white/20">v2.0.1</p>
                    </div>
                </div>
            </div>
            {/* Monitor stand */}
            <div className="flex justify-center">
                <div className="w-16 h-2 bg-foreground" />
            </div>
            <div className="flex justify-center">
                <div className="w-28 h-1.5 bg-foreground/60" />
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ArcadeModePage() {
    const { data: session } = useSession();

    const {
        connected, socketStatus, matchStatus,
        sessionStatus, sessionId, queueError,
        enterQueue, joinSession, reset,
    } = useGameEngine();

    useEffect(() => {
        reset();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const retryCountRef = useRef(0);
    useEffect(() => {
        if (matchStatus !== "MATCHED" || sessionStatus !== "IDLE" || !sessionId || !connected) {
            retryCountRef.current = 0;
            return;
        }
        const maxRetries = 5;
        const interval = setInterval(() => {
            retryCountRef.current += 1;
            if (retryCountRef.current <= maxRetries) {
                console.info("[Arcade] Auto-retry JOIN_SESSION attempt", retryCountRef.current);
                joinSession(sessionId);
            } else {
                clearInterval(interval);
            }
        }, 4000);
        return () => clearInterval(interval);
    }, [matchStatus, sessionStatus, sessionId, connected, joinSession]);

    const [step, setStep]               = useState(0);
    const [playerFormat, setPlayerFormat] = useState<PlayerFormat | null>(null);
    const [sessionType, setSessionType]   = useState<SessionType | null>(null);
    const [category, setCategory]         = useState<TimerCategory | null>(null);
    const [isQueuing, setIsQueuing]       = useState(false);

    const isInSession = matchStatus === "MATCHED" || matchStatus === "QUEUED" || sessionStatus !== "IDLE";
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
                    {(sessionStatus === "LOBBY" || matchStatus === "QUEUED") && <MatchLobby />}
                    {sessionStatus === "ACTIVE"    && <GameArena />}
                    {sessionStatus === "COMPLETED" && <ResultsScreen />}
                    {matchStatus === "MATCHED" && sessionStatus === "IDLE" && (
                        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
                            <Loader2 className="size-12 animate-spin text-primary" />
                            <p className="text-lg font-bold uppercase tracking-widest">Connecting to arena…</p>
                            <p className="text-sm text-muted-foreground max-w-md text-center">
                                Establishing your session. If this takes too long, try again.
                            </p>
                            {sessionId && (
                                <button
                                    type="button"
                                    onClick={() => joinSession(sessionId)}
                                    className="arcade-btn px-8 py-4 border-2 border-foreground bg-primary shadow-retro font-black uppercase tracking-widest flex items-center gap-2"
                                >
                                    <RefreshCw className="size-4" /> Retry connection
                                </button>
                            )}
                            {queueError && (
                                <p className="text-sm text-destructive font-medium max-w-md text-center">{queueError}</p>
                            )}
                        </div>
                    )}
                    {sessionStatus === "ABORTED" && (
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
        <div className="relative min-h-screen flex flex-col bg-background selection:bg-primary selection:text-primary-foreground select-none overflow-hidden">

            {/* Background grid */}
            <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
                style={{ backgroundImage: "radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)", backgroundSize: "28px 28px" }} />
            {/* Gradient fade bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent pointer-events-none" />
            {/* Primary color accent blob */}
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-[0.03] pointer-events-none"
                style={{ background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)" }} />

            <main className="flex-1 flex flex-col">
                <section className="flex-1 relative">
                    <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24 grid lg:grid-cols-2 gap-16 lg:gap-24 items-center min-h-screen">

                        {/* ── LEFT ── */}
                        <div className="flex flex-col gap-8 z-10 order-2 lg:order-1">

                            {/* Step dots */}
                            <StepDots current={step} total={4} />

                            {/* Copy */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={`copy-${step}`}
                                    className="space-y-3"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.3, ease }}
                                >
                                    <div className="flex items-center gap-3">
                                        {step > 0 && (
                                            <motion.button
                                                onClick={handleBack}
                                                className="size-8 border border-foreground/20 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
                                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                            >
                                                <ArrowLeft className="size-4" />
                                            </motion.button>
                                        )}
                                        <p className="text-xs font-black uppercase tracking-[0.25em] text-primary">{copy.eyebrow}</p>
                                    </div>
                                    <h1 className="text-5xl sm:text-6xl md:text-7xl font-black leading-[0.9] tracking-tighter uppercase text-foreground whitespace-pre-line">
                                        {copy.headline}
                                    </h1>
                                    <p className="text-muted-foreground text-sm font-medium max-w-sm leading-relaxed">{copy.sub}</p>
                                </motion.div>
                            </AnimatePresence>

                            {/* ── Step panels ── */}
                            <AnimatePresence mode="wait">

                                {/* Step 0 */}
                                {step === 0 && (
                                    <motion.div key="step-0"
                                        className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg"
                                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3, ease }}
                                    >
                                        {FORMAT_OPTIONS.map((opt, i) => (
                                            <motion.div key={opt.value} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                                                <SelectCard icon={opt.icon} label={opt.label} desc={opt.desc}
                                                    selected={playerFormat === opt.value}
                                                    onClick={() => { setPlayerFormat(opt.value); setStep(1); }} />
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                )}

                                {/* Step 1 */}
                                {step === 1 && (
                                    <motion.div key="step-1"
                                        className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg"
                                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3, ease }}
                                    >
                                        {TYPE_OPTIONS.map((opt, i) => (
                                            <motion.div key={opt.value} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                                                <SelectCard icon={opt.icon} label={opt.label} desc={opt.desc}
                                                    iconClass={opt.color}
                                                    selected={sessionType === opt.value}
                                                    onClick={() => {
                                                        setSessionType(opt.value);
                                                        if (opt.value === "LIVE") { setCategory(null); setStep(3); }
                                                        else setStep(2);
                                                    }} />
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                )}

                                {/* Step 2 */}
                                {step === 2 && (
                                    <motion.div key="step-2"
                                        className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl"
                                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3, ease }}
                                    >
                                        {CATEGORY_OPTIONS.map((opt, i) => (
                                            <motion.div key={opt.value} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                                                <SelectCard icon={opt.icon} label={opt.label} desc={opt.desc}
                                                    selected={category === opt.value}
                                                    onClick={() => { setCategory(opt.value); setStep(3); }} />
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                )}

                                {/* Step 3 — Confirm */}
                                {step === 3 && (
                                    <motion.div key="step-3"
                                        className="flex flex-col gap-5 max-w-lg"
                                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3, ease }}
                                    >
                                        {/* Config summary */}
                                        <div className="border-2 border-foreground bg-card shadow-[4px_4px_0px_0px_hsl(var(--foreground)/0.15)] p-5">
                                            <div className="flex items-center justify-between mb-3">
                                                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground">Session Config</p>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                                    <p className="text-[8px] font-mono text-primary uppercase tracking-widest">Confirmed</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                <ConfigPill label="Format"   value={playerFormat ?? "—"} />
                                                <ConfigPill label="Type"     value={sessionType ?? "—"} />
                                                <ConfigPill label="Category"
                                                    value={sessionType === "LIVE" ? "Random" : (category?.replace(/_/g, " ") ?? "—")}
                                                    highlight={sessionType === "LIVE"}
                                                />
                                            </div>
                                        </div>

                                        {/* Feature tags */}
                                        <div className="flex flex-wrap gap-2">
                                            {[
                                                { icon: Zap,    label: "5 Rounds" },
                                                { icon: Shield, label: "AI-Proof" },
                                                { icon: Cpu,    label: "Live Execution" },
                                            ].map((item, i) => (
                                                <motion.div
                                                    key={item.label}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 border border-foreground/20 bg-card font-bold uppercase tracking-widest text-[10px]"
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: 0.08 + i * 0.05 }}
                                                >
                                                    <item.icon className="size-3 text-primary shrink-0" />
                                                    <span className="text-muted-foreground">{item.label}</span>
                                                </motion.div>
                                            ))}
                                        </div>

                                        {/* Errors */}
                                        {queueError && (
                                            <motion.div
                                                className="border-2 border-destructive bg-destructive/8 px-4 py-3"
                                                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                                            >
                                                <p className="text-sm font-bold text-destructive">{queueError}</p>
                                            </motion.div>
                                        )}
                                        {hasError && (
                                            <motion.div className="flex flex-col gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                                <div className="border-2 border-destructive bg-destructive/8 px-4 py-3">
                                                    <p className="text-sm font-bold text-destructive">
                                                        Unable to reach the game server. Ensure services are running.
                                                    </p>
                                                </div>
                                                <button
                                                    className="w-fit bg-card px-4 py-2 border-2 border-foreground shadow-[2px_2px_0px_0px_hsl(var(--foreground)/0.2)] text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-foreground/5 transition-colors"
                                                    onClick={() => window.location.reload()}
                                                >
                                                    <RefreshCw className="size-3.5" /> Retry Connection
                                                </button>
                                            </motion.div>
                                        )}

                                        {/* CTA */}
                                        <motion.button
                                            className="group relative bg-primary px-10 py-5 border-2 border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))] text-xl font-black uppercase tracking-widest flex items-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed w-fit overflow-hidden"
                                            whileHover={connected && !isQueuing ? { scale: 1.03, boxShadow: "6px 6px 0px 0px hsl(var(--foreground))" } : {}}
                                            whileTap={connected && !isQueuing ? { scale: 0.97, x: 3, y: 3, boxShadow: "0px 0px 0px 0px" } : {}}
                                            onClick={handleEnterArena}
                                            disabled={!connected || isQueuing}
                                        >
                                            {/* Shine sweep */}
                                            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
                                            {isQueuing ? (
                                                <><Loader2 className="size-6 animate-spin shrink-0" /><span>Joining Queue…</span></>
                                            ) : !connected ? (
                                                <><Loader2 className="size-6 animate-spin shrink-0" /><span>Connecting…</span></>
                                            ) : (
                                                <><span className="text-xl shrink-0">▶</span><span>Enter Arena</span></>
                                            )}
                                        </motion.button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* ── RIGHT: CRT Monitor ── */}
                        <motion.div
                            className="relative order-1 lg:order-2 flex justify-center lg:justify-end items-center"
                            initial={{ opacity: 0, x: 32 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.55, delay: 0.15, ease }}
                        >
                            <CrtScreen
                                step={step}
                                playerFormat={playerFormat}
                                sessionType={sessionType}
                                category={category}
                            />
                        </motion.div>

                    </div>
                </section>
            </main>
        </div>
    );
}
