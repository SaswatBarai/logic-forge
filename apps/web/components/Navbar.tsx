"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useState } from "react";

export const Navbar = () => {
  const { status } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const targetRoute = status === "authenticated" ? "/dashboard" : "/login";
  const buttonText  = status === "authenticated" ? "Dashboard" : "Press Start";

  return (
    <motion.header
      className="sticky top-0 z-50 px-6 py-4 border-b-2 border-foreground bg-background/95 backdrop-blur-sm"
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        {/* Logo */}
        <Link href="/">
          <motion.div
            className="flex items-center gap-2 cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="bg-primary px-2 py-1 border-2 border-foreground shadow-retro-sm">
              <span className="text-foreground font-black text-sm tracking-widest">LF</span>
            </div>
            <h1 className="text-xl font-black tracking-tighter uppercase">LogicForge</h1>
            <motion.span
              className="text-primary font-mono text-lg font-black"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              _
            </motion.span>
          </motion.div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-10">
          {[
            { label: "How It Works", href: "#how" },
            { label: "Challenges",   href: "#categories" },
            { label: "Pricing",      href: "#" },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
            >
              <Link
                href={item.href}
                className="text-xs font-black uppercase tracking-widest hover:text-primary transition-colors"
              >
                {item.label}
              </Link>
            </motion.div>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {/* Live badge */}
          <div className="hidden md:flex items-center gap-1.5 border border-accent px-3 py-1">
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-accent"
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
            />
            <span className="text-[9px] font-black uppercase tracking-widest text-accent">
              Live
            </span>
          </div>

          <Link href={targetRoute}>
            <motion.button
              className="arcade-btn bg-primary px-6 py-2 border-2 border-foreground shadow-retro text-xs font-black uppercase tracking-widest"
              whileHover={{ scale: 1.05, boxShadow: "6px 6px 0px 0px hsl(var(--navy))" }}
              whileTap={{ scale: 0.95, x: 2, y: 2, boxShadow: "0px 0px 0px 0px hsl(var(--navy))" }}
            >
              {buttonText}
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.header>
  );
};
