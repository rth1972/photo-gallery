"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTheme } from "@/context/ThemeContext";
import { AppShell } from "@/components/AppShell";
import { getStorageUsage } from "@/lib/data";
import { User, Palette, HardDrive, Globe, Shield, Info, Loader2, Check, Sparkles } from "lucide-react";
import clsx from "clsx";

const TABS = [
  { id: "account",    label: "Account",    Icon: User    },
  { id: "appearance", label: "Appearance", Icon: Palette },
  { id: "storage",    label: "Storage",    Icon: HardDrive },
  { id: "server",     label: "Server",     Icon: Globe   },
  { id: "security",   label: "Security",   Icon: Shield  },
  { id: "about",      label: "About",      Icon: Info    },
];

function fmt(b: number) {
  if (!b) return "0 B";
  const u = ["B","KB","MB","GB","TB"];
  const i = Math.floor(Math.log(b) / Math.log(1024));
  return `${(b / Math.pow(1024, i)).toFixed(1)} ${u[i]}`;
}

function InputRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}

function inputCls(extra = "") {
  return `w-full max-w-md bg-[--surfaceHover] px-4 py-2.5 rounded-xl outline-none text-sm focus:ring-2 focus:ring-[--accent] ${extra}`;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;
  const { theme, setTheme } = useTheme();
const [tab,    setTab]    = useState("account");
  const [name,   setName]   = useState(session?.user?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [storageUsed,  setUsed]  = useState(0);
  const [storageLimit, setLimit] = useState(10_737_418_240);
  const [tagging, setTagging] = useState(false);
  const [taggedCount, setTaggedCount] = useState(0);

  useEffect(() => { if (session?.user?.name) setName(session.user.name); }, [session]);
  useEffect(() => { if (userId) getStorageUsage(userId).then(({ used, limit }) => { setUsed(used); setLimit(limit); }); }, [userId]);

  const handleGenerateTags = async () => {
    if (!userId || tagging) return;
    setTagging(true);
    const res = await fetch("/api/ai/batch-tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    setTaggedCount(data.tagged || 0);
    setTagging(false);
  };

  const handleSave = async () => {
    if (!session?.user?.email) return;
    setSaving(true);
    await fetch("/api/user/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const pct = Math.min((storageUsed / storageLimit) * 100, 100);

  return (
    <AppShell title="Settings">
      <div className="flex flex-col md:flex-row gap-6 max-w-4xl">
        {/* Tab list */}
        <div className="w-full md:w-48 flex-shrink-0">
          <nav className="space-y-0.5">
            {TABS.map(({ id, label, Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className={clsx(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors text-left",
                  tab === id
                    ? "bg-[--surfaceHover] font-medium"
                    : "text-[--text-secondary] hover:bg-[--surfaceHover]/60 hover:text-[--text-primary]"
                )}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Panel */}
        <div className="flex-1 bg-[--surface] rounded-2xl p-6 border border-[--border]">
          {tab === "account" && (
            <div className="space-y-5">
              <h2 className="text-base font-semibold">Account</h2>
              <InputRow label="Email">
                <input type="email" value={session?.user?.email ?? ""} disabled className={inputCls("opacity-50 cursor-not-allowed")} />
              </InputRow>
              <InputRow label="Display name">
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" className={inputCls()} />
              </InputRow>
            </div>
          )}

          {tab === "appearance" && (
            <div className="space-y-5">
              <h2 className="text-base font-semibold">Appearance</h2>
              <InputRow label="Theme">
                <div className="flex gap-2 flex-wrap">
                  {(["light","dark","system"] as const).map(t => (
                    <button key={t} onClick={() => setTheme(t)}
                      className={clsx(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm capitalize transition-colors border",
                        theme === t
                          ? "bg-[--accent] text-white border-[--accent]"
                          : "border-[--border] hover:bg-[--surfaceHover]"
                      )}>
                      {theme === t && <Check className="w-3.5 h-3.5" />}
                      {t}
                    </button>
                  ))}
                </div>
              </InputRow>
            </div>
          )}

          {tab === "storage" && (
            <div className="space-y-5">
              <h2 className="text-base font-semibold">Storage</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[--text-secondary]">Used</span>
                  <span className="font-medium">{fmt(storageUsed)} / {fmt(storageLimit)}</span>
                </div>
                <div className="h-2 rounded-full bg-[--surfaceHover] overflow-hidden">
                  <div className={clsx("h-full rounded-full transition-all", pct > 85 ? "bg-red-500" : "bg-[--accent]")}
                    style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-[--text-secondary]">{pct.toFixed(1)}% of storage used</p>
              </div>

              <div className="pt-4 border-t border-[--border]">
                <h3 className="text-sm font-medium mb-3">AI Image Tagging</h3>
                <p className="text-xs text-[--text-secondary] mb-3">
                  Generate AI tags for all your existing photos using Ollama llava model.
                </p>
                <button
                  onClick={handleGenerateTags}
                  disabled={tagging}
                  className={clsx(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                    tagging
                      ? "bg-[--surfaceHover] cursor-not-allowed"
                      : "bg-[--accent] hover:opacity-90 text-white"
                  )}
                >
                  {tagging ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating tags...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate All Tags</span>
                    </>
                  )}
                </button>
                {taggedCount > 0 && (
                  <p className="text-xs text-green-500 mt-2">Tagged {taggedCount} photos!</p>
                )}
              </div>
            </div>
          )}

          {tab === "server" && (
            <div className="space-y-5">
              <h2 className="text-base font-semibold">Server</h2>
              <InputRow label="Server URL">
                <input type="text" defaultValue="http://localhost:3000" className={inputCls()} />
              </InputRow>
              <InputRow label="API Key">
                <input type="password" defaultValue="your-api-key" className={inputCls()} />
              </InputRow>
            </div>
          )}

          {tab === "security" && (
            <div className="space-y-5">
              <h2 className="text-base font-semibold">Security</h2>
              <div className="flex items-center justify-between p-4 rounded-xl bg-[--surfaceHover]/50 border border-[--border]">
                <div>
                  <p className="text-sm font-medium">Two-factor authentication</p>
                  <p className="text-xs text-[--text-secondary] mt-0.5">Add an extra layer of security to your account.</p>
                </div>
                <button className="px-4 py-2 rounded-xl bg-[--accent] text-white text-sm hover:opacity-90">
                  Enable
                </button>
              </div>
            </div>
          )}

          {tab === "about" && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold">About</h2>
              <div className="space-y-2 text-sm text-[--text-secondary]">
                <p><span className="text-[--text-primary] font-medium">PixelBox</span> v0.1.0</p>
                <p>Built with Next.js 14, Prisma, and NextAuth.</p>
                <p>A self-hosted Google Photos alternative.</p>
              </div>
            </div>
          )}

          {/* Save button */}
          <div className="mt-8 pt-5 border-t border-[--border]">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[--accent] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> :
               saved  ? <><Check className="w-4 h-4" /> Saved</> :
               "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
