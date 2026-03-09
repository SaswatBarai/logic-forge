import { useState, useEffect, useRef } from "react";

// ── DEMO SCRIPT ──────────────────────────────────────────────────────────────
const DEMO_SCRIPT = [
  {
    type: "narrator",
    text: "The Archive Citadel looms before you — ten million tomes stacked in six great Wings. The blind scholar sits at the central desk, his clouded eyes fixed on nothing and everything at once.",
  },
  {
    type: "dialogue",
    character: "Elder Query",
    portrait: "EQ",
    color: "#C9A84C",
    borderColor: "#8B6914",
    text: "The weapon that slays Nullus was forged by a traitor. Their name carries the shadow of death — 'Mord' in the old tongue.",
  },
  {
    type: "dialogue",
    character: "Elder Query",
    portrait: "EQ",
    color: "#C9A84C",
    borderColor: "#8B6914",
    text: "The weapon was made after the Third War. Begin with the authors, Sir Axiom. Begin precisely.",
  },
  {
    type: "choice",
    character: "Elder Query",
    portrait: "EQ",
    color: "#C9A84C",
    borderColor: "#8B6914",
    prompt: "The archive waits. How do you search for the author?",
    choices: [
      { label: "A", text: "Search every wing one by one, reading all scrolls until I find any mention of 'Mord'." },
      { label: "B", text: "List all authors whose names contain 'Mord', sorted by the era they worked in." },
      { label: "C", text: "Find authors named exactly 'Mord' — the full name must match completely." },
    ],
  },
  {
    type: "narrator",
    text: "Elder Query's fingers move across the stone table with the speed of absolute certainty. Three names surface in the air before you — spoken by the archive itself in a low harmonic hum.",
  },
  {
    type: "dialogue",
    character: "Sir Axiom",
    portrait: "SA",
    color: "#7EB8D4",
    borderColor: "#3A7A9C",
    text: "The index serves those who ask precisely. Three candidates. Three eras.",
  },
  {
    type: "dialogue",
    character: "Elder Query",
    portrait: "EQ",
    color: "#C9A84C",
    borderColor: "#8B6914",
    text: "The archive has not been read this well in three centuries, Sir Axiom.",
  },
];

// ── PIXEL PORTRAIT COMPONENT ─────────────────────────────────────────────────
const PixelPortrait = ({ initials, color, borderColor, isActive }) => {
  const portraits = {
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
      dotColor: color,
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
      dotColor: color,
    },
  };

  const p = portraits[initials] || portraits["SA"];
  const size = 8;
  const dotSize = 10;

  return (
    <div
      style={{
        width: 110,
        height: 110,
        border: `3px solid ${borderColor}`,
        boxShadow: isActive
          ? `0 0 0 2px #1a1208, 0 0 0 4px ${color}44, inset 0 0 20px ${color}22`
          : `0 0 0 2px #1a1208, inset 0 0 10px #00000088`,
        background: p.bgColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        position: "relative",
        imageRendering: "pixelated",
        transition: "box-shadow 0.3s ease",
      }}
    >
      {/* scanline overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: "repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(0,0,0,0.15) 4px, rgba(0,0,0,0.15) 5px)",
        pointerEvents: "none", zIndex: 2,
      }} />
      {/* pixel art grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${size}, ${dotSize}px)`,
        gridTemplateRows: `repeat(${size}, ${dotSize}px)`,
        gap: 0,
        imageRendering: "pixelated",
      }}>
        {p.pixels.map((row, ri) =>
          row.split("").map((cell, ci) => (
            <div
              key={`${ri}-${ci}`}
              style={{
                width: dotSize,
                height: dotSize,
                background: cell === "1" ? p.dotColor : "transparent",
                imageRendering: "pixelated",
              }}
            />
          ))
        )}
      </div>
      {/* corner decorations */}
      {[
        { top: 0, left: 0 }, { top: 0, right: 0 },
        { bottom: 0, left: 0 }, { bottom: 0, right: 0 },
      ].map((pos, i) => (
        <div key={i} style={{
          position: "absolute", width: 8, height: 8,
          background: borderColor, ...pos,
        }} />
      ))}
    </div>
  );
};

