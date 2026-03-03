// apps/web/app/(game)/arcade/page.tsx
"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { MatchLobby }    from "@/components/game/lobby";
import { GameArena }     from "@/components/game/arena";
import { ResultsScreen } from "@/components/game/results-screen";
import { useGameEngine } from "@/hooks/use-game-engine";
import {
    Loader2, RefreshCw, Zap, Shield, Cpu,
    User, Users, Timer, Braces, ArrowLeft,
    CheckCircle2, Target, Eye, Play,
    Wifi, WifiOff, Crosshair, Flame,
} from "lucide-react";

type PlayerFormat  = "SINGLE" | "DUAL";
type SessionType   = "TIMER" | "LIVE";
type TimerCategory = "MISSING_LINK" | "BOTTLENECK" | "TRACING";

const ease = [0.16, 1, 0.3, 1] as const;

const FORMAT_OPTIONS = [
    { value: "SINGLE" as PlayerFormat, icon: User,  label: "Solo Run",    tag: "PVE", desc: "You vs. the machine. Pure skill, no excuses.",   hotkey: "1" },
    { value: "DUAL"   as PlayerFormat, icon: Users, label: "Dual Engine", tag: "PVP", desc: "1v1 live matchmaking. Find a rival. Settle it.", hotkey: "2" },
] as const;

const TYPE_OPTIONS = [
    { value: "TIMER" as SessionType, icon: Timer, label: "Timer Mode",    tag: "RANKED",   desc: "One category, five rounds, pressure climbs each round.", hotkey: "1", accent: "text-primary",     border: "border-primary/40"    },
    { value: "LIVE"  as SessionType, icon: Zap,   label: "Live Survival", tag: "HARDCORE", desc: "Random categories every round. Three lives. No mercy.",  hotkey: "2", accent: "text-yellow-400", border: "border-yellow-400/40" },
] as const;

const CATEGORY_OPTIONS = [
    { value: "MISSING_LINK" as TimerCategory, icon: Braces, label: "Missing Link", tag: "FILL", desc: "Complete the missing logical condition or expression.", hotkey: "1" },
    { value: "BOTTLENECK"   as TimerCategory, icon: Target, label: "Bottleneck",   tag: "PICK", desc: "Identify the optimal algorithm or data structure.",      hotkey: "2" },
    { value: "TRACING"      as TimerCategory, icon: Eye,    label: "State Trace",  tag: "READ", desc: "Predict the output value after code executes.",          hotkey: "3" },
] as const;

// ── Background Music (real MP3) ───────────────────────────────────────────
function useBackgroundMusic() {
    const audioRef   = useRef<HTMLAudioElement | null>(null);
    const startedRef = useRef(false);
    const [muted, setMuted] = useState(false);

    // Create audio element once
    useEffect(() => {
        const audio = new Audio("/music/Street Fighter II OST Ryu Theme.mp3");
        audio.loop   = true;
        audio.volume = 0.25;
        audioRef.current = audio;

        return () => {
            audio.pause();
            audio.src = "";
        };
    }, []);

    // Start on first user interaction (browser autoplay policy)
    useEffect(() => {
        const boot = () => {
            if (startedRef.current) return;
            startedRef.current = true;
            audioRef.current?.play().catch(() => {
                // Still blocked — user must click the ♪ ON button manually
            });
            window.removeEventListener("pointerdown", boot);
            window.removeEventListener("keydown",     boot);
        };
        window.addEventListener("pointerdown", boot);
        window.addEventListener("keydown",     boot);
        return () => {
            window.removeEventListener("pointerdown", boot);
            window.removeEventListener("keydown",     boot);
        };
    }, []);

    const toggle = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;
        if (muted) {
            // Unmuting — also handles the case where autoplay was blocked
            startedRef.current = true;
            audio.play().catch(() => {});
            setMuted(false);
        } else {
            audio.pause();
            setMuted(true);
        }
    }, [muted]);

    const stop = useCallback(() => {
        audioRef.current?.pause();
        if (audioRef.current) audioRef.current.currentTime = 0;
    }, []);

    const fadeOut = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;
        const step = setInterval(() => {
            if (audio.volume > 0.05) {
                audio.volume = Math.max(0, audio.volume - 0.05);
            } else {
                audio.pause();
                audio.volume = 0.25;
                clearInterval(step);
            }
        }, 80);
    }, []);

    return { muted, toggle, stop, fadeOut };
}

