"use client";

import Link from "next/link";
import { motion, useSpring, useMotionValue } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import { LogOut, LayoutDashboard, Settings } from "lucide-react";
import { useRef, useCallback, useState } from "react";
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useScrollShrink, useMagnetic } from "@/hooks/useMicroInteractions";

// Animated underline nav link
function NavLink({ label, href, delay }: { label: string; href: string; delay: number }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Link
        href={href}
        className="relative text-xs font-black uppercase tracking-widest hover:text-primary transition-colors group"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {label}
        {/* Sliding underline */}
        <motion.span
          className="absolute -bottom-0.5 left-0 h-[2px] bg-primary"
          initial={{ width: "0%" }}
          animate={{ width: hovered ? "100%" : "0%" }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </Link>
    </motion.div>
  );
}

export const Navbar = () => {
  const { data: session, status } = useSession();
  const scrolled = useScrollShrink();
  const magnetic = useMagnetic(0.3);

  return (
    <motion.header
      className="sticky top-0 z-50 px-6 border-b-2 border-foreground bg-background/95 backdrop-blur-sm transition-all duration-300"
      style={{ paddingTop: scrolled ? "10px" : "16px", paddingBottom: scrolled ? "10px" : "16px" }}
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        {/* Logo with tilt */}
        <Link href="/">
          <motion.div
            className="flex items-center gap-2 cursor-pointer"
            whileHover={{ scale: 1.04, rotateZ: -0.8 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <motion.div
              className="bg-primary px-2 py-1 border-2 border-foreground shadow-retro-sm"
              whileHover={{ rotate: [0, -3, 3, 0] }}
              transition={{ duration: 0.3 }}
            >
              <span className="text-foreground font-black text-sm tracking-widest">LF</span>
            </motion.div>
            <h1 className="text-xl font-black tracking-tighter uppercase">LogicForge</h1>
            <motion.span
              className="text-primary font-mono text-lg font-black"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            >_</motion.span>
          </motion.div>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-10">
          {[
            { label: "How It Works", href: "/#how",        delay: 0.3 },
            { label: "Challenges",   href: "/#categories", delay: 0.4 },
            { label: "Story Mode",   href: "/story",       delay: 0.5 },
            { label: "Pricing",      href: "/#",           delay: 0.6 },
          ].map(item => (
            <NavLink key={item.label} {...item} />
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {/* Live badge */}
          <motion.div
            className="hidden md:flex items-center gap-1.5 border border-accent px-3 py-1"
            whileHover={{ borderColor: "hsl(var(--accent))", scale: 1.04 }}
            transition={{ duration: 0.15 }}
          >
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-accent"
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.4, 1] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
            />
            <span className="text-[9px] font-black uppercase tracking-widest text-accent">Live</span>
          </motion.div>

          {status === "authenticated" ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button
                  className="flex items-center gap-2 bg-card border-2 border-foreground px-3 py-1.5 shadow-retro-sm outline-none"
                  whileHover={{ scale: 1.04, boxShadow: "4px 4px 0px 0px hsl(var(--navy))" }}
                  whileTap={{ scale: 0.95, x: 2, y: 2, boxShadow: "0px 0px 0px 0px hsl(var(--navy))" }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <div className="w-7 h-7 border-2 border-foreground shrink-0 overflow-hidden">
                    {session?.user?.image ? (
                      <img src={session.user.image} alt={session.user.name || "Player"}
                        className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full bg-primary flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                          fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
              <DropdownMenuContent align="end"
                className="w-60 border-2 border-foreground rounded-none shadow-retro-md bg-card p-0 mt-2">
                <div className="p-3 border-b-2 border-foreground bg-background flex items-center gap-3">
                  <div className="w-10 h-10 border-2 border-foreground shrink-0 overflow-hidden">
                    {session?.user?.image ? (
                      <img src={session.user.image} alt={session.user.name || "Player"}
                        className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
                <div className="p-2 flex flex-col gap-1">
                  {[
                    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
                    { href: "/settings",  icon: Settings,        label: "Settings"  },
                  ].map(({ href, icon: Icon, label }) => (
                    <Link href={href} key={label}>
                      <DropdownMenuItem className="cursor-pointer text-xs font-bold uppercase tracking-widest rounded-none focus:bg-primary focus:text-foreground group">
                        <motion.span
                          className="flex items-center gap-2 w-full"
                          whileHover={{ x: 3 }}
                          transition={{ duration: 0.15 }}
                        >
                          <Icon className="w-4 h-4" />{label}
                        </motion.span>
                      </DropdownMenuItem>
                    </Link>
                  ))}
                </div>
                <div className="border-t-2 border-foreground p-2">
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="cursor-pointer text-xs font-bold uppercase tracking-widest text-destructive rounded-none focus:bg-destructive focus:text-destructive-foreground"
                  >
                    <motion.span
                      className="flex items-center gap-2 w-full"
                      whileHover={{ x: 3 }}
                      transition={{ duration: 0.15 }}
                    >
                      <LogOut className="w-4 h-4" /> Disconnect
                    </motion.span>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              {/* Magnetic Press Start button */}
              <motion.button
                ref={magnetic.ref as any}
                className="arcade-btn bg-primary px-6 py-2 border-2 border-foreground shadow-retro text-xs font-black uppercase tracking-widest relative overflow-hidden"
                style={{ x: magnetic.x, y: magnetic.y }}
                onMouseMove={magnetic.onMouseMove}
                onMouseLeave={magnetic.onMouseLeave}
                whileHover={{ scale: 1.06, boxShadow: "6px 6px 0px 0px hsl(var(--navy))" }}
                whileTap={{ scale: 0.95, x: 2, y: 2, boxShadow: "0px 0px 0px 0px hsl(var(--navy))" }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                {/* Shimmer on hover */}
                <motion.span
                  className="absolute inset-0 bg-white/20 skew-x-12 -translate-x-full pointer-events-none"
                  whileHover={{ translateX: "200%" }}
                  transition={{ duration: 0.4 }}
                />
                Press Start
              </motion.button>
            </Link>
          )}
        </div>
      </div>
    </motion.header>
  );
};