// ── TYPEWRITER HOOK ───────────────────────────────────────────────────────────
const useTypewriter = (text, speed = 28, active = true) => {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const idx = useRef(0);
  const timer = useRef(null);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    idx.current = 0;
    if (!active) { setDisplayed(text); setDone(true); return; }
    const tick = () => {
      idx.current += 1;
      setDisplayed(text.slice(0, idx.current));
      if (idx.current >= text.length) { setDone(true); return; }
      timer.current = setTimeout(tick, speed);
    };
    timer.current = setTimeout(tick, speed);
    return () => clearTimeout(timer.current);
  }, [text, active]);

  const skip = () => {
    clearTimeout(timer.current);
    setDisplayed(text);
    setDone(true);
  };

  return { displayed, done, skip };
};

// ── NARRATOR BOX ─────────────────────────────────────────────────────────────
const NarratorBox = ({ text, onNext }) => {
  const { displayed, done, skip } = useTypewriter(text, 22);

  return (
    <div
      onClick={done ? onNext : skip}
      style={{
        width: "100%",
        background: "linear-gradient(180deg, #1a1408 0%, #120e04 100%)",
        border: "2px solid #5A3E10",
        boxShadow: "0 0 0 1px #2a1e04, 0 4px 24px #00000099",
        padding: "18px 24px",
        cursor: "pointer",
        position: "relative",
        fontFamily: "'Courier New', monospace",
        userSelect: "none",
      }}
    >
      {/* top corners */}
      <div style={{ position: "absolute", top: -1, left: -1, width: 10, height: 10, borderTop: "3px solid #C9A84C", borderLeft: "3px solid #C9A84C" }} />
      <div style={{ position: "absolute", top: -1, right: -1, width: 10, height: 10, borderTop: "3px solid #C9A84C", borderRight: "3px solid #C9A84C" }} />
      <div style={{ position: "absolute", bottom: -1, left: -1, width: 10, height: 10, borderBottom: "3px solid #C9A84C", borderLeft: "3px solid #C9A84C" }} />
      <div style={{ position: "absolute", bottom: -1, right: -1, width: 10, height: 10, borderBottom: "3px solid #C9A84C", borderRight: "3px solid #C9A84C" }} />

      {/* NARRATOR label */}
      <div style={{
        position: "absolute", top: -11, left: 20,
        background: "#1a1408", padding: "0 8px",
        fontSize: 10, letterSpacing: 3, color: "#C9A84C88",
        fontFamily: "'Courier New', monospace", textTransform: "uppercase",
      }}>
        ✦ NARRATOR ✦
      </div>

      <p style={{
        margin: 0, fontSize: 14, lineHeight: 1.85,
        color: "#C9B882", fontStyle: "italic",
        textShadow: "0 1px 4px #00000099",
        minHeight: 44,
      }}>
        {displayed}
        {!done && <span style={{ opacity: 0.7, animation: "blink 0.6s infinite" }}>▮</span>}
      </p>

      {done && (
        <div style={{
          position: "absolute", bottom: 10, right: 16,
          fontSize: 11, color: "#C9A84C99", letterSpacing: 1,
          animation: "bounceY 0.8s ease-in-out infinite",
          fontFamily: "'Courier New', monospace",
        }}>
          ▼ CONTINUE
        </div>
      )}
    </div>
  );
};