// ── SFX Engine (Web Audio — short beeps are fine) ────────────────────────
function useArcadeSounds() {
    const ctxRef = useRef<AudioContext | null>(null);

    const getCtx = useCallback(() => {
        if (!ctxRef.current)
            ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (ctxRef.current.state === "suspended") ctxRef.current.resume();
        return ctxRef.current;
    }, []);

    const beep = useCallback((
        freq: number, duration: number, type: OscillatorType = "square",
        gainVal = 0.08, freqEnd?: number
    ) => {
        const ctx  = getCtx();
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        if (freqEnd !== undefined)
            osc.frequency.linearRampToValueAtTime(freqEnd, ctx.currentTime + duration);
        gain.gain.setValueAtTime(gainVal, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
    }, [getCtx]);

    const tick       = useCallback(() => { beep(880, 0.04, "sine", 0.05); }, [beep]);
    const select     = useCallback(() => { beep(300, 0.04, "square", 0.07); setTimeout(() => beep(600, 0.06, "square", 0.06), 40); }, [beep]);
    const advance    = useCallback(() => { beep(440, 0.06, "square", 0.07); setTimeout(() => beep(660, 0.1, "square", 0.06), 60); }, [beep]);
    const back       = useCallback(() => { beep(500, 0.06, "square", 0.06); setTimeout(() => beep(300, 0.08, "square", 0.05), 50); }, [beep]);
    const confirm    = useCallback(() => {
        beep(440, 0.07, "square", 0.07);
        setTimeout(() => beep(550, 0.07, "square", 0.07), 80);
        setTimeout(() => beep(660, 0.14, "square", 0.08), 160);
    }, [beep]);
    const enterArena = useCallback(() => {
        const ctx  = getCtx();
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.45);
    }, [getCtx]);
    const error = useCallback(() => { beep(180, 0.15, "sawtooth", 0.08, 120); }, [beep]);

    return { tick, select, advance, back, confirm, enterArena, error };
}

// ── Typewriter hook ───────────────────────────────────────────────────────
function useTypewriter(text: string, speed = 28) {
    const [displayed, setDisplayed] = useState("");
    useEffect(() => {
        setDisplayed("");
        if (!text) return;
        let i = 0;
        const t = setInterval(() => {
            i++;
            setDisplayed(text.slice(0, i));
            if (i >= text.length) clearInterval(t);
        }, speed);
        return () => clearInterval(t);
    }, [text, speed]);
    return displayed;
}

// ── Arcade background ─────────────────────────────────────────────────────
function ArcadeBackground() {
    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
            <div className="absolute inset-0 opacity-[0.03]"
                style={{ backgroundImage: "radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)", backgroundSize: "32px 32px" }} />
            <div className="absolute inset-0 opacity-[0.02]"
                style={{ backgroundImage: "repeating-linear-gradient(0deg, hsl(var(--foreground)) 0px, hsl(var(--foreground)) 1px, transparent 1px, transparent 4px)" }} />
            <div className="absolute -top-32 -right-32 w-[700px] h-[700px] rounded-full opacity-[0.04]"
                style={{ background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 65%)" }} />
            <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-background to-transparent" />
        </div>
    );
}

