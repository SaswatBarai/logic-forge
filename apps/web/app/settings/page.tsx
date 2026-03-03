"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { User, Bell, Shield, Trash2, LogOut, Save } from "lucide-react";

type Tab = "profile" | "notifications" | "security" | "danger";

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "profile",       label: "Profile",       icon: <User size={14} /> },
  { id: "notifications", label: "Notifications",  icon: <Bell size={14} /> },
  { id: "security",      label: "Security",       icon: <Shield size={14} /> },
  { id: "danger",        label: "Danger Zone",    icon: <Trash2 size={14} /> },
];

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative w-10 h-5 border-2 border-foreground transition-colors ${enabled ? "bg-primary" : "bg-muted"}`}
    >
      <motion.div
        className="absolute top-0.5 w-3 h-3 bg-foreground border border-foreground"
        animate={{ left: enabled ? "calc(100% - 14px)" : "2px" }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  // Profile state
  const [displayName, setDisplayName] = useState(session?.user?.name || "");
  const [bio, setBio] = useState("");

  // Notification state
  const [notifs, setNotifs] = useState({
    matchStart:    true,
    roundResult:   true,
    newChallenge:  false,
    weeklyDigest:  true,
    marketing:     false,
  });

  // Security state
  const [twoFactor, setTwoFactor] = useState(false);

  const toggle = (key: keyof typeof notifs) =>
    setNotifs((prev) => ({ ...prev, [key]: !prev[key] }));

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
                    <p className="text-xs text-muted-foreground mt-1">Displayed publicly on your arena profile.</p>
                  </div>

                  <div className="p-6 flex flex-col gap-6">
                    {/* Avatar preview */}
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 border-2 border-foreground overflow-hidden shrink-0">
                        {session?.user?.image ? (
                          <img src={session.user.image} alt="avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full bg-primary flex items-center justify-center text-foreground font-black text-xl">
                            {(session?.user?.name?.[0] || "P").toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest">{session?.user?.name || "Player"}</p>
                        <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{session?.user?.email}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">Avatar synced from OAuth provider</p>
                      </div>
                    </div>

                    {/* Display Name */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black uppercase tracking-widest">Display Name</label>
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
                      className="arcade-btn bg-primary border-2 border-foreground shadow-retro px-6 py-3 text-xs font-black uppercase tracking-widest flex items-center gap-2 w-fit"
                      whileHover={{ scale: 1.03, boxShadow: "4px 4px 0px 0px hsl(var(--navy))" }}
                      whileTap={{ scale: 0.97, x: 2, y: 2, boxShadow: "0px 0px 0px 0px hsl(var(--navy))" }}
                    >
                      <Save size={14} /> Save Changes
                    </motion.button>
                  </div>
                </div>
              )}

              {/* ── NOTIFICATIONS ── */}
              {activeTab === "notifications" && (
                <div className="border-2 border-foreground bg-card shadow-retro flex flex-col">
                  <div className="p-5 border-b-2 border-foreground">
                    <h2 className="text-lg font-black uppercase tracking-tighter">Notifications</h2>
                    <p className="text-xs text-muted-foreground mt-1">Control what LogicForge sends you.</p>
                  </div>
                  <div className="flex flex-col divide-y-2 divide-foreground/10">
                    {[
                      { key: "matchStart",   label: "Match Start",     desc: "Get notified when your match begins." },
                      { key: "roundResult",  label: "Round Results",   desc: "Receive verdict and score after each round." },
                      { key: "newChallenge", label: "New Challenges",  desc: "Notify when new challenge sets are live." },
                      { key: "weeklyDigest", label: "Weekly Digest",   desc: "Summary of your weekly performance." },
                      { key: "marketing",    label: "Product Updates", desc: "News, features, and announcements." },
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
                      <p className="text-xs text-muted-foreground mt-1">Manage your account security settings.</p>
                    </div>
                    <div className="p-5 flex flex-col gap-5">

                      {/* OAuth info */}
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

                      {/* 2FA */}
                      <div className="flex items-center justify-between p-4 border-2 border-foreground bg-background">
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest">Two-Factor Auth</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Add an extra layer of security to your account.
                          </p>
                        </div>
                        <Toggle enabled={twoFactor} onChange={() => setTwoFactor(!twoFactor)} />
                      </div>

                      {/* Active sessions */}
                      <div className="p-4 border-2 border-foreground bg-background">
                        <p className="text-xs font-black uppercase tracking-widest mb-3">Active Sessions</p>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[11px] font-mono text-foreground">Current Session</p>
                            <p className="text-[10px] text-muted-foreground">Mumbai · ap-south-1 · Chrome</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
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
                    <h2 className="text-lg font-black uppercase tracking-tighter text-destructive">Danger Zone</h2>
                    <p className="text-xs text-muted-foreground mt-1">These actions are irreversible. Proceed with caution.</p>
                  </div>
                  <div className="p-5 flex flex-col gap-4">

                    {/* Sign out */}
                    <div className="flex items-center justify-between p-4 border-2 border-foreground bg-background">
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest">Sign Out</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">End your current session on this device.</p>
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

                    {/* Delete account */}
                    <div className="flex items-center justify-between p-4 border-2 border-destructive/50 bg-destructive/5">
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-destructive">Delete Account</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Permanently delete all your data, matches, and scores.</p>
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
