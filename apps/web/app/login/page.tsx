"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Terminal, Lock, Mail, Github, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex flex-col bg-background selection:bg-primary selection:text-primary-foreground">
      {/* Minimal Top Navigation */}
      <header className="absolute top-0 w-full p-6 z-50">
        <Link href="/">
          <motion.div
            className="inline-flex items-center gap-2 cursor-pointer text-foreground hover:text-primary transition-colors font-bold uppercase tracking-widest text-sm"
            whileHover={{ x: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="size-4" />
            <span>Abort Mission</span>
          </motion.div>
        </Link>
      </header>

      {/* Main Login Container */}
      <main className="flex-grow flex items-center justify-center p-6 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none grid-background" />

        <motion.div
          className="w-full max-w-md relative z-10"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Terminal Window Wrapper */}
          <div className="bg-foreground rounded-xl p-1 shadow-retro-lg border-2 border-foreground">
            <div className="bg-card rounded-lg overflow-hidden flex flex-col h-full">
              
              {/* Terminal Header */}
              <div
                className="px-4 py-3 border-b-2 border-foreground flex justify-between items-center bg-slate-100 dark:bg-slate-900"
              >
                <div className="flex gap-2">
                  <motion.div
                    className="size-3 rounded-full bg-destructive border border-foreground"
                    whileHover={{ scale: 1.2 }}
                  />
                  <motion.div
                    className="size-3 rounded-full bg-primary border border-foreground"
                    whileHover={{ scale: 1.2 }}
                  />
                  <motion.div
                    className="size-3 rounded-full bg-accent border border-foreground"
                    whileHover={{ scale: 1.2 }}
                  />
                </div>
                <div className="text-[10px] sm:text-xs font-mono text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Terminal className="size-3" />
                  Auth_Gateway.exe
                </div>
                <div className="flex gap-1">
                  <div className="w-2 h-3 bg-primary border border-foreground" />
                  <div className="w-2 h-3 bg-primary border border-foreground" />
                  <div className="w-2 h-3 bg-slate-700 border border-foreground" />
                </div>
              </div>

              {/* Login Form Content */}
              <div className="p-6 sm:p-8 flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter">
                    System Login
                    <motion.span
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="text-primary inline-block ml-1"
                    >
                      _
                    </motion.span>
                  </h1>
                  <p className="text-sm font-mono text-slate-500">
                    &gt; Enter credentials to access the arena.
                  </p>
                </div>

                <form className="flex flex-col gap-5" onSubmit={(e) => e.preventDefault()}>
                  {/* Email Input */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-foreground flex items-center gap-2 font-mono">
                      <Mail className="size-3 text-primary" /> Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="dev@logicforge.io"
                      className="bg-background border-2 border-foreground p-3 font-mono text-sm focus:outline-none focus:border-primary transition-colors placeholder:text-slate-400"
                    />
                  </div>

                  {/* Password Input */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-foreground flex items-center gap-2 font-mono justify-between">
                      <div className="flex items-center gap-2">
                        <Lock className="size-3 text-primary" /> Password
                      </div>
                      <a href="#" className="text-slate-500 hover:text-primary lowercase tracking-normal">
                        Forgot?
                      </a>
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="bg-background border-2 border-foreground p-3 font-mono text-sm focus:outline-none focus:border-primary transition-colors placeholder:text-slate-400"
                    />
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    className="w-full arcade-btn bg-primary px-6 py-4 border-2 border-foreground shadow-retro text-lg font-black uppercase tracking-widest flex justify-center items-center gap-3 mt-2"
                    whileHover={{
                      scale: 1.02,
                      boxShadow: "4px 4px 0px 0px hsl(var(--foreground))",
                    }}
                    whileTap={{
                      scale: 0.98,
                      x: 2,
                      y: 2,
                      boxShadow: "0px 0px 0px 0px hsl(var(--foreground))",
                    }}
                  >
                    Authenticate
                  </motion.button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-4 py-2">
                  <div className="flex-1 h-0.5 bg-foreground" />
                  <span className="font-mono text-xs font-bold uppercase tracking-widest text-slate-500">
                    OR
                  </span>
                  <div className="flex-1 h-0.5 bg-foreground" />
                </div>

                {/* OAuth Provider */}
                <motion.button
                  type="button"
                  className="w-full bg-background px-6 py-3 border-2 border-foreground flex justify-center items-center gap-3 font-bold uppercase tracking-widest text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Github className="size-5" />
                  Continue with GitHub
                </motion.button>

                {/* Footer Link */}
                <p className="text-center text-xs font-mono font-bold mt-2">
                  NEW RECRUIT?{" "}
                  <Link
                    href="/register"
                    className="text-primary uppercase underline decoration-2 underline-offset-4 hover:text-foreground transition-colors"
                  >
                    INITIATE SIGN UP
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}