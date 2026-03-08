"use client";

import { useSession }            from "next-auth/react";
import { useRouter }             from "next/navigation";
import { useEffect, useState }   from "react";
import { Navbar }                from "@/components/Navbar";
import { motion }                from "framer-motion";
import Link                      from "next/link";
import {
  Zap, BookOpen, Target, TrendingUp,
  Flame, Swords, ArrowRight, Trophy,
} from "lucide-react";
import { GlobalScoreCard }       from "./GlobalScoreCard";
import { MatchHistorySection }   from "./MatchHistorySection";
import type { MatchRecord }      from "./MatchHistoryTable";

// ── SectionHeader ─────────────────────────────────────────────────────────────

function SectionHeader({ label, sub, active }: { label: string; sub?: string; active?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`text-[9px] font-black uppercase tracking-[0.35em] ${active !== false ? "text-foreground/70" : "text-foreground/35"}`}>
        ▶ {label}
      </span>
      {sub && (
        <span className="text-[9px] font-mono text-foreground/30 border-l border-foreground/15 pl-3">
          {sub}
        </span>
      )}
    </div>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────

interface StatCardProps {
  label:   string;
  value:   string | number;
  icon:    React.ElementType;
  color:   string;
  border:  string;
  sub?:    string;
  delay?:  number;
}

function StatCard({ label, value, icon: Icon, color, border, sub, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      className={`border-2 ${border} bg-card p-5 flex flex-col min-h-[120px] relative overflow-hidden group shadow-[1px_1px_0_0_hsl(var(--foreground)/0.04)] hover:shadow-[2px_2px_0_0_hsl(var(--foreground)/0.08)] transition-shadow`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[9px] font-black uppercase tracking-[0.22em] text-foreground/45">
          {label}
        </span>
        <Icon className={`w-4 h-4 ${color} opacity-90 shrink-0`} />
      </div>
      <div className="flex flex-col gap-1 mt-auto pt-3">
        <span className={`text-2xl md:text-3xl font-black font-mono leading-none tracking-tight ${color}`}>
          {value}
        </span>
        {sub && (
          <span className="text-[9px] font-mono text-foreground/35 uppercase tracking-wide">
            {sub}
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ── GameModeCard ──────────────────────────────────────────────────────────────

interface GameModeCardProps {
  href:        string;
  icon:        React.ElementType;
  title:       string;
  description: string;
  tag:         string;
  tagColor:    string;
  accent:      string;
  stats:       { label: string; val: string }[];
  cta:         string;
  ctaClass:    string;
  delay:       number;
}

function GameModeCard({
  href, icon: Icon, title, description,
  tag, tagColor, accent, stats, cta, ctaClass, delay,
}: GameModeCardProps) {
  return (
    <motion.div
      className="border-2 border-foreground bg-card relative overflow-hidden flex flex-col group"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
    >
      {/* Top accent bar animates on hover */}
      <div className={`h-0.5 w-full ${accent} transition-all duration-300 group-hover:h-1`} />

      <div className="p-7 flex flex-col gap-6 flex-1">
        <div className="flex items-start justify-between">
          <div className={`w-11 h-11 ${accent} flex items-center justify-center text-background border-2 border-foreground shrink-0`}>
            <Icon className="w-5 h-5" />
          </div>
          <span className={`text-[9px] font-mono border px-2.5 py-1 uppercase tracking-widest ${tagColor}`}>
            {tag}
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <h2 className="text-xl font-black uppercase tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>

        <div className="grid grid-cols-3 gap-2 border-t border-foreground/10 pt-4">
          {stats.map(({ label, val }) => (
            <div key={label} className="flex flex-col items-center gap-0.5">
              <span className="text-base font-black font-mono">{val}</span>
              <span className="text-[8px] font-mono uppercase tracking-widest text-foreground/30">{label}</span>
            </div>
          ))}
        </div>

        <Link href={href} className="mt-auto">
          <motion.button
            className={`w-full py-3.5 border-2 border-foreground text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${ctaClass}`}
            whileHover={{ letterSpacing: "0.2em" }}
            transition={{ duration: 0.15 }}
          >
            <Icon className="w-3.5 h-3.5" />
            {cta}
            <ArrowRight className="w-3 h-3 opacity-60 group-hover:translate-x-0.5 transition-transform" />
          </motion.button>
        </Link>
      </div>
    </motion.div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 py-8 flex flex-col gap-12">
        <div className="border-b-2 border-foreground pb-6 flex flex-col gap-3">
          <div className="h-9 w-72 bg-foreground/10 animate-pulse" />
          <div className="h-3 w-40 bg-foreground/6 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="col-span-2 h-44 bg-foreground/8 animate-pulse border-2 border-foreground/10" />
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-44 bg-foreground/6 animate-pulse border-2 border-foreground/10" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-64 bg-foreground/6 animate-pulse border-2 border-foreground/10" />
          ))}
        </div>
        <div className="flex flex-col gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-foreground/6 animate-pulse border border-foreground/10" />
          ))}
        </div>
      </main>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router                    = useRouter();
  const [records, setRecords]     = useState<MatchRecord[]>([]);
  const [globalScore, setGlobalScore] = useState(0);
  const [loading, setLoading]     = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/match-history")
      .then(async r => {
        if (!r.ok) { setFetchError(true); return; }
        const d = await r.json();
        setRecords(d.records ?? []);
        setGlobalScore(d.globalScore ?? 0);
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, [status]);

  // ── Computed stats ──────────────────────────────────────────────────────────
  const total   = records.length;
  const wins    = records.filter(r => r.outcome === "WIN").length;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

  let streak = 0;
  for (const r of records) {
    if (r.outcome === "WIN") streak++;
    else break;
  }

  if (status === "loading" || loading) return <DashboardSkeleton />;
  if (status === "unauthenticated") return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 py-8 flex flex-col gap-12">

        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <motion.div
          className="border-b-2 border-foreground pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col gap-1.5">
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">
              Welcome back,{" "}
              <span className="text-primary">{session?.user?.name || "Player"}</span>
            </h1>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
              ID: {session?.user?.id || "N/A"} · {total} match{total !== 1 ? "es" : ""} recorded
            </p>
          </div>
          <Link href="/arcade">
            <motion.button
              className="flex items-center gap-2 bg-primary text-background px-5 py-2.5 border-2 border-foreground text-xs font-black uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Swords className="w-3.5 h-3.5" />
              Quick Play
            </motion.button>
          </Link>
        </motion.div>

        {/* ── SECTION 1 · Player Overview ─────────────────────────────────── */}
        <section className="flex flex-col gap-5">
          <SectionHeader label="Player Overview" sub="Ranked stats" active />
          <div className="rounded-lg border-2 border-foreground/10 bg-foreground/[0.02] p-4 md:p-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="col-span-2 row-span-2 min-h-[200px]">
                <GlobalScoreCard
                  score={globalScore}
                  username={session?.user?.name ?? undefined}
                />
              </div>
              <StatCard
                label="Win Rate"
                value={`${winRate}%`}
                icon={Target}
                color="text-accent"
                border="border-accent/25"
                sub={total > 0 ? `${wins} wins of ${total}` : "—"}
                delay={0.05}
              />
              <StatCard
                label="Win Streak"
                value={streak}
                icon={Flame}
                color={streak >= 3 ? "text-orange-500" : "text-foreground/60"}
                border={streak >= 3 ? "border-orange-400/30" : "border-foreground/12"}
                sub={streak >= 3 ? "On fire" : "Current run"}
                delay={0.1}
              />
              <StatCard
                label="Matches"
                value={total}
                icon={TrendingUp}
                color="text-primary"
                border="border-primary/25"
                sub="Career total"
                delay={0.15}
              />
              <StatCard
                label="Global Rank"
                value="#—"
                icon={Trophy}
                color="text-yellow-500"
                border="border-yellow-400/20"
                sub="Coming soon"
                delay={0.2}
              />
            </div>
          </div>
        </section>

        {/* ── SECTION 2 · Quick Play ───────────────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <SectionHeader label="Game Modes" sub="Select your arena" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <GameModeCard
              href="/arcade"
              icon={Zap}
              title="Arcade Mode"
              description="5-round logic blitz. Solo grind or 1v1 live matchmaking. Timer mode or survival chaos. Pick your format."
              tag="Live · Ranked"
              tagColor="text-primary border-primary/40"
              accent="bg-primary"
              stats={[
                { label: "Rounds",  val: "5"    },
                { label: "Max LP",  val: "500"  },
                { label: "Modes",   val: "2"    },
              ]}
              cta="Enter Arcade"
              ctaClass="bg-primary text-background hover:bg-foreground hover:text-background"
              delay={0}
            />
            <GameModeCard
              href="/story"
              icon={BookOpen}
              title="Story Mode"
              description="Work through a structured campaign of logic challenges. Build intuition, unlock harder chapters."
              tag="Solo · Campaign"
              tagColor="text-accent border-accent/40"
              accent="bg-accent"
              stats={[
                { label: "Chapters",    val: "12"  },
                { label: "Challenges",  val: "60+" },
                { label: "Rewards",     val: "XP"  },
              ]}
              cta="Start Campaign"
              ctaClass="bg-accent/10 text-accent hover:bg-accent hover:text-background"
              delay={0.05}
            />
          </div>
        </section>

        {/* ── SECTION 3 · Match Ledger ─────────────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <SectionHeader
            label="Match Ledger"
            sub={total > 0 ? `Last ${Math.min(total, 50)} matches` : undefined}
          />
          <MatchHistorySection
            records={records}
            globalScore={globalScore}
            error={fetchError}
          />
        </section>

      </main>
    </div>
  );
}
