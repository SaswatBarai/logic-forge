"use client";

import { useEffect, useRef } from "react";

interface PromptCanvasProps {
    title: string;
    description: string;
}

/**
 * Web Canvas implementation to render the challenge text.
 * Prevents simple copy-pasting of prompt details into ChatGPT.
 */
export function PromptCanvas({ title, description }: PromptCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Handle high DPI displays
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();

        // Explicitly set actual size in memory (scaled to account for extra pixel density).
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        // Normalize coordinate system to use css pixels.
        ctx.scale(dpr, dpr);

        // Clear canvas
        ctx.clearRect(0, 0, rect.width, rect.height);

        ctx.fillStyle = "#ffffff";

        // Title
        ctx.font = "bold 24px var(--font-sans), sans-serif";
        ctx.fillText(title, 20, 40);

        // Separator line
        ctx.strokeStyle = "#27272a"; // zinc-800
        ctx.beginPath();
        ctx.moveTo(20, 60);
        ctx.lineTo(rect.width - 20, 60);
        ctx.stroke();

        // Body Text with rudimentary wrapping
        ctx.font = "16px var(--font-sans), sans-serif";
        ctx.fillStyle = "#a1a1aa"; // zinc-400

        const words = description.split(" ");
        let line = "";
        let y = 100;
        const maxWidth = rect.width - 40;
        const lineHeight = 24;

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + " ";
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;

            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line, 20, y);
                line = words[n] + " ";
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        // Print remainer
        ctx.fillText(line, 20, y);

    }, [title, description]);

    return (
        <div className="w-full h-full relative" style={{ userSelect: "none" }}>
            <canvas
                ref={canvasRef}
                style={{ width: "100%", height: "100%", display: "block" }}
                className="rounded-md border border-zinc-800 bg-zinc-950 shadow-sm"
            />
            {/* Invisible overlay to strictly block canvas inspection tricks */}
            <div className="absolute inset-0 z-10" onContextMenu={(e) => e.preventDefault()} />
        </div>
    );
}
