"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { useMotionValue, useSpring, useTransform } from "framer-motion";

// 3D tilt on mouse move
export function useTilt(strength = 10) {
  const ref = useRef<HTMLDivElement>(null);
  const x   = useMotionValue(0);
  const y   = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [strength, -strength]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-strength, strength]), { stiffness: 300, damping: 30 });

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top)  / rect.height - 0.5);
  }, [x, y]);

  const onMouseLeave = useCallback(() => {
    x.set(0); y.set(0);
  }, [x, y]);

  return { ref, rotateX, rotateY, onMouseMove, onMouseLeave };
}

// Magnetic button pull toward cursor
export function useMagnetic(strength = 0.35) {
  const ref = useRef<HTMLElement>(null);
  const x   = useSpring(0, { stiffness: 200, damping: 18 });
  const y   = useSpring(0, { stiffness: 200, damping: 18 });

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width  / 2;
    const cy = rect.top  + rect.height / 2;
    x.set((e.clientX - cx) * strength);
    y.set((e.clientY - cy) * strength);
  }, [x, y, strength]);

  const onMouseLeave = useCallback(() => {
    x.set(0); y.set(0);
  }, [x, y]);

  return { ref, x, y, onMouseMove, onMouseLeave };
}

// Ripple click effect
export function useRipple() {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  const addRipple = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id   = Date.now();
    setRipples(prev => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 600);
  }, []);

  return { ripples, addRipple };
}

// Scroll-triggered counter with elastic finish
export function useElasticCounter(target: number, duration = 1800) {
  const ref    = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);
  const inView = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !inView.current) {
        inView.current = true;
        const start  = performance.now();
        const tick   = (now: number) => {
          const t    = Math.min((now - start) / duration, 1);
          // Elastic ease-out
          const ease = t === 1 ? 1 : 1 - Math.pow(2, -10 * t) * Math.cos((t * 10 - 0.75) * (2 * Math.PI / 3));
          setVal(Math.floor(ease * target));
          if (t < 1) requestAnimationFrame(tick);
          else setVal(target);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);

  return { ref, val };
}

// Scroll shrink for navbar
export function useScrollShrink() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);
  return scrolled;
}
