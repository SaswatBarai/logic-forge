"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

// --- Mock Data for Tabs ---
type TabId = "TRACING" | "MISSING_LINK" | "BOTTLENECK" | "SYNTAX";

const tabs: { id: TabId; label: string }[] = [
  { id: "TRACING", label: "State Tracing" },
  { id: "MISSING_LINK", label: "Missing Link" },
  { id: "BOTTLENECK", label: "Bottleneck" },
  { id: "SYNTAX", label: "Syntax Sniper" },
];

const mockData: Record<TabId, { code: React.ReactNode; prompt: string; input: React.ReactNode }> = {
  TRACING: {
    prompt: "Enter the final value of alpha when n = 4",
    code: (
      <>
        <div className="flex gap-4"><span className="text-zinc-600 w-4">01</span><span className="text-purple-400">def </span><span className="text-blue-400">parse_payload</span><span className="text-slate-300">(n):</span></div>
        <div className="flex gap-4"><span className="text-zinc-600 w-4">02</span><span className="text-slate-300">  alpha </span><span className="text-yellow-300">= </span><span className="text-green-400">0</span></div>
        <div className="flex gap-4"><span className="text-zinc-600 w-4">03</span><span className="text-purple-400">  for </span><span className="text-slate-300">i </span><span className="text-purple-400">in </span><span className="text-blue-400">range</span><span className="text-slate-300">(n):</span></div>
        <div className="flex gap-4"><span className="text-zinc-600 w-4">04</span><span className="text-purple-400">    if </span><span className="text-slate-300">i % </span><span className="text-green-400">2 </span><span className="text-slate-300">== </span><span className="text-green-400">0</span><span className="text-slate-300">:</span></div>
        <div className="flex gap-4"><span className="text-zinc-600 w-4">05</span><span className="text-slate-300">      alpha </span><span className="text-yellow-300">+= </span><span className="text-slate-300">i</span></div>
        <div className="flex gap-4"><span className="text-zinc-600 w-4">06</span><span className="text-purple-400">    else</span><span className="text-slate-300">:</span></div>
        <div className="flex gap-4"><span className="text-zinc-600 w-4">07</span><span className="text-slate-300">      alpha </span><span className="text-yellow-300">-= </span><span className="text-green-400">1</span></div>
        <div className="flex gap-4"><span className="text-zinc-600 w-4">08</span><span className="text-purple-400">  return </span><span className="text-slate-300">alpha</span></div>
      </>
    ),
    input: (
      <motion.div className="border-2 border-amber-400 px-6 py-2 font-mono text-lg font-black text-amber-400 flex items-center gap-2" animate={{ borderColor: ["hsl(43,96%,56%)", "hsl(43,96%,30%)", "hsl(43,96%,56%)"] }} transition={{ repeat: Infinity, duration: 1.5 }}>
        3<motion.span animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}>|</motion.span>
      </motion.div>
    ),
  },
  MISSING_LINK: {
    prompt: "Fill in the exact missing line of code",
    code: (
      <>
        <div className="flex gap-4"><span className="text-zinc-600 w-4">01</span><span className="text-purple-400">function </span><span className="text-blue-400">validateNode</span><span className="text-slate-300">(node) {"{"}</span></div>
        <div className="flex gap-4"><span className="text-zinc-600 w-4">02</span><span className="text-purple-400">  if </span><span className="text-slate-300">(!node) </span><span className="text-purple-400">return </span><span className="text-blue-400">false</span><span className="text-slate-300">;</span></div>
        <div className="flex gap-4"><span className="text-zinc-600 w-4">03</span><span className="text-slate-300">  </span><span className="bg-destructive/20 border-b-2 border-destructive text-destructive px-2 font-black">________</span></div>
        <div className="flex gap-4"><span className="text-zinc-600 w-4">04</span><span className="text-purple-400">  return </span><span className="text-slate-300">node.val &gt; </span><span className="text-green-400">0</span><span className="text-slate-300">;</span></div>
        <div className="flex gap-4"><span className="text-zinc-600 w-4">05</span><span className="text-slate-300">{"}"}</span></div>
      </>
    ),
    input: (
      <div className="w-full flex items-center gap-2 border border-zinc-700 bg-zinc-900 px-3 py-2">
        <span className="text-zinc-500 font-mono text-xs">&gt;</span>
        <span className="text-emerald-400 font-mono text-sm">if (node.visited) return true;</span>
      </div>
    ),
  },
  BOTTLENECK: {
    prompt: "Select the O(N) refactor",
    code: (
      <>
        <div className="flex gap-4"><span className="text-zinc-600 w-4">01</span><span className="text-zinc-400 italic">// O(N²) Detected: Nested loops over active connections</span></div>
        <div className="flex gap-4"><span className="text-zinc-600 w-4">02</span><span className="text-purple-400">for </span><span className="text-slate-300">let i = </span><span className="text-green-400">0</span><span className="text-slate-300">; i &lt; conns.length; i++ {"{"}</span></div>
        <div className="flex gap-4"><span className="text-zinc-600 w-4">03</span><span className="text-purple-400">  for </span><span className="text-slate-300">let j = </span><span className="text-green-400">0</span><span className="text-slate-300">; j &lt; blacklist.length; j++ {"{"}</span></div>
        <div className="flex gap-4"><span className="text-zinc-600 w-4">04</span><span className="text-purple-400">    if </span><span className="text-slate-300">(conns[i].ip === blacklist[j]) drop(conns[i]);</span></div>
        <div className="flex gap-4"><span className="text-zinc-600 w-4">05</span><span className="text-slate-300">  {"}"}</span></div>
        <div className="flex gap-4"><span className="text-zinc-600 w-4">06</span><span className="text-slate-300">{"}"}</span></div>
      </>
    ),
    input: (
      <div className="grid grid-cols-2 gap-2 w-full">
        <div className="border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-mono text-slate-400 hover:border-primary cursor-pointer">A: Binary Search</div>
        <div className="border border-primary bg-primary/10 px-3 py-2 text-xs font-mono text-primary font-bold cursor-pointer">B: Use HashSet</div>
        <div className="border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-mono text-slate-400 hover:border-primary cursor-pointer">C: Filter Map</div>
        <div className="border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-mono text-slate-400 hover:border-primary cursor-pointer">D: Quick Sort</div>
      </div>
    ),
  },
  SYNTAX: {
    prompt: "Click the exact location of the syntax error",
    code: (
      <>
        <div className="flex gap-4"><span className="text-zinc-600 w-4">01</span><span className="text-purple-400">const </span><span className="text-blue-400">config </span><span className="text-slate-300">= {"{"}</span></div>
        <div className="flex gap-4"><span className="text-zinc-600 w-4">02</span><span className="text-slate-300">  retries: </span><span className="text-green-400">3</span><span className="text-slate-300">,</span></div>
        <div className="flex gap-4"><span className="text-zinc-600 w-4">03</span><span className="text-slate-300">  timeout: </span><span className="text-green-400">5000</span></div>
        <div className="flex gap-4"><span className="text-zinc-600 w-4">04</span><span className="text-slate-300">  </span><span className="border border-destructive bg-destructive/20 text-destructive px-1 cursor-pointer">host=</span><span className="text-slate-300"> </span><span className="text-yellow-300">"localhost"</span></div>
        <div className="flex gap-4"><span className="text-zinc-600 w-4">05</span><span className="text-slate-300">{"}"}</span></div>
      </>
    ),
    input: (
      <div className="text-xs text-destructive font-bold flex items-center gap-2">
        <span className="animate-pulse">⚠️</span> Syntax Error Selected
      </div>
    ),
  }
};

