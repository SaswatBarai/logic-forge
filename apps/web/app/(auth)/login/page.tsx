"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Terminal, Lock, Mail, Github, ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [configError, setConfigError] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  // if (status === "authenticated") {
  //   return null; // Prevent rendering while redirecting
  // }

  useEffect(() => {
    setConfigError(searchParams.get("error") === "Configuration");
  }, [searchParams]);

  // Loading states for better UX
  const [isCredentialsLoading, setIsCredentialsLoading] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Combined loading state to disable all inputs/buttons if any process is active
  const isLoading = isCredentialsLoading || isGithubLoading || isGoogleLoading;

  // Handle standard Email/Password Login
  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCredentialsLoading(true);

    try {
      // Calls the 'credentials' provider configured in your auth.ts
      await signIn("credentials", {
        email,
        password,
        callbackUrl: "/dashboard", // Redirects here on success
      });
    } catch (error) {
      console.error("Login failed:", error);
      // Here you would typically set an error state to show a toast/message
    } finally {
      setIsCredentialsLoading(false);
    }
  };

  // Handle GitHub OAuth Login
  const handleGithubLogin = async () => {
    setIsGithubLoading(true);
    try {
      await signIn("github", { callbackUrl: "/dashboard" });
    } catch (error) {
      console.error("GitHub Auth failed:", error);
    } finally {
      setIsGithubLoading(false);
    }
  };

  // Handle Google OAuth Login
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (error) {
      console.error("Google Auth failed:", error);
    } finally {
      setIsGoogleLoading(false);
    }
  };

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
          className="w-full max-w-md relative z-10 my-10"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Terminal Window Wrapper */}
          <div className="bg-foreground rounded-xl p-1 shadow-retro-lg border-2 border-foreground">
            <div className="bg-card rounded-lg overflow-hidden flex flex-col h-full">
              
              {/* Terminal Header */}
              <div
                className="px-4 py-3 border-b-2 border-foreground flex justify-between items-center bg-black/40"
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
                <div className="text-[10px] sm:text-xs font-mono text-foreground/70 uppercase tracking-widest flex items-center gap-2">
                  <Terminal className="size-3" />
                  Auth_Gateway.exe
                </div>
                <div className="flex gap-1">
                  <div className="w-2 h-3 bg-primary border border-foreground" />
                  <div className="w-2 h-3 bg-primary border border-foreground" />
                  <div className="w-2 h-3 bg-foreground/20 border border-foreground" />
                </div>
              </div>

              {/* Login Form Content */}
              <div className="p-6 sm:p-8 flex flex-col gap-6 text-foreground">
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
                  <p className="text-sm font-mono text-foreground/70">
                    &gt; Enter credentials to access the arena.
                  </p>
                </div>

                {configError && (
                  <div className="rounded-lg border-2 border-destructive/50 bg-destructive/10 px-4 py-3 font-mono text-sm text-destructive">
                    <strong>Configuration error.</strong> Often caused by MongoDB auth (check MONGO_URL and server logs). See <code className="text-xs">docs/MONGO_AUTH_FIX.md</code>.
                  </div>
                )}

                <form className="flex flex-col gap-5" onSubmit={handleCredentialsLogin}>
                  {/* Email Input */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 font-mono">
                      <Mail className="size-3 text-primary" /> Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="dev@logicforge.io"
                      className="bg-background border-2 border-foreground p-3 font-mono text-sm text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-foreground/30 disabled:opacity-50"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Password Input */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 font-mono justify-between">
                      <div className="flex items-center gap-2">
                        <Lock className="size-3 text-primary" /> Password
                      </div>
                      <Link href="/forgot-password" className="text-foreground/70 hover:text-primary lowercase tracking-normal">
                        Forgot?
                      </Link>
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-background border-2 border-foreground p-3 font-mono text-sm text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-foreground/30 disabled:opacity-50"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    className="w-full arcade-btn bg-primary text-primary-foreground px-6 py-4 border-2 border-foreground shadow-retro text-lg font-black uppercase tracking-widest flex justify-center items-center gap-3 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    whileHover={!isLoading ? {
                      scale: 1.02,
                      boxShadow: "4px 4px 0px 0px hsl(var(--foreground))",
                    } : {}}
                    whileTap={!isLoading ? {
                      scale: 0.98,
                      x: 2,
                      y: 2,
                      boxShadow: "0px 0px 0px 0px hsl(var(--foreground))",
                    } : {}}
                  >
                    {isCredentialsLoading ? (
                      <>
                        <Loader2 className="size-5 animate-spin" /> 
                        Authenticating...
                      </>
                    ) : (
                      "Authenticate"
                    )}
                  </motion.button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-4 py-2">
                  <div className="flex-1 h-0.5 bg-foreground/30" />
                  <span className="font-mono text-xs font-bold uppercase tracking-widest text-foreground/50">
                    OR
                  </span>
                  <div className="flex-1 h-0.5 bg-foreground/30" />
                </div>

                {/* OAuth Providers */}
                <div className="flex flex-col gap-3">
                  <motion.button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full bg-background text-foreground px-6 py-3 border-2 border-foreground flex justify-center items-center gap-3 font-bold uppercase tracking-widest text-sm hover:bg-foreground/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={!isLoading ? { scale: 1.02 } : {}}
                    whileTap={!isLoading ? { scale: 0.98 } : {}}
                  >
                    {isGoogleLoading ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                    )}
                    {isGoogleLoading ? "Connecting..." : "Continue with Google"}
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={handleGithubLogin}
                    disabled={isLoading}
                    className="w-full bg-background text-foreground px-6 py-3 border-2 border-foreground flex justify-center items-center gap-3 font-bold uppercase tracking-widest text-sm hover:bg-foreground/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={!isLoading ? { scale: 1.02 } : {}}
                    whileTap={!isLoading ? { scale: 0.98 } : {}}
                  >
                    {isGithubLoading ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      <Github className="size-5" />
                    )}
                    {isGithubLoading ? "Connecting..." : "Continue with GitHub"}
                  </motion.button>
                </div>

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