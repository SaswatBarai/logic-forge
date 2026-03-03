"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export const Footer = () => (
  <footer className="bg-card border-t-2 border-foreground py-12 px-6">
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8">

      <div className="flex flex-col gap-3">
        <Link href="/">
          <div className="flex items-center gap-2">
            <div className="bg-primary px-2 py-1 border-2 border-foreground shadow-retro-sm">
              <span className="text-foreground text-xs font-black">LF</span>
            </div>
            <span className="text-lg font-black uppercase tracking-tighter">LogicForge</span>
          </div>
        </Link>
        <p className="text-xs text-muted-foreground max-w-[200px] leading-relaxed">
          AI-proof technical evaluation. Real code. Real skill.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-xs font-bold uppercase tracking-widest">
        {[
          { label: "Product",    href: "#" },
          { label: "Docs",       href: "#" },
          { label: "Pricing",    href: "#" },
          { label: "Terms",      href: "#" },
          { label: "Contact",    href: "#" },
          { label: "Privacy",    href: "#" },
        ].map((item) => (
          <motion.div key={item.label} whileHover={{ x: 2 }} transition={{ duration: 0.15 }}>
            <Link href={item.href} className="hover:text-primary transition-colors">
              {item.label}
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col gap-2 items-start md:items-end">
        <div className="flex items-center gap-1.5 border border-accent px-3 py-1">
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-accent"
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
          />
          <span className="text-[9px] font-black uppercase tracking-widest text-accent">All Systems Operational</span>
        </div>
        <p className="text-[10px] text-muted-foreground">
          © 2024 LogicForge Industries. All rights reserved.
        </p>
      </div>

    </div>
  </footer>
);