// ── HUD bar ───────────────────────────────────────────────────────────────
function HudBar({ step, connected, muted, onToggleMusic }: {
    step: number; connected: boolean; muted: boolean; onToggleMusic: () => void;
}) {
    const steps = ["FORMAT", "MODE", "CLASS", "DEPLOY"];
    return (
        <div className="flex items-center justify-between px-6 py-3 border-b-2 border-foreground/15 bg-foreground text-background z-20 relative">
            <div className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest">
                <span className="text-primary font-black">LOGICFORGE</span>
                <span className="opacity-30 mx-1">/</span>
                <span className="opacity-40">ARCADE</span>
                <span className="opacity-20 mx-1">/</span>
                <span className="opacity-60">{steps[step] ?? "SETUP"}</span>
            </div>
            <div className="flex items-center gap-2">
                {steps.map((s, i) => (
                    <div key={s} className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                            <motion.div
                                className="w-2 h-2 rounded-full"
                                animate={{
                                    backgroundColor: i <= step ? "hsl(var(--primary))" : "rgba(255,255,255,0.2)",
                                    scale: i === step ? 1.3 : 1,
                                }}
                                transition={{ duration: 0.3 }}
                            />
                            <span className={`text-[9px] font-mono uppercase tracking-widest hidden sm:block transition-opacity ${
                                i === step ? "opacity-100 text-primary font-bold" : i < step ? "opacity-50" : "opacity-20"
                            }`}>{s}</span>
                        </div>
                        {i < steps.length - 1 && (
                            <div className={`w-8 h-px hidden sm:block transition-all duration-500 ${i < step ? "opacity-60 bg-primary" : "opacity-15 bg-white"}`} />
                        )}
                    </div>
                ))}
            </div>
            <div className="flex items-center gap-3">
                {/* ── Music toggle ── */}
                <button
                    onClick={onToggleMusic}
                    title={muted ? "Turn music on" : "Turn music off"}
                    className={`flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-widest border px-2.5 py-1 transition-all duration-200 ${
                        muted
                            ? "border-white/15 text-white/30 hover:text-white/60 hover:border-white/30"
                            : "border-primary text-primary hover:bg-primary/10"
                    }`}
                >
                    <span>{muted ? "♪" : "♫"}</span>
                    <span>{muted ? "OFF" : "ON"}</span>
                </button>
                {/* ── Connection ── */}
                <div className={`flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest ${connected ? "text-primary" : "text-destructive"}`}>
                    {connected ? <Wifi className="size-3" /> : <WifiOff className="size-3" />}
                    <span className="hidden sm:block">{connected ? "ONLINE" : "OFFLINE"}</span>
                    <motion.div
                        className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-primary" : "bg-destructive"}`}
                        animate={{ opacity: connected ? [1, 0.3, 1] : 1 }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                </div>
            </div>
        </div>
    );
}

// ── Option card ───────────────────────────────────────────────────────────
function OptionCard({ icon: Icon, label, tag, desc, hotkey, selected, onClick, accentClass = "text-primary", borderClass = "border-foreground/30" }: {
    icon: React.ElementType; label: string; tag: string; desc: string; hotkey: string;
    selected?: boolean; onClick: () => void; accentClass?: string; borderClass?: string;
}) {
    return (
        <motion.button
            onClick={onClick}
            className={`relative group flex flex-col gap-4 p-5 border-2 text-left w-full transition-all duration-150 cursor-pointer overflow-hidden
                ${selected
                    ? `${borderClass} bg-primary/5 shadow-[4px_4px_0px_0px_hsl(var(--primary))]`
                    : `border-foreground/20 bg-card shadow-[3px_3px_0px_0px_hsl(var(--foreground)/0.1)] hover:shadow-[4px_4px_0px_0px_hsl(var(--foreground)/0.2)]`
                }`}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.97, x: 2, y: 2 }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
        >
            {selected && <div className="absolute inset-0 pointer-events-none opacity-[0.04] bg-primary" />}
            <div className="absolute top-3 right-3 flex items-center gap-1">
                {selected && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 20 }}>
                        <CheckCircle2 className="size-3.5 text-primary" />
                    </motion.div>
                )}
                <span className="text-[8px] font-mono text-foreground/20 border border-foreground/10 px-1.5 py-0.5 uppercase">[{hotkey}]</span>
            </div>
            <div className={`size-11 border-2 flex items-center justify-center shrink-0 transition-colors
                ${selected ? "border-primary bg-primary/10" : "border-foreground/15 bg-foreground/5 group-hover:border-primary/30 group-hover:bg-primary/5"}`}>
                <Icon className={`size-5 ${selected ? accentClass : "text-foreground/50 group-hover:text-primary"}`} />
            </div>
            <div className="space-y-1 pr-6">
                <div className="flex items-center gap-2">
                    <p className="text-sm font-black uppercase tracking-wider text-foreground">{label}</p>
                    <span className={`text-[8px] font-mono px-1.5 py-0.5 border ${selected ? `${borderClass} ${accentClass}` : "border-foreground/15 text-foreground/30"} uppercase tracking-widest`}>{tag}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
        </motion.button>
    );
}

