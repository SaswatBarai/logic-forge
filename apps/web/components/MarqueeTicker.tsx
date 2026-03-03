"use client";

export const MarqueeTicker = () => {
  const items = [
    "▶ LIVE ROUNDS ACTIVE",
    "◆ AI DETECTION ENABLED",
    "▶ 850K+ ENGINEERS TESTED",
    "◆ ZERO MEMORIZATION",
    "▶ REAL-TIME EVALUATION",
    "◆ 4 CHALLENGE TYPES",
    "▶ ANTI-CHEAT ACTIVE",
    "◆ HIRE PROBLEM SOLVERS",
  ];

  return (
    <div className="border-b-2 border-foreground bg-primary overflow-hidden py-2">
      <div className="flex animate-marquee whitespace-nowrap">
        {[...items, ...items].map((item, i) => (
          <span
            key={i}
            className="mx-8 text-[11px] font-black uppercase tracking-widest text-foreground"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};