// ── CHARACTER DIALOGUE BOX ────────────────────────────────────────────────────
const CharacterBox = ({ step, onNext }) => {
  const { displayed, done, skip } = useTypewriter(step.text, 26);

  return (
    <div
      onClick={done ? onNext : skip}
      style={{
        width: "100%",
        display: "flex",
        gap: 0,
        cursor: "pointer",
        userSelect: "none",
        position: "relative",
      }}
    >
      {/* Portrait panel */}
      <div style={{
        background: "linear-gradient(180deg, #140f02 0%, #0d0a00 100%)",
        border: `2px solid ${step.borderColor}`,
        borderRight: "none",
        padding: 12,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        flexShrink: 0,
        position: "relative",
      }}>
        <PixelPortrait
          initials={step.portrait}
          color={step.color}
          borderColor={step.borderColor}
          isActive={true}
        />
        {/* name tag */}
        <div style={{
          background: step.borderColor,
          padding: "3px 10px",
          fontSize: 10,
          fontWeight: "bold",
          letterSpacing: 1,
          color: "#0d0a00",
          textTransform: "uppercase",
          fontFamily: "'Courier New', monospace",
          whiteSpace: "nowrap",
          maxWidth: 110,
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}>
          {step.character}
        </div>
      </div>

      {/* Dialogue panel */}
      <div style={{
        flex: 1,
        background: "linear-gradient(180deg, #1d1508 0%, #130f04 100%)",
        border: `2px solid ${step.borderColor}`,
        padding: "18px 22px 24px",
        position: "relative",
        display: "flex",
        alignItems: "center",
      }}>
        {/* decorative top-right corner accent */}
        <div style={{ position: "absolute", top: -1, right: -1, width: 10, height: 10, borderTop: `3px solid ${step.color}`, borderRight: `3px solid ${step.color}` }} />
        <div style={{ position: "absolute", bottom: -1, right: -1, width: 10, height: 10, borderBottom: `3px solid ${step.color}`, borderRight: `3px solid ${step.color}` }} />

        {/* character name header */}
        <div style={{
          position: "absolute", top: -11, left: 16,
          background: "#130f04", padding: "0 10px",
          fontSize: 11, letterSpacing: 2, fontWeight: "bold",
          color: step.color,
          fontFamily: "'Courier New', monospace",
          textTransform: "uppercase",
        }}>
          {step.character}
        </div>

        {/* speech arrow connector */}
        <div style={{
          position: "absolute", left: -10, top: "50%", transform: "translateY(-50%)",
          width: 0, height: 0,
          borderTop: "10px solid transparent",
          borderBottom: "10px solid transparent",
          borderRight: `10px solid ${step.borderColor}`,
        }} />
        <div style={{
          position: "absolute", left: -7, top: "50%", transform: "translateY(-50%)",
          width: 0, height: 0,
          borderTop: "8px solid transparent",
          borderBottom: "8px solid transparent",
          borderRight: "8px solid #130f04",
        }} />

        <p style={{
          margin: 0, fontSize: 15, lineHeight: 1.8,
          color: "#E8D9B0",
          fontFamily: "'Courier New', monospace",
          textShadow: "0 1px 6px #00000077",
          minHeight: 44,
        }}>
          {displayed}
          {!done && (
            <span style={{ color: step.color, opacity: 0.8, animation: "blink 0.5s infinite" }}>▮</span>
          )}
        </p>

        {done && (
          <div style={{
            position: "absolute", bottom: 10, right: 16,
            fontSize: 11, color: `${step.color}99`, letterSpacing: 1,
            animation: "bounceY 0.8s ease-in-out infinite",
            fontFamily: "'Courier New', monospace",
          }}>
            ▼ NEXT
          </div>
        )}
      </div>
    </div>
  );
};

// ── CHOICE BOX ────────────────────────────────────────────────────────────────
const ChoiceBox = ({ step, onChoice }) => {
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);
  const { displayed, done } = useTypewriter(step.prompt, 24);

  const handleChoice = (i) => {
    if (selected !== null) return;
    setSelected(i);
    setTimeout(() => onChoice(i), 600);
  };

  return (
    <div style={{ width: "100%", display: "flex", gap: 0 }}>
      {/* Portrait panel */}
      <div style={{
        background: "linear-gradient(180deg, #140f02 0%, #0d0a00 100%)",
        border: `2px solid ${step.borderColor}`,
        borderRight: "none",
        padding: 12,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        flexShrink: 0,
      }}>
        <PixelPortrait
          initials={step.portrait}
          color={step.color}
          borderColor={step.borderColor}
          isActive={true}
        />
        <div style={{
          background: step.borderColor,
          padding: "3px 10px",
          fontSize: 10, fontWeight: "bold", letterSpacing: 1,
          color: "#0d0a00", textTransform: "uppercase",
          fontFamily: "'Courier New', monospace",
          whiteSpace: "nowrap", maxWidth: 110,
          overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {step.character}
        </div>
      </div>

      {/* Right panel: prompt + choices */}
      <div style={{
        flex: 1,
        background: "linear-gradient(180deg, #1d1508 0%, #130f04 100%)",
        border: `2px solid ${step.borderColor}`,
        padding: "18px 20px 20px",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}>
        {/* name header */}
        <div style={{
          position: "absolute", top: -11, left: 16,
          background: "#130f04", padding: "0 10px",
          fontSize: 11, letterSpacing: 2, fontWeight: "bold",
          color: step.color, fontFamily: "'Courier New', monospace", textTransform: "uppercase",
        }}>
          {step.character}
        </div>

        {/* speech arrow */}
        <div style={{
          position: "absolute", left: -10, top: 40, transform: "translateY(-50%)",
          width: 0, height: 0,
          borderTop: "10px solid transparent",
          borderBottom: "10px solid transparent",
          borderRight: `10px solid ${step.borderColor}`,
        }} />
        <div style={{
          position: "absolute", left: -7, top: 40, transform: "translateY(-50%)",
          width: 0, height: 0,
          borderTop: "8px solid transparent",
          borderBottom: "8px solid transparent",
          borderRight: "8px solid #130f04",
        }} />

        {/* prompt line */}
        <p style={{
          margin: "0 0 4px", fontSize: 14, lineHeight: 1.7,
          color: "#E8D9B0", fontFamily: "'Courier New', monospace",
          fontStyle: "italic",
        }}>
          {displayed}
          {!done && <span style={{ opacity: 0.7, animation: "blink 0.5s infinite" }}>▮</span>}
        </p>

        {/* divider */}
        {done && (
          <div style={{
            height: 1,
            background: `linear-gradient(90deg, transparent, ${step.borderColor}88, transparent)`,
            margin: "2px 0 6px",
          }} />
        )}

        {/* choices */}
        {done && step.choices.map((c, i) => (
          <button
            key={i}
            onClick={() => handleChoice(i)}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: selected === i
                ? `${step.color}22`
                : hovered === i
                  ? "#2a1e0a"
                  : "#1a1206",
              border: selected === i
                ? `2px solid ${step.color}`
                : hovered === i
                  ? `2px solid ${step.borderColor}`
                  : "2px solid #3a2a08",
              padding: "10px 14px",
              cursor: selected !== null ? "default" : "pointer",
              textAlign: "left",
              transition: "all 0.15s ease",
              transform: hovered === i && selected === null ? "translateX(4px)" : "none",
              opacity: selected !== null && selected !== i ? 0.35 : 1,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* label badge */}
            <div style={{
              width: 26, height: 26, flexShrink: 0,
              background: selected === i ? step.color : hovered === i ? step.borderColor : "#3a2a08",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: "bold",
              color: selected === i || hovered === i ? "#0d0a00" : step.color,
              fontFamily: "'Courier New', monospace",
              transition: "all 0.15s ease",
            }}>
              {c.label}
            </div>

            <span style={{
              fontSize: 13, color: selected === i ? step.color : "#D4C090",
              fontFamily: "'Courier New', monospace",
              lineHeight: 1.5,
              transition: "color 0.15s",
            }}>
              {c.text}
            </span>

            {/* shimmer on hover */}
            {hovered === i && selected === null && (
              <div style={{
                position: "absolute", inset: 0,
                background: `linear-gradient(90deg, transparent 0%, ${step.color}11 50%, transparent 100%)`,
                animation: "shimmer 0.8s ease",
              }} />
            )}

            {/* selected checkmark */}
            {selected === i && (
              <div style={{
                position: "absolute", right: 12,
                fontSize: 16, color: step.color,
              }}>✦</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

// ── MAIN DIALOGUE ENGINE ──────────────────────────────────────────────────────
export default function DialogueUI() {
  const [stepIdx, setStepIdx] = useState(0);
  const [history, setHistory] = useState([]);
  const [finished, setFinished] = useState(false);
  const scrollRef = useRef(null);
  const currentStep = DEMO_SCRIPT[stepIdx];

  const advance = () => {
    if (stepIdx + 1 >= DEMO_SCRIPT.length) {
      setFinished(true);
      return;
    }
    setHistory((h) => [...h, stepIdx]);
    setStepIdx(stepIdx + 1);
  };

  const handleChoice = (choiceIdx) => {
    const choice = currentStep.choices[choiceIdx];
    advance();
  };

  const restart = () => {
    setStepIdx(0);
    setHistory([]);
    setFinished(false);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [stepIdx]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080602",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 20px",
      fontFamily: "'Courier New', monospace",
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes bounceY {
          0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)}
        }
        @keyframes shimmer {
          from{opacity:0;transform:translateX(-100%)}
          to{opacity:1;transform:translateX(100%)}
        }
        @keyframes fadeIn {
          from{opacity:0;transform:translateY(12px)}
          to{opacity:1;transform:translateY(0)}
        }
        @keyframes scanline {
          0%{background-position:0 0}
          100%{background-position:0 100%}
        }
        * { box-sizing: border-box; }
        button { outline: none; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #080602; }
        ::-webkit-scrollbar-thumb { background: #3a2a08; border-radius: 3px; }
      `}</style>

      {/* CRT scanline overlay */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 100,
        background: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 4px)",
      }} />

      {/* ambient glow */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 50% 80%, #2a1a0044 0%, transparent 70%)",
      }} />

      {/* ── TITLE BAR ── */}
      <div style={{
        width: "100%", maxWidth: 740,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 20,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 28, height: 28, background: "#C9A84C", clipPath: "polygon(50% 0%,100% 50%,50% 100%,0% 50%)" }} />
          <div>
            <div style={{ fontSize: 18, fontWeight: "bold", color: "#C9A84C", letterSpacing: 3, textTransform: "uppercase" }}>
              Ironclad Chronicles
            </div>
            <div style={{ fontSize: 10, color: "#5a4a20", letterSpacing: 2 }}>
              ── THE ARCHIVE CITADEL ──
            </div>
          </div>
        </div>

        {/* HUD stats */}
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          {[
            { label: "XP", value: "350", color: "#C9A84C" },
            { label: "RANK", value: "KNIGHT", color: "#7EB8D4" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              background: "#12100400",
              border: "1px solid #3a2a08",
              padding: "4px 12px",
              textAlign: "center",
            }}>
              <div style={{ fontSize: 9, color: "#5a4a20", letterSpacing: 2 }}>{label}</div>
              <div style={{ fontSize: 12, color, fontWeight: "bold", letterSpacing: 1 }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── DIALOGUE WINDOW ── */}
      <div style={{
        width: "100%", maxWidth: 740,
        background: "#0d0a02",
        border: "2px solid #3a2a08",
        boxShadow: "0 0 0 1px #1a1208, 0 0 60px #C9A84C11, 0 20px 60px #00000099",
        position: "relative",
      }}>
        {/* window title bar */}
        <div style={{
          background: "linear-gradient(90deg, #1a1408, #120e04)",
          borderBottom: "2px solid #3a2a08",
          padding: "8px 16px",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{ display: "flex", gap: 6 }}>
            {["#8B0000", "#5A3E10", "#1B4332"].map((c, i) => (
              <div key={i} style={{ width: 10, height: 10, background: c, border: "1px solid #00000044" }} />
            ))}
          </div>
          <div style={{ fontSize: 10, color: "#5a4a20", letterSpacing: 2, flex: 1, textAlign: "center" }}>
            ── DIALOGUE SYSTEM v1.0 ──
          </div>
          <div style={{ fontSize: 10, color: "#3a2a08" }}>
            {stepIdx + 1} / {DEMO_SCRIPT.length}
          </div>
        </div>

        {/* progress bar */}
        <div style={{ height: 2, background: "#1a1408" }}>
          <div style={{
            height: "100%",
            width: `${((stepIdx) / (DEMO_SCRIPT.length - 1)) * 100}%`,
            background: "linear-gradient(90deg, #5A3E10, #C9A84C)",
            transition: "width 0.5s ease",
          }} />
        </div>

        {/* content */}
        <div style={{ padding: "24px 24px 28px", display: "flex", flexDirection: "column", gap: 0 }}>
          {!finished ? (
            <div style={{ animation: "fadeIn 0.3s ease" }} key={stepIdx}>
              {currentStep.type === "narrator" && (
                <NarratorBox text={currentStep.text} onNext={advance} />
              )}
              {currentStep.type === "dialogue" && (
                <CharacterBox step={currentStep} onNext={advance} />
              )}
              {currentStep.type === "choice" && (
                <ChoiceBox step={currentStep} onChoice={handleChoice} />
              )}
            </div>
          ) : (
            <div style={{
              textAlign: "center", padding: "40px 20px",
              animation: "fadeIn 0.5s ease",
            }}>
              <div style={{ fontSize: 24, color: "#C9A84C", letterSpacing: 4, marginBottom: 12 }}>
                ✦ SCENE COMPLETE ✦
              </div>
              <div style={{ fontSize: 13, color: "#5a4a20", marginBottom: 28, letterSpacing: 1 }}>
                The archive has yielded its knowledge.
              </div>
              <button
                onClick={restart}
                style={{
                  background: "transparent", border: "2px solid #C9A84C",
                  padding: "10px 32px", color: "#C9A84C",
                  fontSize: 13, letterSpacing: 3, cursor: "pointer",
                  fontFamily: "'Courier New', monospace", textTransform: "uppercase",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={e => {
                  e.target.style.background = "#C9A84C22";
                  e.target.style.boxShadow = "0 0 20px #C9A84C44";
                }}
                onMouseLeave={e => {
                  e.target.style.background = "transparent";
                  e.target.style.boxShadow = "none";
                }}
              >
                ↺ REPLAY SCENE
              </button>
            </div>
          )}
        </div>

        {/* bottom status bar */}
        <div style={{
          borderTop: "1px solid #1a1408",
          padding: "6px 16px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ fontSize: 9, color: "#3a2a08", letterSpacing: 2 }}>
            {currentStep?.type === "narrator" ? "⟨ NARRATOR ⟩" : currentStep?.type === "choice" ? "⚡ CHOICE NODE" : `◈ ${currentStep?.character?.toUpperCase()}`}
          </div>
          <div style={{ fontSize: 9, color: "#3a2a08", letterSpacing: 1 }}>
            {currentStep?.type !== "choice" ? "CLICK TO ADVANCE" : "SELECT A PATH"}
          </div>
        </div>
      </div>

      {/* keyboard hint */}
      <div style={{ marginTop: 16, fontSize: 10, color: "#2a1e04", letterSpacing: 2 }}>
        CLICK DIALOGUE TO ADVANCE  ·  CLICK DURING TYPING TO SKIP
      </div>
    </div>
  );
}
