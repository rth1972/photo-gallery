"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Users, X, Search, Trash2, Share2, Copy, Check, Image as ImageIcon } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PhotoRowGrid } from "@/components/PhotoRowGrid";
import { PhotoViewer } from "@/components/PhotoViewer";
import { SelectionBar } from "@/components/SelectionBar";
import { getAlbumById, getPhotosByAlbum, getAlbums } from "@/lib/data";
import { Photo, Album, Collaborator } from "@/types";

function patchPhoto(id: string, body: object) {
  return fetch(`/api/photos/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ─── Collaborators sheet ──────────────────────────────────────────────────────
function CollaboratorsSheet({
  albumId,
  collaborators,
  onUpdate,
  onClose,
}: {
  albumId: string;
  collaborators: Collaborator[];
  onUpdate: () => void;
  onClose: () => void;
}) {
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState<any[]>([]);

  const search = async (q: string) => {
    setQuery(q);
    if (q.length < 2) { setResults([]); return; }
    const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    const existing = new Set(collaborators.map(c => c.user.id));
    setResults((data ?? []).filter((u: any) => !existing.has(u.id)));
  };

  const add = async (user: any) => {
    await fetch(`/api/albums/${albumId}/collaborators`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, role: "editor" }),
    });
    setQuery(""); setResults([]);
    onUpdate();
  };

  const remove = async (collabId: string) => {
    await fetch(`/api/albums/${albumId}/collaborators?collaboratorId=${collabId}`, { method: "DELETE" });
    onUpdate();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[--surface] w-full max-w-md rounded-2xl p-6 border border-[--border] shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold">Collaborators</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-[--surfaceHover] flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
          <input
            type="text"
            placeholder="Search by email or name…"
            value={query}
            onChange={e => search(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[--surfaceHover] text-sm outline-none focus:ring-2 focus:ring-[--accent]"
          />
          {results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[--surfaceHover] rounded-xl border border-[--border] shadow-xl overflow-hidden z-10 max-h-48 overflow-y-auto">
              {results.map(u => (
                <button key={u.id} onClick={() => add(u)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[--border] transition-colors text-left">
                  <div className="w-8 h-8 rounded-full bg-[--accent] flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                    {(u.name?.[0] || u.email[0]).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{u.name}</p>
                    <p className="text-xs text-[--text-secondary] truncate">{u.email}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* List */}
        <div className="space-y-2">
          {collaborators.length === 0 ? (
            <p className="text-sm text-[--text-secondary] text-center py-4">No collaborators yet. Search above to add someone.</p>
          ) : (
            collaborators.map(c => (
              <div key={c.id} className="flex items-center justify-between p-2.5 rounded-xl bg-[--surfaceHover]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[--accent] flex items-center justify-center text-white text-sm font-medium">
                    {(c.user.name?.[0] || c.user.email[0]).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{c.user.name}</p>
                    <p className="text-xs text-[--text-secondary]">{c.user.email}</p>
                  </div>
                </div>
                <button onClick={() => remove(c.id)}
                  className="w-8 h-8 rounded-full hover:bg-red-500/15 flex items-center justify-center text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Share toast ──────────────────────────────────────────────────────────────
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
        <button onClick={copy} className="px-3 py-2 rounded-lg bg-[--accent] text-white text-xs flex items-center gap-1.5 flex-shrink-0">
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AlbumDetailPage() {
  const params  = useParams();
  const albumId = params.id as string;
  const { data: session, status } = useSession();
  const userId = status === "authenticated" ? (session?.user as any)?.id : "";

  const [album,         setAlbum]        = useState<Album | null>(null);
  const [photos,        setPhotos]       = useState<Photo[]>([]);
  const [allAlbums,     setAllAlbums]    = useState<Album[]>([]);
  const [viewerPhoto,   setViewer]       = useState<Photo | null>(null);
  const [selectedIds,   setSelected]     = useState<Set<string>>(new Set());
  const [collaborators, setCollaborators]= useState<Collaborator[]>([]);
  const [showCollabs,   setShowCollabs]  = useState(false);
  const [shareUrl,      setShareUrl]     = useState<string | null>(null);

  const load = useCallback(() => {
    if (!userId || !albumId) return;
    getAlbumById(userId, albumId).then(a => {
      setAlbum(a ?? null);
      setCollaborators(a?.collaborators ?? []);
    });
    getPhotosByAlbum(userId, albumId).then(setPhotos);
    getAlbums(userId).then(setAllAlbums);
  }, [userId, albumId]);

  useEffect(() => { if (userId && albumId) load(); }, [userId, albumId, load]);

  // ── Optimistic ────────────────────────────────────────────────────────────
  const optimistic = useCallback((id: string, patch: Partial<Photo>) => {
    setPhotos(p => p.map(x => x.id === id ? { ...x, ...patch } : x));
    setViewer(p => p?.id === id ? { ...p, ...patch } : p);
  }, []);

  const handleFavorite = useCallback(async (id: string) => {
    const p = photos.find(x => x.id === id); if (!p) return;
    optimistic(id, { favorite: !p.favorite });
    await patchPhoto(id, { action: "favorite", value: !p.favorite });
  }, [photos, optimistic]);

  const handleArchive = useCallback(async (id: string) => {
    const p = photos.find(x => x.id === id); if (!p) return;
    optimistic(id, { archive: !p.archive });
    await patchPhoto(id, { action: "archive", value: !p.archive });
  }, [photos, optimistic]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Move to trash?")) return;
    setPhotos(p => p.filter(x => x.id !== id)); setViewer(null);
    await fetch(`/api/photos/${id}`, { method: "DELETE" });
  }, []);

  const handleNavigate = useCallback((dir: "prev" | "next") => {
    if (!viewerPhoto) return;
    const idx = photos.findIndex(p => p.id === viewerPhoto.id);
    if (idx === -1) return;
    setViewer(photos[dir === "prev" ? Math.max(0, idx - 1) : Math.min(photos.length - 1, idx + 1)]);
  }, [viewerPhoto, photos]);

  const handleSelect = useCallback((photo: Photo) => {
    setSelected(prev => { const n = new Set(prev); n.has(photo.id) ? n.delete(photo.id) : n.add(photo.id); return n; });
  }, []);

  const handleBulkDelete = useCallback(async () => {
    const ids = Array.from(selectedIds);
    setPhotos(p => p.filter(x => !ids.includes(x.id))); setSelected(new Set());
    await Promise.all(ids.map(id => fetch(`/api/photos/${id}`, { method: "DELETE" })));
  }, [selectedIds]);

  const handleBulkFavorite = useCallback(async () => {
    const ids = Array.from(selectedIds);
    setPhotos(p => p.map(x => ids.includes(x.id) ? { ...x, favorite: true } : x)); setSelected(new Set());
    await Promise.all(ids.map(id => patchPhoto(id, { action: "favorite", value: true })));
  }, [selectedIds]);

  const handleBulkArchive = useCallback(async () => {
    const ids = Array.from(selectedIds);
    setPhotos(p => p.map(x => ids.includes(x.id) ? { ...x, archive: true } : x)); setSelected(new Set());
    await Promise.all(ids.map(id => patchPhoto(id, { action: "archive", value: true })));
  }, [selectedIds]);

  const handleMoveToAlbum = useCallback(async (targetAlbumId: string) => {
    const ids = Array.from(selectedIds);
    setSelected(new Set());
    await Promise.all(ids.map(id =>
      fetch(`/api/albums/${targetAlbumId}/photos`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoIds: [id] }),
      })
    ));
  }, [selectedIds]);

  const handleShare = async () => {
    const res = await fetch("/api/albums", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ albumId, action: "share" }),
    });
    const data = await res.json();
    if (data.album?.shareLink) setShareUrl(`${window.location.origin}/albums/shared/${data.album.shareLink}`);
    load();
  };

  if (status === "loading" || !userId) return null;

  if (!album) {
    return (
      <AppShell title="Album not found">
        <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-[--surfaceHover] flex items-center justify-center">
            <ImageIcon className="w-7 h-7 opacity-30" />
          </div>
          <p className="text-lg font-medium">Album not found</p>
          <Link href="/albums" className="text-sm text-[--accent] hover:underline">← Back to albums</Link>
        </div>
      </AppShell>
    );
  }

  const isOwner = album.userId === userId;

  return (
    <AppShell
      title={album.name}
      subtitle={`${photos.length} photo${photos.length !== 1 ? "s" : ""}`}
      headerActions={
        <div className="flex items-center gap-2 ml-4">
          <Link
            href="/albums"
            className="hidden md:flex items-center gap-1.5 text-sm text-[--text-secondary] hover:text-[--text-primary] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Albums
          </Link>
          {isOwner && (
            <>
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm hover:bg-[--surfaceHover] transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:block">Share</span>
              </button>
              <button
                onClick={() => setShowCollabs(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm hover:bg-[--surfaceHover] transition-colors"
              >
                <Users className="w-3.5 h-3.5" />
                <span className="hidden sm:block">
                  {collaborators.length > 0 ? `${collaborators.length} collaborator${collaborators.length !== 1 ? "s" : ""}` : "Add collaborators"}
                </span>
              </button>
            </>
          )}
        </div>
      }
    >
      {photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-[--surfaceHover] flex items-center justify-center">
            <ImageIcon className="w-7 h-7 opacity-30" />
          </div>
          <p className="text-lg font-medium">No photos in this album</p>
          <p className="text-sm text-[--text-secondary] max-w-xs">
            Add photos to this album from your main gallery.
          </p>
        </div>
      ) : (
        <PhotoRowGrid
          photos={photos}
          selectedIds={selectedIds}
          onSelect={handleSelect}
          onOpen={setViewer}
        />
      )}

      <SelectionBar
        selectedCount={selectedIds.size}
        onClear={() => setSelected(new Set())}
        onDelete={handleBulkDelete}
        onFavorite={handleBulkFavorite}
        onArchive={handleBulkArchive}
        onMoveToAlbum={handleMoveToAlbum}
        albums={allAlbums.filter(a => a.id !== albumId)}
        userId={userId}
      />

      <PhotoViewer
        photo={viewerPhoto}
        onClose={() => setViewer(null)}
        onNavigate={handleNavigate}
        onFavorite={handleFavorite}
        onArchive={handleArchive}
        onDelete={handleDelete}
      />

      {showCollabs && (
        <CollaboratorsSheet
          albumId={albumId}
          collaborators={collaborators}
          onUpdate={load}
          onClose={() => setShowCollabs(false)}
        />
      )}

      {shareUrl && <ShareToast url={shareUrl} onClose={() => setShareUrl(null)} />}
    </AppShell>
  );
}
