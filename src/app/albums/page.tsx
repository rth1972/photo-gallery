"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Folder, MoreVertical, Share2, Trash2, X, Check, Copy } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { AppShell } from "@/components/AppShell";
import { getAlbums } from "@/lib/data";
import { Album } from "@/types";

function patchAlbum(body: object) {
  return fetch("/api/albums", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}

function CreateModal({ userId, onDone, onClose }: { userId: string; onDone: () => void; onClose: () => void }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim()) return;
    setBusy(true);
    await fetch("/api/albums", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, name: name.trim() }) });
    setBusy(false);
    onDone();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.96 }} animate={{ scale: 1 }} exit={{ scale: 0.96 }}
        className="bg-[--surface] rounded-2xl p-6 w-full max-w-sm border border-[--border]"
        onClick={e => e.stopPropagation()}>
        <h3 className="text-base font-semibold mb-4">New album</h3>
        <input autoFocus value={name} onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()}
          placeholder="Album name"
          className="w-full px-4 py-2.5 rounded-xl bg-[--surfaceHover] outline-none focus:ring-2 focus:ring-[--accent] text-sm mb-4" />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl hover:bg-[--surfaceHover] text-sm transition-colors">Cancel</button>
          <button onClick={submit} disabled={busy || !name.trim()}
            className="flex-1 py-2 rounded-xl bg-[--accent] text-white text-sm disabled:opacity-50 hover:opacity-90 transition-opacity">
            {busy ? "Creating…" : "Create"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ShareToast({ url, onClose }: { url: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-[--surface] border border-[--border] rounded-2xl p-4 shadow-2xl w-80">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium">Share link ready</span>
        <button onClick={onClose}><X className="w-4 h-4 opacity-50" /></button>
      </div>
      <div className="flex gap-2">
        <input readOnly value={url} className="flex-1 text-xs bg-[--surfaceHover] rounded-lg px-3 py-2 outline-none truncate" />
        <button onClick={copy} className="px-3 py-2 rounded-lg bg-[--accent] text-white text-xs flex items-center gap-1">
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}

function AlbumCard({ album, onUpdate }: { album: Album; onUpdate: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const share = async () => {
    const res = await patchAlbum({ albumId: album.id, action: "share" });
    const data = await res.json();
    if (data.album?.shareLink) setShareUrl(`${window.location.origin}/albums/shared/${data.album.shareLink}`);
    setMenuOpen(false);
    onUpdate();
  };

  const unshare = async () => {
    await patchAlbum({ albumId: album.id, action: "unshare" });
    setMenuOpen(false);
    onUpdate();
  };

  const del = async () => {
    if (!confirm("Delete this album? Photos won't be deleted.")) return;
    await fetch(`/api/albums?albumId=${album.id}`, { method: "DELETE" });
    setMenuOpen(false);
    onUpdate();
  };

  return (
    <div className="group relative">
      <Link href={`/albums/${album.id}`} className="block">
        <div className="aspect-square rounded-2xl overflow-hidden bg-[--surfaceHover] relative">
          {album.coverPhoto ? (
            <Image src={album.coverPhoto} alt={album.name} fill sizes="(max-width: 640px) 50vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Folder className="w-10 h-10 opacity-20" />
            </div>
          )}
          {album.isShared && (
            <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-[--accent] flex items-center justify-center">
              <Share2 className="w-3 h-3 text-white" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <span className="text-xs text-white">{album.photoCount} photos</span>
            </div>
          </div>
        </div>
        <div className="mt-2 flex items-start justify-between gap-1">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{album.name}</p>
            <p className="text-xs text-[--text-secondary]">
              {album.photoCount} · {new Date(album.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </p>
          </div>
          <div className="relative flex-shrink-0">
            <button
              onClick={e => { e.preventDefault(); setMenuOpen(v => !v); }}
              className="w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-[--surfaceHover] transition-all"
            >
              <MoreVertical className="w-4 h-4 opacity-60" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-[--surface] rounded-xl border border-[--border] shadow-xl py-1 z-20" onClick={e => e.preventDefault()}>
                <button onClick={share} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[--surfaceHover]">
                  <Share2 className="w-4 h-4" /> Share
                </button>
                {album.isShared && (
                  <button onClick={unshare} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[--surfaceHover] opacity-60">
                    <X className="w-4 h-4" /> Stop sharing
                  </button>
                )}
                <div className="my-1 border-t border-[--border]" />
                <button onClick={del} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-red-500/10 text-red-400">
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </Link>
      {shareUrl && <ShareToast url={shareUrl} onClose={() => setShareUrl(null)} />}
    </div>
  );
}

export default function AlbumsPage() {
  const { data: session, status } = useSession();
  const userId = status === "authenticated" ? (session?.user as any)?.id : "";
  const [albums, setAlbums]      = useState<Album[]>([]);
  const [creating, setCreating]  = useState(false);

  const load = useCallback(() => { if (userId) getAlbums(userId).then(setAlbums); }, [userId]);
  useEffect(() => { load(); }, [load]);

  if (status === "loading" || !userId) return null;

  return (
    <AppShell
      title="Albums"
      subtitle={albums.length ? `${albums.length} albums` : undefined}
      headerActions={
        <button onClick={() => setCreating(true)}
          className="ml-4 flex items-center gap-1.5 px-4 py-2 rounded-full bg-[--accent] text-white text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> New album
        </button>
      }
    >
      {albums.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-[--surfaceHover] flex items-center justify-center">
            <Folder className="w-7 h-7 opacity-30" />
          </div>
          <p className="text-lg font-medium">No albums yet</p>
          <p className="text-sm text-[--text-secondary] max-w-xs">Create albums to organise your photos into collections.</p>
          <button onClick={() => setCreating(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[--accent] text-white rounded-full text-sm font-medium hover:opacity-90">
            <Plus className="w-4 h-4" /> Create album
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {albums.map(album => (
            <AlbumCard key={album.id} album={album} onUpdate={load} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {creating && <CreateModal userId={userId} onDone={() => { setCreating(false); load(); }} onClose={() => setCreating(false)} />}
      </AnimatePresence>
    </AppShell>
  );
}
