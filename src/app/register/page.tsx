"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User, Loader2, AlertCircle } from "lucide-react";
import { PixelBoxLogo } from "@/components/AppShell";

function Field({ label, icon: Icon, ...props }: { label: string; icon: React.ComponentType<any> } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--text-secondary]" />
        <input {...props} className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[--surfaceHover] outline-none focus:ring-2 focus:ring-[--accent] text-sm" />
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [name,     setName]    = useState("");
  const [email,    setEmail]   = useState("");
  const [password, setPass]    = useState("");
  const [error,    setError]   = useState("");
  const [loading,  setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    if (password.length < 6) { setError("Password must be at least 6 characters"); setLoading(false); return; }
    try {
      const res = await fetch("/api/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Registration failed"); return; }
      await signIn("credentials", { email, password, redirect: false });
      router.push("/photos"); router.refresh();
    } catch { setError("An error occurred"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[--background] p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <PixelBoxLogo size={48} />
          <div className="text-center">
            <h1 className="text-2xl font-medium">Create account</h1>
            <p className="text-sm text-[--text-secondary] mt-1">Join PixelBox — free forever</p>
          </div>
        </div>

        <div className="bg-[--surface] rounded-2xl p-6 border border-[--border]">
          <form onSubmit={submit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 text-red-400 text-sm border border-red-500/20">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Field label="Name" icon={User} type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Your name" required autoComplete="name" />
            <Field label="Email" icon={Mail} type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" required autoComplete="email" />
            <Field label="Password" icon={Lock} type="password" value={password} onChange={e => setPass(e.target.value)}
              placeholder="Min 6 characters" required autoComplete="new-password" />

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[--accent] text-white font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-opacity mt-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</> : "Create account"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[--text-secondary] mt-5">
          Already have an account?{" "}
          <Link href="/login" className="text-[--accent] hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
