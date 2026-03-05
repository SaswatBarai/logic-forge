"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import { LogOut, LayoutDashboard, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Navbar = () => {
  const { data: session, status } = useSession();

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
            { label: "How It Works", href: "/#how" },
            { label: "Challenges", href: "/#categories" },
            { label: "Story Mode", href: "/story" },
            { label: "Pricing", href: "/#" },
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

        <div className="flex items-center gap-4">
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

          {status === "authenticated" ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button
                  className="flex items-center gap-2 bg-card border-2 border-foreground px-3 py-1.5 shadow-retro-sm outline-none"
                  whileHover={{ scale: 1.05, boxShadow: "4px 4px 0px 0px hsl(var(--navy))" }}
                  whileTap={{ scale: 0.95, x: 2, y: 2, boxShadow: "0px 0px 0px 0px hsl(var(--navy))" }}
                >
                  {/* ✅ Avatar with fallback */}
                  <div className="w-7 h-7 border-2 border-foreground shrink-0 overflow-hidden">
                    {session?.user?.image ? (
                      <img
                        src={session.user.image}
                        alt={session.user.name || "Player"}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest truncate max-w-[100px]">
                    {session?.user?.name || "Player"}
                  </span>
                </motion.button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-60 border-2 border-foreground rounded-none shadow-retro-md bg-card p-0 mt-2"
              >
                {/* ✅ Dropdown header with avatar */}
                <div className="p-3 border-b-2 border-foreground bg-background flex items-center gap-3">
                  <div className="w-10 h-10 border-2 border-foreground shrink-0 overflow-hidden">
                    {session?.user?.image ? (
                      <img
                        src={session.user.image}
                        alt={session.user.name || "Player"}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary flex items-center justify-center text-foreground font-black text-sm">
                        {(session?.user?.name?.[0] || "P").toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <p className="text-xs font-black uppercase tracking-widest truncate">
                      {session?.user?.name || "Player"}
                    </p>
                    <p className="text-[10px] font-mono text-muted-foreground truncate mt-0.5">
                      {session?.user?.email || "No Email"}
                    </p>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="p-2 flex flex-col gap-1">
                  <Link href="/dashboard">
                    <DropdownMenuItem className="cursor-pointer text-xs font-bold uppercase tracking-widest rounded-none focus:bg-primary focus:text-foreground">
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Dashboard
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/settings">
                    <DropdownMenuItem className="cursor-pointer text-xs font-bold uppercase tracking-widest rounded-none focus:bg-primary focus:text-foreground">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                  </Link>
                </div>

                {/* Sign out */}
                <div className="border-t-2 border-foreground p-2">
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="cursor-pointer text-xs font-bold uppercase tracking-widest text-destructive rounded-none focus:bg-destructive focus:text-destructive-foreground"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Disconnect
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <motion.button
                className="arcade-btn bg-primary px-6 py-2 border-2 border-foreground shadow-retro text-xs font-black uppercase tracking-widest"
                whileHover={{ scale: 1.05, boxShadow: "6px 6px 0px 0px hsl(var(--navy))" }}
                whileTap={{ scale: 0.95, x: 2, y: 2, boxShadow: "0px 0px 0px 0px hsl(var(--navy))" }}
              >
                Press Start
              </motion.button>
            </Link>
          )}
        </div>
      </div>
    </motion.header>
  );
};
