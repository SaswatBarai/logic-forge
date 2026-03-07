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

        const draw = () => {
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            const dpr  = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return;
            canvas.width  = rect.width  * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
            ctx.clearRect(0, 0, rect.width, rect.height);

            // ── Title ──
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 16px var(--font-sans), sans-serif";
            ctx.fillText(title, 0, 24);

            // ── Separator ──
            ctx.strokeStyle = "#27272a";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, 36);
            ctx.lineTo(rect.width, 36);
            ctx.stroke();

            // ── Description ──
            ctx.font = "12px var(--font-sans), sans-serif";
            ctx.fillStyle = "#a1a1aa";

            const words  = description.split(" ");
            let line     = "";
            let y        = 56;
            const maxW   = rect.width;
            const lineH  = 18;

            for (let n = 0; n < words.length; n++) {
                const test = line + words[n] + " ";
                if (ctx.measureText(test).width > maxW && n > 0) {
                    ctx.fillText(line, 0, y);
                    line = words[n] + " ";
                    y += lineH;
                } else {
                    line = test;
                }
            }
            ctx.fillText(line, 0, y);
        };

        draw();
        const ro = new ResizeObserver(draw);
        ro.observe(canvas);
        return () => ro.disconnect();

    }, [title, description]);

    // ✅ Split on real newline — NOT escaped \\n
    const codeLines = codeTemplate ? codeTemplate.split("\n") : [];

    return (
        <div className="w-full h-full flex flex-col gap-2 overflow-hidden">

            {/* Canvas: title + description — fixed height, shrinks if no code */}
            <canvas
                ref={canvasRef}
                className="w-full shrink-0 bg-transparent"
                style={{ height: codeTemplate ? "100px" : "100%" }}
            />

            {/* Code block: real DOM — fills remaining space, scrolls */}
            {codeTemplate && (
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden border border-foreground/15"
                    style={{ backgroundColor: "hsl(230 40% 6%)" }}>

                    {/* Label bar */}
                    <div className="flex items-center justify-between px-3 py-1.5 border-b border-foreground/15 shrink-0"
                        style={{ backgroundColor: "hsl(230 40% 9%)" }}>
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary font-mono">
                            {codeLabel ?? "▶ SLOW CODE (O(N²))"}
                        </span>
                        <span className="text-[9px] font-mono text-foreground/30">read-only</span>
                    </div>

                    {/* Line numbers + code — scroll together horizontally, independently vertical */}
                    <div className="flex flex-1 min-h-0 overflow-hidden">

                        {/* Line numbers — never scrolls horizontally */}
                        <div
                            className="select-none shrink-0 py-3 px-2 text-right border-r border-foreground/10 overflow-y-auto overflow-x-hidden"
                            style={{ backgroundColor: "hsl(230 40% 8%)", minWidth: "2.25rem" }}
                        >
                            {codeLines.map((_, i) => (
                                <div key={i} className="text-[11px] font-mono leading-6 text-foreground/25">
                                    {i + 1}
                                </div>
                            ))}
                        </div>

                        {/* Code — both axes scroll */}
                        <pre
                            className="flex-1 py-3 px-4 text-[12px] font-mono leading-6 text-slate-200 overflow-auto whitespace-pre m-0"
                            style={{ backgroundColor: "hsl(230 40% 6%)" }}
                        >
                            {codeTemplate}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
}