export const HeroSection = () => {
  const { status } = useSession();
  const targetRoute = status === "authenticated" ? "/dashboard" : "/login";
  const [activeTab, setActiveTab] = useState<TabId>("TRACING");

  return (
    <section className="flex flex-col relative w-full overflow-hidden border-b-2 border-foreground bg-background">
      
      {/* ── Top Status Strip ── */}
      <div className="w-full bg-card border-b border-foreground/30 px-6 py-2 hidden md:flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-muted-foreground z-10 relative shadow-sm">
        <div className="flex items-center gap-6 max-w-7xl mx-auto w-full">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            MATCHMAKER: <span className="text-emerald-400">ONLINE</span>
          </span>
          <span>AVG QUEUE: <span className="text-primary font-bold">4.2s</span></span>
          <span>PLAYERS: <span className="text-accent font-bold">1,842</span></span>
          <span className="ml-auto">REGION: AP-SOUTH-1</span>
        </div>
      </div>

      {/* ── Main Hero Grid ── */}
      <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24 grid lg:grid-cols-2 gap-16 items-center w-full relative z-10">

        {/* ── Left: Copy & CTA ── */}
        <div className="flex flex-col gap-8">
          
          <motion.div
            className="flex items-center gap-3 w-fit border-2 border-foreground bg-card px-4 py-2 shadow-retro-sm"
            initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
          >
            <motion.div className="w-2 h-2 bg-accent" animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 1 }} />
            <span className="text-[10px] font-black uppercase tracking-widest">
              AI-Proof Technical Evaluation
            </span>
          </motion.div>

          <motion.h1
            className="text-6xl md:text-7xl lg:text-8xl font-black leading-[0.88] tracking-tighter text-foreground"
            initial={{ opacity: 0, x: -60 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.span className="block" whileHover={{ color: "hsl(43,96%,56%)", x: 4 }} transition={{ duration: 0.2 }}>LOGIC,</motion.span>
            <motion.span className="block text-primary" whileHover={{ x: 8 }} transition={{ duration: 0.2 }}>NOT</motion.span>
            <motion.span className="block" whileHover={{ color: "hsl(43,96%,56%)", x: 4 }} transition={{ duration: 0.2 }}>SYNTAX.</motion.span>
          </motion.h1>

          <motion.div
            className="border-l-4 border-primary pl-6 max-w-lg"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
          >
            <p className="text-base font-medium leading-relaxed text-muted-foreground">
              The gamified evaluation platform that tests <span className="text-foreground font-bold">engineering intuition</span> — not memorization. Stop hiring prompt engineers. Start hiring <span className="text-primary font-bold">problem solvers</span>.
            </p>
          </motion.div>

          <motion.div
            className="flex flex-wrap gap-4 pt-2"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Link href={targetRoute}>
              <motion.button
                className="arcade-btn bg-primary px-8 py-4 border-2 border-foreground shadow-retro text-sm font-black uppercase tracking-widest flex items-center gap-3"
                whileHover={{ scale: 1.05, boxShadow: "6px 6px 0px 0px hsl(var(--navy))" }}
                whileTap={{ scale: 0.95, x: 2, y: 2, boxShadow: "0px 0px 0px 0px hsl(var(--navy))" }}
              >
                <span>▶</span> Enter Arena
              </motion.button>
            </Link>
            <Link href="#how">
              <motion.button
                className="arcade-btn bg-card px-8 py-4 border-2 border-foreground shadow-retro text-sm font-black uppercase tracking-widest hover:text-primary transition-colors"
                whileHover={{ scale: 1.05, boxShadow: "6px 6px 0px 0px hsl(var(--navy))" }}
                whileTap={{ scale: 0.95, x: 2, y: 2, boxShadow: "0px 0px 0px 0px hsl(var(--navy))" }}
              >
                How It Works
              </motion.button>
            </Link>
          </motion.div>
        </div>

        {/* ── Right: Live Arena Mock ── */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* BG Glow */}
          <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full scale-[1.2] pointer-events-none" />

          {/* Console Container */}
          <div className="border-2 border-foreground shadow-retro-lg overflow-hidden relative z-10 flex flex-col" style={{ backgroundColor: "hsl(var(--editor-bg))", minHeight: "420px" }}>
            
            {/* Window bar */}
            <div className="flex items-center justify-between px-4 py-2 border-b-2 border-foreground shrink-0" style={{ backgroundColor: "hsl(var(--editor-header))" }}>
              <div className="flex gap-2">
                {["bg-destructive", "bg-primary", "bg-accent"].map((c, i) => (
                  <div key={i} className={`w-3 h-3 rounded-full border border-foreground ${c}`} />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <motion.div className="w-1.5 h-1.5 rounded-full bg-accent" animate={{ opacity: [1, 0.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} />
                <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400">
                  Round 3/5 · Live Match
                </span>
              </div>
              <div className="text-[9px] font-black text-primary font-mono animate-pulse">00:28</div>
            </div>

            {/* Timer bar */}
            <div className="h-1 bg-zinc-800 shrink-0">
              <motion.div className="h-full bg-primary" initial={{ width: "100%" }} animate={{ width: "35%" }} transition={{ duration: 2, ease: "linear" }} />
            </div>

            {/* Category Tabs */}
            <div className="flex overflow-x-auto border-b border-zinc-800 bg-zinc-950/50 shrink-0 scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "px-4 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 whitespace-nowrap transition-colors",
                    activeTab === tab.id
                      ? "border-primary text-primary bg-zinc-900/50"
                      : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Code & Input Area */}
            <div className="flex-1 flex flex-col p-5 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.15 }}
                  className="flex flex-col h-full gap-4"
                >
                  {/* Code snippet */}
                  <div className="font-mono text-xs leading-6 flex-1 overflow-y-auto">
                    {mockData[activeTab].code}
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-zinc-800 shrink-0 w-full" />

                  {/* Input Mockup */}
                  <div className="shrink-0 flex flex-col items-center gap-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 text-center">
                      {mockData[activeTab].prompt}
                    </p>
                    {mockData[activeTab].input}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
            
          </div>

          {/* Floating Badges */}
          <motion.div className="absolute -top-4 -right-4 bg-primary border-2 border-foreground px-3 py-2 shadow-retro-sm z-20" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
            <div className="text-[9px] font-black uppercase tracking-widest">Score</div>
            <div className="text-xl font-black font-mono">300</div>
          </motion.div>
        </motion.div>
      </div>

      {/* ── Bottom Match Ticker ── */}
      <div className="w-full bg-card border-t border-foreground px-4 py-2 mt-auto overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap text-[10px] font-mono uppercase tracking-widest text-muted-foreground gap-12 items-center">
          <span className="text-emerald-400">✓ SDE II · TRACING · 4/5 ROUNDS [+380 PTS]</span>
          <span className="text-destructive">✗ BACKEND ENG · BOTTLENECK · 2/5 ROUNDS [+140 PTS]</span>
          <span className="text-emerald-400">✓ INTERN · SYNTAX · 5/5 ROUNDS [+500 PTS]</span>
          <span className="text-emerald-400">✓ SR ENGINEER · MISSING LINK · 5/5 ROUNDS [+500 PTS]</span>
          <span className="text-destructive">✗ SDE I · TRACING · 1/5 ROUNDS [+80 PTS]</span>
          {/* Duplicated for smooth loop */}
          <span className="text-emerald-400">✓ SDE II · TRACING · 4/5 ROUNDS [+380 PTS]</span>
          <span className="text-destructive">✗ BACKEND ENG · BOTTLENECK · 2/5 ROUNDS [+140 PTS]</span>
          <span className="text-emerald-400">✓ INTERN · SYNTAX · 5/5 ROUNDS [+500 PTS]</span>
          <span className="text-emerald-400">✓ SR ENGINEER · MISSING LINK · 5/5 ROUNDS [+500 PTS]</span>
          <span className="text-destructive">✗ SDE I · TRACING · 1/5 ROUNDS [+80 PTS]</span>
        </div>
      </div>
    </section>
  );
};