// ── Terminal config row ───────────────────────────────────────────────────
function TerminalRow({ label, value, locked, highlight, delay }: {
    label: string; value: string; locked: boolean; highlight?: boolean; delay: number;
}) {
    return (
        <motion.div
            className="flex items-center justify-between py-2 px-3 border-b border-white/5 last:border-0 font-mono text-xs"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay, duration: 0.3 }}
        >
            <div className="flex items-center gap-2">
                <motion.div
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    animate={{ backgroundColor: locked ? "hsl(var(--primary))" : "rgba(255,255,255,0.12)" }}
                    transition={{ duration: 0.4 }}
                />
                <span className="text-[9px] uppercase tracking-widest text-white/30">{label}</span>
            </div>
            <AnimatePresence mode="wait">
                {locked ? (
                    <motion.span key="val"
                        className={`text-[11px] font-bold tracking-wide ${highlight ? "text-yellow-400" : "text-white"}`}
                        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.2 }}>
                        {value}
                    </motion.span>
                ) : (
                    <motion.span key="redacted" className="text-[11px] text-white/15 tracking-widest"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        ██████
                    </motion.span>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ── Mission panel ─────────────────────────────────────────────────────────
function MissionPanel({ step, playerFormat, sessionType, category }: {
    step: number; playerFormat: PlayerFormat | null;
    sessionType: SessionType | null; category: TimerCategory | null;
}) {
    const statusLines = [
        "Awaiting player configuration...",
        "Format locked · Selecting session type...",
        "Mode confirmed · Selecting challenge class...",
        "All parameters locked · Ready to deploy.",
    ];
    const typedStatus = useTypewriter(statusLines[step] ?? "", 30);

    const rows = [
        { label: "FORMAT",   value: playerFormat ?? "SINGLE",                                         locked: step >= 1 },
        { label: "MODE",     value: sessionType  ?? "TIMER",                                          locked: step >= 2 },
        { label: "CATEGORY", value: sessionType === "LIVE" ? "RANDOM" : (category ?? "MISSING_LINK"), locked: step >= 3, highlight: sessionType === "LIVE" && step >= 3 },
        { label: "ROUNDS",   value: "5",                                                              locked: true },
        { label: "MAX PTS",  value: "500",                                                            locked: true },
    ];

    return (
        <div className="w-full max-w-[400px] flex flex-col">
            <div className="border-2 border-foreground/25 shadow-[6px_6px_0px_0px_hsl(var(--foreground)/0.12)]">
                {/* Title bar */}
                <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-white/8"
                    style={{ backgroundColor: "hsl(220 30% 14%)" }}>
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-[#ff5f57] border border-[#e0443e]" />
                        <div className="w-3 h-3 rounded-full bg-[#febc2e] border border-[#d49f27]" />
                        <div className="w-3 h-3 rounded-full bg-[#28c840] border border-[#1dab32]" />
                    </div>
                    <div className="flex-1 flex justify-center">
                        <span className="text-[9px] font-mono text-white/25 uppercase tracking-[0.25em]">MISSION_BRIEFING.exe</span>
                    </div>
                </div>
                {/* Screen */}
                <div className="relative overflow-hidden" style={{ backgroundColor: "hsl(222 40% 7%)", minHeight: 340 }}>
                    <div className="absolute inset-0 pointer-events-none opacity-[0.025] z-10"
                        style={{ backgroundImage: "repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 3px)" }} />
                    <div className="relative z-0 p-5 flex flex-col gap-4">
                        <motion.div className="flex items-center gap-1.5 font-mono text-[10px]"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                            <span className="text-primary/70">logicforge@arena</span>
                            <span className="text-white/20">:</span>
                            <span className="text-blue-400/60">~</span>
                            <span className="text-white/20">$</span>
                            <span className="text-white/40 ml-1">arena --configure</span>
                        </motion.div>
                        <div className="border border-white/8 bg-white/[0.02] divide-y divide-white/5">
                            {rows.map((r, i) => (
                                <TerminalRow key={r.label} {...r} delay={0.15 + i * 0.05} />
                            ))}
                        </div>
                        <AnimatePresence mode="wait">
                            <motion.div key={`status-${step}`}
                                className="flex items-start gap-2 font-mono text-[10px] mt-1"
                                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                                <motion.div className="w-1.5 h-3.5 bg-primary shrink-0 mt-0.5"
                                    animate={{ opacity: [1, 1, 0, 0] }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear", times: [0, 0.49, 0.5, 1] }} />
                                <span className="text-primary/80 leading-relaxed">{typedStatus}</span>
                            </motion.div>
                        </AnimatePresence>
                        <AnimatePresence>
                            {step === 3 && (
                                <motion.div
                                    className="font-mono text-[9px] border border-primary/20 bg-primary/5 p-3 space-y-1"
                                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                                    transition={{ duration: 0.4, ease: "easeOut" }}>
                                    {[
                                        { cmd: `$ arena --deploy --rounds=5`,                          delay: 0.1  },
                                        { cmd: `$ matchmaker --format=${playerFormat?.toLowerCase()}`, delay: 0.4  },
                                        { cmd: `$ engine --mode=${sessionType?.toLowerCase()}`,        delay: 0.7  },
                                        { cmd: `> Loading challenge pool...`,                          delay: 1.0, dim: true },
                                        { cmd: `> Connecting to arena...`,                             delay: 1.3, dim: true },
                                    ].map(({ cmd, delay, dim }) => (
                                        <motion.div key={cmd} className={dim ? "text-white/20" : "text-white/50"}
                                            initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay, duration: 0.25 }}>
                                            <span className={!dim ? "text-primary" : "text-white/20"}>
                                                {cmd.startsWith("$") ? "$ " : "> "}
                                            </span>
                                            {cmd.slice(2)}
                                        </motion.div>
                                    ))}
                                    <motion.div className="flex items-center gap-1.5 mt-1"
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}>
                                        <motion.div className="w-1.5 h-1.5 rounded-full bg-primary"
                                            animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
                                        <span className="text-primary text-[9px] font-bold uppercase tracking-widest">Ready to deploy</span>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
            {/* Stats bar */}
            <div className="grid grid-cols-3 border-x-2 border-b-2 border-foreground/20 divide-x divide-foreground/10 bg-card">
                {[
                    { label: "ROUNDS",  val: "5",   icon: Flame  },
                    { label: "MAX PTS", val: "500", icon: Zap    },
                    { label: "RANKS",   val: "12",  icon: Shield },
                ].map(({ label, val, icon: Icon }, i) => (
                    <motion.div key={label}
                        className="flex flex-col items-center py-3 gap-0.5 group hover:bg-primary/5 transition-colors cursor-default"
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + i * 0.07 }}>
                        <Icon className="size-3 text-primary/40 group-hover:text-primary transition-colors mb-0.5" />
                        <span className="text-xl font-black font-mono text-foreground">{val}</span>
                        <span className="text-[8px] font-mono uppercase tracking-widest text-foreground/30">{label}</span>
                    </motion.div>
                ))}
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

    const sfx   = useArcadeSounds();
    const music = useBackgroundMusic();

    useEffect(() => {
        reset();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Auto-retry JOIN_SESSION
    const retryCountRef = useRef(0);
    useEffect(() => {
        if (matchStatus !== "MATCHED" || sessionStatus !== "IDLE" || !sessionId || !connected) {
            retryCountRef.current = 0;
            return;
        }
        const interval = setInterval(() => {
            retryCountRef.current += 1;
            if (retryCountRef.current <= 5) {
                console.info("[Arcade] Auto-retry JOIN_SESSION attempt", retryCountRef.current);
                joinSession(sessionId);
            } else {
                clearInterval(interval);
            }
        }, 4000);
        return () => clearInterval(interval);
    }, [matchStatus, sessionStatus, sessionId, connected, joinSession]);

    const [step, setStep]                 = useState(0);
    const [playerFormat, setPlayerFormat] = useState<PlayerFormat | null>(null);
    const [sessionType,  setSessionType]  = useState<SessionType  | null>(null);
    const [category,     setCategory]     = useState<TimerCategory | null>(null);
    const [isQueuing,    setIsQueuing]     = useState(false);

    const isInSession = matchStatus === "MATCHED" || matchStatus === "QUEUED" || sessionStatus !== "IDLE";
    const hasError    = socketStatus === "ERROR";

    // Confirm sound on step 3
    const prevStepRef = useRef(step);
    useEffect(() => {
        if (step === 3 && prevStepRef.current !== 3) sfx.confirm();
        prevStepRef.current = step;
    }, [step, sfx]);

    // Error sound
    useEffect(() => {
        if (queueError) sfx.error();
    }, [queueError, sfx]);

    const handleBack = useCallback(() => {
        sfx.back();
        if (step === 3 && sessionType === "LIVE") setStep(1);
        else setStep((p) => Math.max(0, p - 1));
    }, [step, sessionType, sfx]);

    const handleEnterArena = useCallback(async () => {
        if (!playerFormat || !sessionType) return;
        sfx.enterArena();
        music.fadeOut();           // smooth fade before entering arena
        setIsQueuing(true);
        await enterQueue({ playerFormat, sessionType, category });
        setIsQueuing(false);
    }, [playerFormat, sessionType, category, enterQueue, sfx, music]);

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
                                <button type="button"
                                    onClick={() => { sfx.tick(); joinSession(sessionId); }}
                                    className="arcade-btn px-8 py-4 border-2 border-foreground bg-primary shadow-retro font-black uppercase tracking-widest flex items-center gap-2">
                                    <RefreshCw className="size-4" /> Retry connection
                                </button>
                            )}
                            {queueError && <p className="text-sm text-destructive font-medium max-w-md text-center">{queueError}</p>}
                        </div>
                    )}
                    {sessionStatus === "ABORTED" && (
                        <div className="flex-1 flex flex-col items-center justify-center gap-6">
                            <Crosshair className="size-16 text-destructive opacity-30" />
                            <p className="text-destructive font-black text-xl uppercase tracking-widest">Session Aborted</p>
                            <button
                                className="arcade-btn px-8 py-4 border-2 border-foreground bg-card shadow-retro font-black uppercase tracking-widest"
                                onClick={() => { sfx.back(); reset(); }}>
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
            <ArcadeBackground />
            <HudBar
                step={step}
                connected={connected}
                muted={music.muted}
                onToggleMusic={() => { music.toggle(); }}
            />

            <main className="flex-1 relative z-10">
                <div className="max-w-7xl mx-auto px-6 py-12 lg:py-20 grid lg:grid-cols-2 gap-16 lg:gap-24 items-start lg:items-center min-h-[calc(100vh-52px)]">

                    {/* ── LEFT ── */}
                    <div className="flex flex-col gap-10 order-2 lg:order-1">
                        <AnimatePresence mode="wait">
                            <motion.div key={`title-${step}`} className="space-y-4"
                                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.28, ease }}>
                                <div className="flex items-center gap-3">
                                    {step > 0 && (
                                        <motion.button onClick={handleBack}
                                            className="size-7 border border-foreground/20 flex items-center justify-center text-foreground/40 hover:text-foreground hover:border-foreground/50 transition-colors"
                                            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                            <ArrowLeft className="size-3.5" />
                                        </motion.button>
                                    )}
                                    <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.3em]">
                                        <span className="text-primary">▶</span>
                                        <span className="text-foreground/40">
                                            {["SELECT FORMAT", "SELECT MODE", "SELECT CLASS", "READY TO DEPLOY"][step]}
                                        </span>
                                    </div>
                                </div>
                                <h1 className="text-5xl sm:text-6xl md:text-7xl font-black leading-[0.88] tracking-tighter uppercase text-foreground">
                                    {[
                                        <>Choose your<br /><span className="text-primary">format.</span></>,
                                        <>Session<br /><span className="text-primary">type.</span></>,
                                        <>Pick your<br /><span className="text-primary">class.</span></>,
                                        <>Parameters<br /><span className="text-primary">locked.</span></>,
                                    ][step]}
                                </h1>
                                <p className="text-sm text-muted-foreground font-medium max-w-sm leading-relaxed">
                                    {[
                                        "Solo grind or live 1v1? Your format determines matchmaking and scoring.",
                                        "Fixed pressure or survival chaos? Choose how the session runs.",
                                        "All five rounds will draw from this challenge class.",
                                        "Review config below. Once you enter, there's no backing out.",
                                    ][step]}
                                </p>
                            </motion.div>
                        </AnimatePresence>

                        <AnimatePresence mode="wait">
                            {step === 0 && (
                                <motion.div key="s0" className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg"
                                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.28, ease }}>
                                    {FORMAT_OPTIONS.map((opt, i) => (
                                        <motion.div key={opt.value} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                                            <OptionCard icon={opt.icon} label={opt.label} tag={opt.tag} desc={opt.desc} hotkey={opt.hotkey}
                                                selected={playerFormat === opt.value}
                                                onClick={() => { sfx.select(); setTimeout(() => sfx.advance(), 80); setPlayerFormat(opt.value); setStep(1); }} />
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                            {step === 1 && (
                                <motion.div key="s1" className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg"
                                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.28, ease }}>
                                    {TYPE_OPTIONS.map((opt, i) => (
                                        <motion.div key={opt.value} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                                            <OptionCard icon={opt.icon} label={opt.label} tag={opt.tag} desc={opt.desc} hotkey={opt.hotkey}
                                                selected={sessionType === opt.value}
                                                accentClass={opt.accent} borderClass={opt.border}
                                                onClick={() => {
                                                    sfx.select(); setTimeout(() => sfx.advance(), 80);
                                                    setSessionType(opt.value);
                                                    if (opt.value === "LIVE") { setCategory(null); setStep(3); } else setStep(2);
                                                }} />
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                            {step === 2 && (
                                <motion.div key="s2" className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl"
                                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.28, ease }}>
                                    {CATEGORY_OPTIONS.map((opt, i) => (
                                        <motion.div key={opt.value} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                                            <OptionCard icon={opt.icon} label={opt.label} tag={opt.tag} desc={opt.desc} hotkey={opt.hotkey}
                                                selected={category === opt.value}
                                                onClick={() => { sfx.select(); setTimeout(() => sfx.advance(), 80); setCategory(opt.value); setStep(3); }} />
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                            {step === 3 && (
                                <motion.div key="s3" className="flex flex-col gap-5 max-w-lg"
                                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.28, ease }}>
                                    <div className="border-2 border-foreground/30 bg-card shadow-[4px_4px_0px_0px_hsl(var(--foreground)/0.15)]">
                                        <div className="flex items-center justify-between px-4 py-2.5 border-b border-foreground/10 bg-foreground/5">
                                            <span className="text-[9px] font-mono uppercase tracking-widest text-foreground/40">Session Config</span>
                                            <div className="flex items-center gap-1.5">
                                                <motion.div className="w-1.5 h-1.5 rounded-full bg-primary"
                                                    animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
                                                <span className="text-[8px] font-mono text-primary uppercase tracking-widest">LOCKED</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 divide-x divide-foreground/10">
                                            {[
                                                { label: "FORMAT", value: playerFormat ?? "—" },
                                                { label: "MODE",   value: sessionType  ?? "—" },
                                                { label: "CLASS",  value: sessionType === "LIVE" ? "RANDOM" : (category?.replace(/_/g, " ") ?? "—"), hi: sessionType === "LIVE" },
                                            ].map((c) => (
                                                <div key={c.label} className="flex flex-col items-center py-4 gap-1 px-3">
                                                    <span className="text-[8px] font-mono uppercase tracking-widest text-foreground/30">{c.label}</span>
                                                    <span className={`text-sm font-black uppercase font-mono ${c.hi ? "text-yellow-400" : "text-foreground"}`}>{c.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { icon: Flame,  label: "5 Rounds"   },
                                            { icon: Shield, label: "Anti-Cheat" },
                                            { icon: Cpu,    label: "Live Eval"  },
                                            { icon: Zap,    label: "Real-time"  },
                                        ].map((item, i) => (
                                            <motion.div key={item.label}
                                                className="flex items-center gap-1.5 px-2.5 py-1.5 border border-foreground/15 bg-foreground/5 text-[9px] font-mono uppercase tracking-widest text-foreground/50"
                                                initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: 0.05 + i * 0.04 }}>
                                                <item.icon className="size-2.5 text-primary shrink-0" />
                                                {item.label}
                                            </motion.div>
                                        ))}
                                    </div>
                                    {queueError && (
                                        <motion.div className="border-2 border-destructive bg-destructive/8 px-4 py-3 flex items-start gap-2"
                                            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                                            <Crosshair className="size-3.5 text-destructive shrink-0 mt-0.5" />
                                            <p className="text-sm font-bold text-destructive">{queueError}</p>
                                        </motion.div>
                                    )}
                                    {hasError && (
                                        <motion.div className="flex flex-col gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                            <div className="border-2 border-destructive bg-destructive/8 px-4 py-3">
                                                <p className="text-sm font-bold text-destructive">Unable to reach game server. Check services.</p>
                                            </div>
                                            <button className="w-fit px-4 py-2 border-2 border-foreground/30 text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-foreground/5 transition-colors"
                                                onClick={() => { sfx.tick(); window.location.reload(); }}>
                                                <RefreshCw className="size-3.5" /> Retry
                                            </button>
                                        </motion.div>
                                    )}
                                    <motion.button
                                        className="group relative bg-primary px-10 py-5 border-2 border-foreground text-xl font-black uppercase tracking-widest flex items-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed w-fit overflow-hidden shadow-[4px_4px_0px_0px_hsl(var(--foreground))]"
                                        whileHover={connected && !isQueuing ? { scale: 1.03, boxShadow: "6px 6px 0px 0px hsl(var(--foreground))" } : {}}
                                        whileTap={connected && !isQueuing ? { scale: 0.96, x: 3, y: 3, boxShadow: "0px 0px 0px 0px" } : {}}
                                        onClick={handleEnterArena} disabled={!connected || isQueuing}>
                                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />
                                        <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-foreground/30 group-hover:bg-foreground/60 transition-colors" />
                                        {isQueuing ? (
                                            <><Loader2 className="size-6 animate-spin shrink-0" /><span>Finding match…</span></>
                                        ) : !connected ? (
                                            <><Loader2 className="size-6 animate-spin shrink-0" /><span>Connecting…</span></>
                                        ) : (
                                            <><Play className="size-5 shrink-0 fill-current" /><span>Enter Arena</span></>
                                        )}
                                    </motion.button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* ── RIGHT ── */}
                    <motion.div className="relative order-1 lg:order-2 flex justify-center lg:justify-end"
                        initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.1, ease }}>
                        <MissionPanel step={step} playerFormat={playerFormat} sessionType={sessionType} category={category} />
                    </motion.div>

                </div>
            </main>
        </div>
    );
}
