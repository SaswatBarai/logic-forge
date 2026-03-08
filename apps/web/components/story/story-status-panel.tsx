"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Skull, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { useStoryStore } from "@/store/story-store";
import type { StoryZone } from "@/store/story-store";

const ZONE_LABELS: Record<StoryZone, string> = {
  ARCHIVE_CITADEL: "Archive Citadel",
  FORGE_VILLAGE: "Forge Village",
  WALL_OF_GATES: "Wall of Gates",
};

export function StoryStatusPanel() {
  const { scars, debts } = useStoryStore();
  const [collapsed, setCollapsed] = useState(true);

  if (scars.length === 0 && debts.length === 0) return null;

  return (
    <div className="shrink-0 border-t md:border-t-0 md:border-l border-border w-full md:w-72 flex flex-col bg-muted/30">
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="flex items-center justify-between px-4 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-primary"
      >
        <span>Scars & Debts</span>
        {collapsed ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
      </button>
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">
              {scars.length > 0 && (
                <div>
                  <p className="text-[9px] font-mono uppercase tracking-widest mb-2 flex items-center gap-1.5 text-destructive">
                    <Skull className="size-3" /> Scars ({scars.length})
                  </p>
                  <ul className="space-y-2">
                    {scars.map((s) => (
                      <li
                        key={`${s.zone}-${s.act}-${s.name}`}
                        className="px-3 py-2 rounded border border-destructive/30 bg-destructive/5 text-xs text-foreground"
                      >
                        <p className="font-story-title font-semibold">{s.name}</p>
                        <p className="mt-0.5 opacity-80">{s.description}</p>
                        <p className="mt-1 font-mono text-[10px] opacity-60">
                          {ZONE_LABELS[s.zone]} · Act {s.act}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {debts.length > 0 && (
                <div>
                  <p className="text-[9px] font-mono uppercase tracking-widest mb-2 flex items-center gap-1.5 text-primary">
                    <AlertTriangle className="size-3" /> Debts ({debts.length})
                  </p>
                  <ul className="space-y-2">
                    {debts.map((d) => (
                      <li
                        key={`${d.zone}-${d.act}-${d.name}`}
                        className="px-3 py-2 rounded border border-primary/30 bg-primary/5 text-xs text-foreground"
                      >
                        <p className="font-story-title font-semibold">{d.name}</p>
                        <p className="mt-0.5 opacity-80">{d.description}</p>
                        <p className="mt-1 font-mono text-[10px] opacity-60">Triggers at: {d.triggersAt}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
