"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { User, Bell, Shield, Trash2, LogOut, Save, Volume2, VolumeX } from "lucide-react";

type Tab = "profile" | "notifications" | "security" | "danger";

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "profile",       label: "Profile",       icon: <User size={14} />   },
  { id: "notifications", label: "Notifications", icon: <Bell size={14} />   },
  { id: "security",      label: "Security",      icon: <Shield size={14} /> },
  { id: "danger",        label: "Danger Zone",   icon: <Trash2 size={14} /> },
];

const SFX_KEY   = "lf_sfx_enabled";
const NOTIF_KEY = "lf_notifications";

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative w-10 h-5 border-2 border-foreground transition-colors ${
        enabled ? "bg-primary" : "bg-muted"
      }`}
    >
      <motion.div
        className="absolute top-0.5 w-3 h-3 bg-foreground border border-foreground"
        animate={{ left: enabled ? "calc(100% - 14px)" : "2px" }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

// SFX Preview — plays a quick chime on enable using WebAudio
function playSFXPreview() {
  try {
    const ctx   = new (window.AudioContext || (window as any).webkitAudioContext)();
    const notes = [523, 659, 784];
    notes.forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "square";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.3);
      osc.start(ctx.currentTime + i * 0.1);
      osc.stop(ctx.currentTime + i * 0.1 + 0.35);
    });
  } catch {}
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  // Profile state
  const [displayName, setDisplayName] = useState(
    (session?.user as any)?.displayName || session?.user?.name || ""
  );
  const [bio, setBio]                     = useState((session?.user as any)?.bio || "");
  const [saving, setSaving]               = useState(false);
  const [message, setMessage]             = useState<string | null>(null);
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Notification + SFX state
  const [notifs, setNotifs] = useState({
    matchStart:   true,
    roundResult:  true,
    newChallenge: false,
    weeklyDigest: true,
    marketing:    false,
  });

  // ── SFX preference — read from localStorage ──────────────────────────────
  const [sfxEnabled, setSfxEnabled] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(SFX_KEY);
    setSfxEnabled(stored === null ? true : stored === "true");
  }, []);

  const toggleSFX = () => {
    setSfxEnabled(prev => {
      const next = !prev;
      localStorage.setItem(SFX_KEY, String(next));
      // Play preview chime only when turning ON
      if (next) playSFXPreview();
      return next;
    });
  };

  // Security state
  const [twoFactor, setTwoFactor] = useState(false);

  const toggle = (key: keyof typeof notifs) =>
    setNotifs(prev => ({ ...prev, [key]: !prev[key] }));

  // Load profile from backend once
  useEffect(() => {
    if (initialLoaded) return;
    (async () => {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) { setInitialLoaded(true); return; }
        const data = await res.json();
        setDisplayName(data.displayName ?? "");
        setBio(data.bio ?? "");
        setInitialLoaded(true);
      } catch {
        setInitialLoaded(true);
      }
    })();
  }, [initialLoaded]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12 flex flex-col gap-8">

        {/* Page Header */}
        <div className="flex flex-col gap-1 border-b-2 border-foreground pb-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary w-3 h-3 border border-foreground" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
              Account
            </span>
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tighter">Settings</h1>
        </div>

        <div className="flex flex-col md:flex-row gap-8">

          {/* Sidebar */}
          <aside className="md:w-48 flex md:flex-col gap-1 shrink-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-widest border-2 transition-all text-left
                  ${activeTab === tab.id
                    ? "bg-primary border-foreground shadow-retro-sm text-foreground"
                    : "bg-card border-transparent hover:border-foreground/40 text-muted-foreground hover:text-foreground"
                  } ${tab.id === "danger" ? "mt-auto text-destructive" : ""}`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </aside>

          {/* Content */}
          <div className="flex-1">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >

              {/* ── PROFILE ── */}
              {activeTab === "profile" && (
                <div className="border-2 border-foreground bg-card shadow-retro flex flex-col">
                  <div className="p-5 border-b-2 border-foreground">
                    <h2 className="text-lg font-black uppercase tracking-tighter">Profile Info</h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      Displayed publicly on your arena profile.
                    </p>
                  </div>
                  <div className="p-6 flex flex-col gap-6">
                    {/* Avatar */}
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 border-2 border-foreground overflow-hidden shrink-0">
                        {session?.user?.image ? (
                          <img src={session.user.image} alt="avatar"
                            className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full bg-primary flex items-center justify-center text-foreground font-black text-xl">
                            {(session?.user?.name?.[0] || "P").toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest">
                          {session?.user?.name || "Player"}
                        </p>
                        <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                          {session?.user?.email}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Avatar synced from OAuth provider
                        </p>
                      </div>
                    </div>

                    {/* Display Name */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black uppercase tracking-widest">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Enter display name..."
                        className="bg-background border-2 border-foreground px-4 py-3 text-sm font-mono outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
                      />
                    </div>

                    {/* Bio */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black uppercase tracking-widest">Bio</label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="A short bio about yourself..."
                        rows={3}
                        className="bg-background border-2 border-foreground px-4 py-3 text-sm font-mono outline-none focus:border-primary transition-colors resize-none placeholder:text-muted-foreground"
                      />
                    </div>

                    <motion.button
                      onClick={async () => {
                        try {
                          setSaving(true); setMessage(null);
                          const res = await fetch("/api/profile", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ displayName, bio }),
                          });
                          if (!res.ok) {
                            const data = await res.json().catch(() => ({}));
                            setMessage(data.error || "Failed to save changes");
                            return;
                          }
                          setMessage("Saved successfully");
                        } catch {
                          setMessage("Something went wrong");
                        } finally {
                          setSaving(false);
                        }
                      }}
                      disabled={saving}
                      className="arcade-btn bg-primary border-2 border-foreground shadow-retro px-6 py-3 text-xs font-black uppercase tracking-widest flex items-center gap-2 w-fit disabled:opacity-60"
                      whileHover={!saving ? { scale: 1.03, boxShadow: "4px 4px 0px 0px hsl(var(--navy))" } : {}}
                      whileTap={!saving ? { scale: 0.97, x: 2, y: 2, boxShadow: "0px 0px 0px 0px hsl(var(--navy))" } : {}}
                    >
                      <Save size={14} />
                      {saving ? "Saving..." : "Save Changes"}
                    </motion.button>

                    {message && (
                      <p className={`text-[10px] mt-2 font-mono ${
                        message.includes("success") ? "text-accent" : "text-destructive"
                      }`}>
                        {message.includes("success") ? "✓ " : "✗ "}{message}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* ── NOTIFICATIONS ── */}
              {activeTab === "notifications" && (
                <div className="border-2 border-foreground bg-card shadow-retro flex flex-col">
                  <div className="p-5 border-b-2 border-foreground">
                    <h2 className="text-lg font-black uppercase tracking-tighter">Notifications</h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      Control what LogicForge sends you.
                    </p>
                  </div>

                  <div className="flex flex-col divide-y-2 divide-foreground/10">

                    {/* ── SOUND EFFECTS TOGGLE (new) ── */}
                    <div className="flex items-center justify-between p-5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          {/* Icon swaps based on state */}
                          <motion.div
                            key={String(sfxEnabled)}
                            initial={{ scale: 0.7, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 20 }}
                          >
                            {sfxEnabled
                              ? <Volume2 size={14} className="text-primary" />
                              : <VolumeX size={14} className="text-muted-foreground" />
                            }
                          </motion.div>
                          <p className="text-xs font-black uppercase tracking-widest">
                            Sound Effects
                          </p>
                          {/* Live status badge */}
                          <motion.div
                            className={`px-2 py-0.5 border text-[8px] font-black uppercase tracking-widest ${
                              sfxEnabled
                                ? "border-accent text-accent"
                                : "border-muted-foreground text-muted-foreground"
                            }`}
                            animate={{ opacity: sfxEnabled ? [1, 0.6, 1] : 1 }}
                            transition={{ repeat: sfxEnabled ? Infinity : 0, duration: 2 }}
                          >
                            {sfxEnabled ? "ON" : "OFF"}
                          </motion.div>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          Boot chime, UI beeps, and arena sound effects.
                          {sfxEnabled && (
                            <motion.span
                              className="ml-2 text-accent font-bold"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                            >
                              Preview played on enable.
                            </motion.span>
                          )}
                        </p>
                        {/* Visual equalizer bars when ON */}
                        {sfxEnabled && (
                          <div className="flex items-end gap-0.5 mt-1 h-3">
                            {[3, 5, 4, 7, 5, 3, 6, 4].map((h, i) => (
                              <motion.div
                                key={i}
                                className="w-1 bg-primary/50"
                                animate={{ height: [`${h * 2}px`, `${h * 4}px`, `${h * 2}px`] }}
                                transition={{
                                  repeat: Infinity,
                                  duration: 0.6 + i * 0.1,
                                  ease: "easeInOut",
                                  delay: i * 0.07,
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <Toggle enabled={sfxEnabled} onChange={toggleSFX} />
                    </div>

                    {/* Existing notification toggles */}
                    {[
                      { key: "matchStart",   label: "Match Start",    desc: "Get notified when your match begins."           },
                      { key: "roundResult",  label: "Round Results",  desc: "Receive verdict and score after each round."    },
                      { key: "newChallenge", label: "New Challenges", desc: "Notify when new challenge sets are live."       },
                      { key: "weeklyDigest", label: "Weekly Digest",  desc: "Summary of your weekly performance."           },
                      { key: "marketing",    label: "Product Updates", desc: "News, features, and announcements."           },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-5">
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest">{item.label}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</p>
                        </div>
                        <Toggle
                          enabled={notifs[item.key as keyof typeof notifs]}
                          onChange={() => toggle(item.key as keyof typeof notifs)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── SECURITY ── */}
              {activeTab === "security" && (
                <div className="flex flex-col gap-4">
                  <div className="border-2 border-foreground bg-card shadow-retro">
                    <div className="p-5 border-b-2 border-foreground">
                      <h2 className="text-lg font-black uppercase tracking-tighter">Security</h2>
                      <p className="text-xs text-muted-foreground mt-1">
                        Manage your account security settings.
                      </p>
                    </div>
                    <div className="p-5 flex flex-col gap-5">
                      <div className="flex items-center justify-between p-4 border-2 border-foreground bg-background">
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest">Login Method</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Authenticated via OAuth — no password stored.
                          </p>
                        </div>
                        <div className="border border-accent px-3 py-1">
                          <span className="text-[9px] font-black uppercase tracking-widest text-accent">OAuth</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 border-2 border-foreground bg-background">
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest">Two-Factor Auth</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Add an extra layer of security to your account.
                          </p>
                        </div>
                        <Toggle enabled={twoFactor} onChange={() => setTwoFactor(!twoFactor)} />
                      </div>

                      <div className="p-4 border-2 border-foreground bg-background">
                        <p className="text-xs font-black uppercase tracking-widest mb-3">Active Sessions</p>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[11px] font-mono text-foreground">Current Session</p>
                            <p className="text-[10px] text-muted-foreground">Mumbai · ap-south-1 · Chrome</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <motion.div
                              className="w-1.5 h-1.5 rounded-full bg-accent"
                              animate={{ scale: [1, 1.4, 1] }}
                              transition={{ repeat: Infinity, duration: 1.2 }}
                            />
                            <span className="text-[9px] font-black uppercase tracking-widest text-accent">Active</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── DANGER ZONE ── */}
              {activeTab === "danger" && (
                <div className="border-2 border-destructive bg-card shadow-[4px_4px_0px_0px_hsl(var(--destructive))]">
                  <div className="p-5 border-b-2 border-destructive bg-destructive/5">
                    <h2 className="text-lg font-black uppercase tracking-tighter text-destructive">
                      Danger Zone
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      These actions are irreversible. Proceed with caution.
                    </p>
                  </div>
                  <div className="p-5 flex flex-col gap-4">
                    <div className="flex items-center justify-between p-4 border-2 border-foreground bg-background">
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest">Sign Out</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          End your current session on this device.
                        </p>
                      </div>
                      <motion.button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="flex items-center gap-2 bg-card border-2 border-foreground px-4 py-2 text-xs font-black uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <LogOut size={13} /> Disconnect
                      </motion.button>
                    </div>

                    <div className="flex items-center justify-between p-4 border-2 border-destructive/50 bg-destructive/5">
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-destructive">
                          Delete Account
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Permanently delete all your data, matches, and scores.
                        </p>
                      </div>
                      <motion.button
                        className="flex items-center gap-2 bg-destructive border-2 border-destructive px-4 py-2 text-xs font-black uppercase tracking-widest text-destructive-foreground"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <Trash2 size={13} /> Delete
                      </motion.button>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
