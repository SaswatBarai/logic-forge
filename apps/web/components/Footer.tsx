"use client";

import Link from "next/link";
import { motion } from "framer-motion";

function FooterLink({ label, href }: { label: string; href: string }) {
  return (
    <motion.div
      className="relative w-fit"
      whileHover={{ x: 3 }}
      transition={{ duration: 0.15 }}
    >
      <Link href={href} className="relative text-xs font-bold uppercase tracking-widest hover:text-primary transition-colors group">
        {label}
        <motion.span
          className="absolute -bottom-0.5 left-0 h-[1.5px] bg-primary"
          initial={{ width: "0%" }}
          whileHover={{ width: "100%" }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </Link>
    </motion.div>
  );
}

export const Footer = () => (
  <footer className="bg-card border-t-2 border-foreground py-12 px-6">
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8">

      <div className="flex flex-col gap-3">
        <Link href="/">
          <motion.div
            className="flex items-center gap-2"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <motion.div
              className="bg-primary px-2 py-1 border-2 border-foreground shadow-retro-sm"
              whileHover={{ rotate: -3 }}
              transition={{ duration: 0.2 }}
            >
              <span className="text-foreground text-xs font-black">LF</span>
            </motion.div>
            <span className="text-lg font-black uppercase tracking-tighter">LogicForge</span>
          </motion.div>
        </Link>
        <p className="text-xs text-muted-foreground max-w-[200px] leading-relaxed">
          AI-proof technical evaluation. Real code. Real skill.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-x-12 gap-y-3">
        {[
          { label: "Product", href: "#" }, { label: "Docs",    href: "#" },
          { label: "Pricing", href: "#" }, { label: "Terms",   href: "#" },
          { label: "Contact", href: "#" }, { label: "Privacy", href: "#" },
        ].map(item => <FooterLink key={item.label} {...item} />)}
      </div>

      <div className="flex flex-col gap-2 items-start md:items-end">
        {/* System status with glow */}
        <motion.div
          className="flex items-center gap-1.5 border border-accent px-3 py-1 relative overflow-hidden"
          whileHover={{ borderColor: "hsl(var(--accent))", scale: 1.03 }}
          transition={{ duration: 0.15 }}
        >
          {/* Glow pulse */}
          <motion.div
            className="absolute inset-0 bg-accent/5"
            animate={{ opacity: [0, 0.4, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-accent relative z-10"
            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.3, 1] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
          />
          <span className="text-[9px] font-black uppercase tracking-widest text-accent relative z-10">
            All Systems Operational
          </span>
        </motion.div>
        <p className="text-[10px] text-muted-foreground">
          © 2024 LogicForge Industries. All rights reserved.
        </p>
      </div>

    </div>
  </footer>
);
