"use client";

/**
 * Pixel-art portrait from 8×8 dot grid (DialogueUI.jsx style).
 * Elder Query (gold), Sir Axiom (blue), Ferron, King — each with 8×8 pixel pattern.
 */

export interface PixelPortraitProps {
  initials: string;
  color: string;
  borderColor: string;
  isActive?: boolean;
}

const SIZE = 8;
const DOT_SIZE = 10;

const PIXEL_DATA: Record<
  string,
  { pixels: string[]; bgColor: string }
> = {
  EQ: {
    pixels: [
      "00111100",
      "01111110",
      "11011011",
      "11111111",
      "11011011",
      "00111100",
      "01111110",
      "11000011",
    ],
    bgColor: "#1a1408",
  },
  SA: {
    pixels: [
      "00111100",
      "01111110",
      "11111111",
      "10111101",
      "11111111",
      "01111110",
      "01100110",
      "11111111",
    ],
    bgColor: "#081418",
  },
  FE: {
    pixels: [
      "00111100",
      "01111110",
      "11011011",
      "11111111",
      "11011011",
      "01111110",
      "01100110",
      "11110111",
    ],
    bgColor: "#1a1208",
  },
  KI: {
    pixels: [
      "01111110",
      "01111110",
      "00011000",
      "01111110",
      "01111110",
      "00011000",
      "01111110",
      "11111111",
    ],
    bgColor: "#1a1410",
  },
};

const DEFAULT_DATA = PIXEL_DATA.EQ!;

export function PixelPortrait({
  initials,
  color,
  borderColor,
  isActive = true,
}: PixelPortraitProps) {
  const data = PIXEL_DATA[initials] ?? DEFAULT_DATA;
  const dotColor = color;

  return (
    <div
      className="relative flex shrink-0 items-center justify-center"
      style={{
        width: 110,
        height: 110,
        border: `3px solid ${borderColor}`,
        boxShadow: isActive
          ? `0 0 0 2px #1a1208, 0 0 0 4px ${color}44, inset 0 0 20px ${color}22`
          : `0 0 0 2px #1a1208, inset 0 0 10px #00000088`,
        background: data.bgColor,
        imageRendering: "pixelated",
        transition: "box-shadow 0.3s ease",
      }}
    >
      {/* CRT scanline overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-[2]"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(0,0,0,0.15) 4px, rgba(0,0,0,0.15) 5px)",
        }}
      />
      {/* 8×8 pixel grid */}
      <div
        className="grid gap-0"
        style={{
          gridTemplateColumns: `repeat(${SIZE}, ${DOT_SIZE}px)`,
          gridTemplateRows: `repeat(${SIZE}, ${DOT_SIZE}px)`,
          imageRendering: "pixelated",
        }}
      >
        {data.pixels.map((row, ri) =>
          row.split("").map((cell, ci) => (
            <div
              key={`${ri}-${ci}`}
              style={{
                width: DOT_SIZE,
                height: DOT_SIZE,
                background: cell === "1" ? dotColor : "transparent",
                imageRendering: "pixelated",
              }}
            />
          ))
        )}
      </div>
      {/* Corner decorations (small squares) */}
      {[
        { top: 0, left: 0 },
        { top: 0, right: 0 },
        { bottom: 0, left: 0 },
        { bottom: 0, right: 0 },
      ].map((pos, i) => (
        <div
          key={i}
          className="absolute h-2 w-2"
          style={{
            background: borderColor,
            ...pos,
          }}
        />
      ))}
    </div>
  );
}
