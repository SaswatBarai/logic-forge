"use client";

import { useSession } from "next-auth/react";
import { Navbar } from "@/components/Navbar";
import { motion } from "framer-motion";
import Link from "next/link";

export default function DashboardPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="min-h-screen bg-background text-foreground flex items-center justify-center font-mono uppercase tracking-widest text-sm">Loading System...</div>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 flex flex-col gap-8">
        
        {/* Header */}
        <div className="flex flex-col gap-2 border-b-2 border-foreground pb-8">
          <h1 className="text-4xl font-black uppercase tracking-tighter">
            Welcome, <span className="text-primary">{session?.user?.name || "Player"}</span>
          </h1>
          <p className="text-sm font-mono text-muted-foreground uppercase tracking-widest">
            ID: {session?.user?.id || "N/A"}
          </p>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Quick Play Card */}
          <div className="border-2 border-foreground bg-card shadow-retro p-8 flex flex-col gap-6">
            <div className="w-12 h-12 bg-primary flex items-center justify-center text-background text-xl font-black border-2 border-foreground">
              ▶
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase">Enter Arena</h2>
              <p className="text-sm text-muted-foreground mt-2">Queue up for a live 5-round logic blitz. Ranked mode active.</p>
            </div>
            <Link href="/lobby" className="mt-auto">
              <button className="arcade-btn w-full bg-foreground text-background py-4 border-2 border-foreground text-sm font-black uppercase tracking-widest hover:bg-primary hover:text-foreground transition-colors">
                Find Match
              </button>
            </Link>
          </div>

          {/* Stats Card */}
          <div className="border-2 border-foreground bg-background shadow-retro p-8 flex flex-col gap-6">
             <div className="flex justify-between items-center border-b border-foreground/20 pb-4">
               <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Rating</span>
               <span className="text-xl font-mono text-accent">1,240</span>
             </div>
             <div className="flex justify-between items-center border-b border-foreground/20 pb-4">
               <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Matches Won</span>
               <span className="text-xl font-mono text-foreground">42</span>
             </div>
             <div className="flex justify-between items-center">
               <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Global Rank</span>
               <span className="text-xl font-mono text-primary">#4,892</span>
             </div>
          </div>

        </div>
      </main>
    </div>
  );
}
