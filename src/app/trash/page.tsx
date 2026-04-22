"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { Trash2, RotateCcw, AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PhotoViewer } from "@/components/PhotoViewer";
import { PhotoRowGrid } from "@/components/PhotoRowGrid";
import { getPhotos } from "@/lib/data";
import { Photo } from "@/types";

export default function TrashPage() {
  const { data: session, status } = useSession();
  const userId = status === "authenticated" ? (session?.user as any)?.id : "";
  const [photos, setPhotos]        = useState<Photo[]>([]);
  const [viewerPhoto, setViewer]   = useState<Photo | null>(null);
  const [selectedIds, setSelected] = useState<Set<string>>(new Set());

  const load = useCallback(() => {
    if (userId) getPhotos(userId, { trash: true }).then(setPhotos);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const handleSelect = useCallback((photo: Photo) => {
    setSelected(prev => { const n = new Set(prev); n.has(photo.id) ? n.delete(photo.id) : n.add(photo.id); return n; });
  }, []);

  const handleRestore = useCallback(async (ids: string[]) => {
    setPhotos(p => p.filter(x => !ids.includes(x.id)));
    setSelected(new Set());
    await Promise.all(ids.map(id =>
      fetch(`/api/photos/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "restore" }) })
    ));
  }, []);

  const handleDeleteForever = useCallback(async (ids: string[]) => {
    if (!confirm(`Permanently delete ${ids.length} photo${ids.length !== 1 ? "s" : ""}? This cannot be undone.`)) return;
    setPhotos(p => p.filter(x => !ids.includes(x.id)));
    setSelected(new Set());
    await Promise.all(ids.map(id => fetch(`/api/photos/${id}?permanent=true`, { method: "DELETE" })));
  }, []);

  const daysLeft = (deletedAt: string) => {
    const expiry = new Date(new Date(deletedAt).getTime() + 30 * 86400000);
    return Math.max(0, Math.ceil((expiry.getTime() - Date.now()) / 86400000));
  };

  const handleNavigate = useCallback((dir: "prev" | "next") => {
    if (!viewerPhoto) return;
    const idx = photos.findIndex(p => p.id === viewerPhoto.id);
    if (idx === -1) return;
    setViewer(photos[dir === "prev" ? Math.max(0, idx - 1) : Math.min(photos.length - 1, idx + 1)]);
  }, [viewerPhoto, photos]);

  if (status === "loading" || !userId) return null;

  const selectedArr = Array.from(selectedIds);

  return (
    <AppShell
      title="Trash"
      subtitle={photos.length ? `${photos.length} items` : undefined}
      headerActions={
        photos.length > 0 ? (
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={() => handleRestore(photos.map(p => p.id))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm hover:bg-[--surfaceHover] transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Restore all
            </button>
            <button
              onClick={() => handleDeleteForever(photos.map(p => p.id))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Empty trash
            </button>
          </div>
        ) : undefined
      }
    >
      {photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-[--surfaceHover] flex items-center justify-center">
            <Trash2 className="w-7 h-7 opacity-30" />
          </div>
          <p className="text-lg font-medium">Trash is empty</p>
          <p className="text-sm text-[--text-secondary] max-w-xs">
            Deleted photos are kept here for 30 days before being permanently removed.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 ml-2" />
            <span>Items in trash are permanently deleted after 30 days.</span>
          </div>

          <PhotoRowGrid photos={photos} selectedIds={selectedIds} onSelect={handleSelect} onOpen={setViewer} />
        </div>
      )}

      {/* Selection actions */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <div className="flex items-center gap-1 px-2 py-2 rounded-2xl bg-[--surface] border border-[--border] shadow-2xl shadow-black/40">
            <span className="text-sm font-semibold px-3 border-r border-[--border] mr-1">
              {selectedIds.size} selected
            </span>
            <button onClick={() => setSelected(new Set())} className="px-3 py-2 text-sm hover:bg-[--surfaceHover] rounded-xl">
              Clear
            </button>
            <button
              onClick={() => handleRestore(selectedArr)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-[--accent] text-white hover:opacity-90 rounded-xl"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Restore
            </button>
            <button
              onClick={() => handleDeleteForever(selectedArr)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-xl"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete forever
            </button>
          </div>
        </div>
      )}

      <PhotoViewer photo={viewerPhoto} onClose={() => setViewer(null)} onNavigate={handleNavigate} />
    </AppShell>
  );
}
