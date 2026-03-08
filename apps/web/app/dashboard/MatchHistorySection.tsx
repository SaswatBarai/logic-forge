"use client";

import { motion }             from "framer-motion";
import { AlertCircle, Zap, ArrowRight } from "lucide-react";
import { MatchHistoryTable }  from "./MatchHistoryTable";
import type { MatchRecord }   from "./MatchHistoryTable";
import Link                   from "next/link";

interface Props {
  records:     MatchRecord[];
  globalScore: number;
  error:       boolean;
}

export function MatchHistorySection({ records, error }: Props) {

  if (error) {
    return (
      <motion.div
        className="border-2 border-destructive/30 bg-destructive/5 p-8 flex items-center gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
        <p className="text-xs font-mono text-destructive uppercase tracking-widest">
          Failed to load match history — try refreshing the page.
        </p>
      </motion.div>
    );
  }

  if (records.length === 0) {
    return (
      <motion.div
        className="border-2 border-foreground/20 bg-card py-16 flex flex-col items-center gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="w-14 h-14 border-2 border-foreground/15 flex items-center justify-center">
          <Zap className="w-7 h-7 text-foreground/15" />
        </div>
        <div className="flex flex-col items-center gap-2 text-center px-6">
          <p className="text-sm font-black uppercase tracking-widest text-foreground/40">
            No matches recorded
          </p>
          <p className="text-xs font-mono text-foreground/25 max-w-xs leading-relaxed">
            Complete your first match to start building your performance history and earning LP.
          </p>
        </div>
        <Link href="/arcade">
          <motion.button
            className="flex items-center gap-2 bg-primary text-background px-6 py-3 border-2 border-foreground text-xs font-black uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Zap className="w-3.5 h-3.5" />
            Play First Match
            <ArrowRight className="w-3 h-3" />
          </motion.button>
        </Link>
      </motion.div>
    );
  }

  return <MatchHistoryTable records={records} />;
}
