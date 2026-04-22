"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Loader2, AlertCircle } from "lucide-react";
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

export default function LoginPage() {
  const router = useRouter();
  const [email,    setEmail]   = useState("");
  const [password, setPass]    = useState("");
  const [error,    setError]   = useState("");
  const [loading,  setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const r = await signIn("credentials", { email, password, redirect: false });
      if (r?.error) setError("Invalid email or password");
      else { router.push("/photos"); router.refresh(); }
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
            <h1 className="text-2xl font-medium">Sign in</h1>
            <p className="text-sm text-[--text-secondary] mt-1">to continue to PixelBox</p>
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

            <Field label="Email" icon={Mail} type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" required autoComplete="email" />
            <Field label="Password" icon={Lock} type="password" value={password} onChange={e => setPass(e.target.value)}
              placeholder="Your password" required autoComplete="current-password" />

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[--accent] text-white font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-opacity mt-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</> : "Sign in"}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-[--border]">
            <p className="text-center text-xs text-[--text-secondary]">
              Demo: <code className="text-[--text-primary]">demo@example.com</code> / <code className="text-[--text-primary]">demo123</code>
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-[--text-secondary] mt-5">
          Don't have an account?{" "}
          <Link href="/register" className="text-[--accent] hover:underline font-medium">Create one</Link>
        </p>
      </div>
    </div>
  );
}
