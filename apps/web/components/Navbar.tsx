"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export const Navbar = () => {
  return (
    <motion.header
      className="sticky top-0 z-50 px-6 py-4 border-b-2 border-foreground bg-background/95 backdrop-blur-sm"
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/">
          <motion.div
            className="flex items-center gap-2 cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="bg-primary p-1 border-2 border-foreground shadow-retro-sm">
              <span className="text-foreground font-bold text-xl">⌘</span>
            </div>
            <h1 className="text-2xl font-black tracking-tighter uppercase">
              LogicForge
            </h1>
          </motion.div>
        </Link>
        <nav className="hidden md:flex items-center gap-10">
          {["Product", "Solutions", "Pricing"].map((item, i) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
            >
              <Link
                href="#"
                className="text-sm font-bold uppercase tracking-widest hover:text-primary transition-colors cursor-pointer relative block"
              >
                <motion.span whileHover={{ y: -2 }}>{item}</motion.span>
              </Link>
            </motion.div>
          ))}
        </nav>
        <a href="#cta">
          <motion.button
            className="arcade-btn bg-primary px-6 py-2 border-2 border-foreground shadow-retro text-sm font-black uppercase tracking-widest"
            whileHover={{ scale: 1.05, boxShadow: "6px 6px 0px 0px hsl(var(--navy))" }}
            whileTap={{
              scale: 0.95,
              boxShadow: "0px 0px 0px 0px hsl(var(--navy))",
              x: 2,
              y: 2,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Press Start
          </motion.button>
        </a>
      </div>
    </motion.header>
  );
};
