"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { motion } from "framer-motion";
import Link from "next/link";
import { Zap, BookOpen, Trophy, Star, TrendingUp, Hash } from "lucide-react";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center font-mono uppercase tracking-widest text-sm">
        Loading System...
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 flex flex-col gap-10">

        {/* ── Header ── */}
        <div className="flex flex-col gap-2 border-b-2 border-foreground pb-8">
          <h1 className="text-4xl font-black uppercase tracking-tighter">
            Welcome, <span className="text-primary">{session?.user?.name || "Player"}</span>
          </h1>
          <p className="text-sm font-mono text-muted-foreground uppercase tracking-widest">
            ID: {session?.user?.id || "N/A"}
          </p>
        </div>

        {/* ── Game Mode Cards ── */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40 mb-4">
            ▶ Select Game Mode
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Arcade Mode */}
            <motion.div
              className="border-2 border-foreground bg-card shadow-retro p-8 flex flex-col gap-6 group relative overflow-hidden"
              whileHover={{ y: -2 }}
              transition={{ duration: 0.15 }}
            >
              {/* Glow accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />

              <div className="flex items-start justify-between">
                <div className="w-12 h-12 bg-primary flex items-center justify-center text-background border-2 border-foreground shrink-0">
                  <Zap className="w-6 h-6" />
                </div>
                <span className="text-[9px] font-mono border border-primary text-primary px-2 py-0.5 uppercase tracking-widest">
                  Live · Ranked
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <h2 className="text-2xl font-black uppercase tracking-tight">Arcade Mode</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  5-round logic blitz. Solo grind or 1v1 live matchmaking. Timer mode or survival chaos. Pick your format and enter the arena.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 border-t border-foreground/10 pt-4">
                {[
                  { label: "Rounds", val: "5" },
                  { label: "Max Pts", val: "500" },
                  { label: "Modes", val: "2" },
                ].map(({ label, val }) => (
                  <div key={label} className="flex flex-col items-center gap-0.5">
                    <span className="text-lg font-black font-mono text-foreground">{val}</span>
                    <span className="text-[8px] font-mono uppercase tracking-widest text-foreground/30">{label}</span>
                  </div>
                ))}
              </div>

              <Link href="/arcade" className="mt-auto">
                <button className="arcade-btn w-full bg-primary text-background py-4 border-2 border-foreground text-sm font-black uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors flex items-center justify-center gap-2">
                  <Zap className="w-4 h-4" />
                  Enter Arcade
                </button>
              </Link>
            </motion.div>

            {/* Story Mode */}
            <motion.div
              className="border-2 border-foreground/40 bg-card shadow-retro p-8 flex flex-col gap-6 group relative overflow-hidden"
              whileHover={{ y: -2 }}
              transition={{ duration: 0.15 }}
            >
              {/* Glow accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-accent" />

              <div className="flex items-start justify-between">
                <div className="w-12 h-12 bg-accent/10 flex items-center justify-center border-2 border-foreground/40 shrink-0">
                  <BookOpen className="w-6 h-6 text-accent" />
                </div>
                <span className="text-[9px] font-mono border border-accent/50 text-accent px-2 py-0.5 uppercase tracking-widest">
                  Solo · Campaign
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <h2 className="text-2xl font-black uppercase tracking-tight">Story Mode</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Work through a structured campaign of logic challenges. Learn patterns, build intuition, and unlock harder chapters as you progress.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 border-t border-foreground/10 pt-4">
                {[
                  { label: "Chapters", val: "12" },
                  { label: "Challenges", val: "60+" },
                  { label: "Rewards", val: "XP" },
                ].map(({ label, val }) => (
                  <div key={label} className="flex flex-col items-center gap-0.5">
                    <span className="text-lg font-black font-mono text-foreground">{val}</span>
                    <span className="text-[8px] font-mono uppercase tracking-widest text-foreground/30">{label}</span>
                  </div>
                ))}
              </div>

              <Link href="/story" className="mt-auto">
                <button className="arcade-btn w-full bg-accent/10 text-accent py-4 border-2 border-foreground/40 text-sm font-black uppercase tracking-widest hover:bg-accent hover:text-background transition-colors flex items-center justify-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Start Campaign
                </button>
              </Link>
            </motion.div>

          </div>
        </div>

        {/* ── Stats Row ── */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40 mb-4">
            ▶ Your Stats
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: TrendingUp, label: "Rating",       value: "1,240", color: "text-accent"   },
              { icon: Trophy,     label: "Matches Won",  value: "42",    color: "text-primary"  },
              { icon: Hash,       label: "Global Rank",  value: "#4,892", color: "text-foreground" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label}
                className="border-2 border-foreground/20 bg-card px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${color} opacity-60`} />
                  <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">{label}</span>
                </div>
                <span className={`text-xl font-mono font-black ${color}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
