"use client";

import { useEffect, useRef } from "react";

interface PromptCanvasProps {
    title: string;
    description: string;
    codeTemplate?: string;
    codeLabel?: string;   
}

export function PromptCanvas({ title, description, codeTemplate, codeLabel }: PromptCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width  = rect.width  * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, rect.width, rect.height);

        // ── Title ──
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 24px var(--font-sans), sans-serif";
        ctx.fillText(title, 20, 40);

        // ── Separator ──
        ctx.strokeStyle = "#27272a";
        ctx.beginPath();
        ctx.moveTo(20, 60);
        ctx.lineTo(rect.width - 20, 60);
        ctx.stroke();

        // ── Description ──
        ctx.font = "16px var(--font-sans), sans-serif";
        ctx.fillStyle = "#a1a1aa";

        const words = description.split(" ");
        let line = "";
        let y = 90;
        const maxWidth = rect.width - 40;
        const lineHeight = 24;

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + " ";
            if (ctx.measureText(testLine).width > maxWidth && n > 0) {
                ctx.fillText(line, 20, y);
                line = words[n] + " ";
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, 20, y);
        y += lineHeight + 10;

        // ── Code block (only if provided) ──
        if (codeTemplate) {
            const codeLines = codeTemplate.split("\n");
            const blockHeight = codeLines.length * 20 + 28;

            // Code block background
            ctx.fillStyle = "#18181b";
            ctx.fillRect(16, y, rect.width - 32, blockHeight);

            // Code border
            ctx.strokeStyle = "#3f3f46";
            ctx.lineWidth = 1;
            ctx.strokeRect(16, y, rect.width - 32, blockHeight);

            // Dynamic label — amber for TRACING, red for BOTTLENECK
            const isTracing = codeLabel?.includes("TRACE");
            ctx.fillStyle = isTracing ? "#fbbf24" : "#ef4444";
            ctx.font = "bold 11px monospace";
            ctx.fillText(
                codeLabel ?? "▶ SLOW CODE (O(N²))",   // ← fallback kept
                24,
                y + 14
            );
            y += 24;

            // Code lines
            ctx.font = "13px monospace";
            ctx.fillStyle = isTracing ? "#93c5fd" : "#86efac"; // blue for tracing, green for bottleneck
            for (const codeLine of codeLines) {
                ctx.fillText(codeLine, 24, y + 6);
                y += 20;
            }
        }

    }, [title, description, codeTemplate, codeLabel]); 
    return (
        <div className="w-full h-full relative" style={{ userSelect: "none" }}>
            <canvas
                ref={canvasRef}
                style={{ width: "100%", height: "100%", display: "block" }}
                className="rounded-md border border-zinc-800 bg-zinc-950 shadow-sm"
            />
            <div className="absolute inset-0 z-10" onContextMenu={(e) => e.preventDefault()} />
        </div>
    );
}
