"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export const Footer = () => {
  return (
    <footer className="bg-card border-t-2 border-foreground py-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <Link href="/">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-1 border-2 border-foreground">
              <span className="text-foreground text-sm font-bold">⌘</span>
            </div>
            <span className="text-xl font-black uppercase tracking-tighter">
              LogicForge
            </span>
          </div>
        </Link>
        <div className="flex gap-8 text-sm font-bold uppercase tracking-widest">
          {["Docs", "Terms", "Privacy", "Contact"].map((item) => (
            <motion.div key={item} whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
              <Link href="#" className="hover:text-primary cursor-pointer block">
                {item}
              </Link>
            </motion.div>
          ))}
        </div>
        <p className="text-xs font-medium text-muted-foreground">
          © 1994 - 2024 LOGICFORGE INDUSTRIES. ALL RIGHTS RESERVED.
        </p>
      </div>
    </footer>
  );
};
