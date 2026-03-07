"use client";

import { useEffect, useState }   from "react";
import { useSession }            from "next-auth/react";
import { Loader2 }               from "lucide-react";
import { GlobalScoreCard }       from "./GlobalScoreCard";
import { MatchHistoryTable }     from "./MatchHistoryTable";
import type { MatchRecord }      from "./MatchHistoryTable";

export function MatchHistorySection() {
  const { data: session }             = useSession();
  const [records, setRecords]         = useState<MatchRecord[]>([]);
  const [globalScore, setGlobalScore] = useState(0);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    fetch("/api/match-history")
      .then(async r => {
        const text = await r.text();
        const d = text ? (() => { try { return JSON.parse(text); } catch { return {}; } })() : {};
        if (!r.ok) {
          setRecords([]);
          setGlobalScore(0);
          return;
        }
        setRecords(d.records ?? []);
        setGlobalScore(d.globalScore ?? 0);
      })
      .catch(() => {
        setRecords([]);
        setGlobalScore(0);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <GlobalScoreCard
        score={globalScore}
        username={session?.user?.name ?? undefined}
      />

      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40 mb-4">
          ▶ Match Ledger
        </p>
        <MatchHistoryTable records={records} />
      </div>
    </div>
  );
}
