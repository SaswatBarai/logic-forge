"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { ScrollReveal } from "./ScrollReveal";

function AnimatedCounter({
  target,
  suffix = "",
}: {
  target: number;
  suffix?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 2000;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, target]);

  const formatted =
    count >= 1000000
      ? (count / 1000000).toFixed(1) + "M"
      : count.toLocaleString();

  return (
    <p ref={ref} className="text-4xl font-black">
      {formatted}
      {suffix}
    </p>
  );
}

const stats = [
  {
    label: "Players Joined",
    value: 850231,
    icon: "👥",
    color: "bg-accent",
    barWidth: "85%",
  },
  {
    label: "Cheats Blocked",
    value: 1200000,
    icon: "🛡️",
    color: "bg-destructive",
    barWidth: "92%",
  },
  {
    label: "System Trust",
    value: 99,
    suffix: ".9%",
    icon: "✓",
    color: "bg-primary",
    barWidth: "99%",
  },
];

export const StatsSection = () => {
  return (
    <section className="border-y-2 border-foreground bg-card py-12">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        {stats.map((stat, i) => (
          <ScrollReveal key={stat.label} delay={i * 0.15}>
            <motion.div
              className="flex flex-col gap-4 p-6 border-2 border-foreground shadow-retro rounded-lg bg-background"
              whileHover={{
                y: -4,
                boxShadow: "6px 6px 0px 0px hsl(var(--navy))",
              }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-black uppercase tracking-tighter text-sm">
                  {stat.label}
                </h3>
                <span className="text-xl">{stat.icon}</span>
              </div>
              <AnimatedCounter
                target={stat.value}
                suffix={"suffix" in stat ? stat.suffix : ""}
              />
              <div className="w-full bg-muted h-4 border border-foreground flex overflow-hidden">
                <motion.div
                  className={`${stat.color} h-full border-r border-foreground`}
                  initial={{ width: "0%" }}
                  whileInView={{ width: stat.barWidth }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 1.5,
                    delay: 0.3 + i * 0.15,
                    ease: "easeOut",
                  }}
                />
              </div>
            </motion.div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
};
