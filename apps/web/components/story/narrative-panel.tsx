"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export interface NarrativePanelProps {
  /** Rendered message blocks (from renderText or similar) */
  children: React.ReactNode;
  /** Currently streaming content to append below messages */
  streamingContent?: React.ReactNode;
  /** Show loading indicator when streaming but no content yet */
  isStreaming?: boolean;
  className?: string;
}

export function NarrativePanel({
  children,
  streamingContent,
  isStreaming,
  className = "",
}: NarrativePanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [children, streamingContent]);

  return (
    <div
      ref={scrollRef}
      className={`flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin bg-muted/30 border-r border-border ${className}`}
    >
      {children}
      {isStreaming && streamingContent && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1">
          {streamingContent}
          <motion.span
            className="inline-block w-2 h-4 ml-1 bg-primary"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
        </motion.div>
      )}
      {isStreaming && !streamingContent && (
        <motion.div
          className="flex items-center gap-3 text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Loader2 className="size-4 animate-spin text-primary" />
          <span className="text-xs font-mono uppercase tracking-widest">The Game Master speaks...</span>
        </motion.div>
      )}
    </div>
  );
}

/** Renders a single message or scene block with story-theme styling */
export function renderNarrativeText(text: string) {
  return text.split("\n").map((line, i) => {
    if (/^▶\s*[A-E]\)/.test(line)) {
      return (
        <div key={i} className="font-mono text-sm my-1 font-bold text-primary">
          {line}
        </div>
      );
    }
    if (/^\[⚔️/.test(line) || /^\[SCAR/.test(line) || /^\[DEBT/.test(line)) {
      return (
        <div key={i} className="font-mono text-xs px-3 py-1.5 my-2 border border-primary/30 bg-primary/5 text-foreground">
          {line}
        </div>
      );
    }
    if (/^[═━=]+/.test(line) || /^ACT\s+\d/i.test(line) || /^ZONE COMPLETE/i.test(line)) {
      return (
        <div key={i} className="font-story-title font-semibold uppercase tracking-widest text-xs my-3 text-primary">
          {line}
        </div>
      );
    }
    if (line.trim() === "") return <div key={i} className="h-2" />;
    return (
      <p key={i} className="font-story-body text-sm leading-relaxed text-foreground">
        {line}
      </p>
    );
  });
}
