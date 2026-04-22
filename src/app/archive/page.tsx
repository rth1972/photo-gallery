"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { Archive } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PhotoViewer } from "@/components/PhotoViewer";
import { SelectionBar } from "@/components/SelectionBar";
import { PhotoRowGrid } from "@/components/PhotoRowGrid";
import { getPhotos } from "@/lib/data";
import { Photo } from "@/types";

function patchPhoto(id: string, body: object) {
  return fetch(`/api/photos/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}

export default function ArchivePage() {
  const { data: session, status } = useSession();
  const userId = status === "authenticated" ? (session?.user as any)?.id : "";
  const [photos, setPhotos]        = useState<Photo[]>([]);
  const [viewerPhoto, setViewer]   = useState<Photo | null>(null);
  const [selectedIds, setSelected] = useState<Set<string>>(new Set());

  const load = useCallback(() => {
    if (userId) getPhotos(userId, { archive: true }).then(setPhotos);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const optimistic = useCallback((id: string, patch: Partial<Photo>) => {
    setPhotos(p => p.map(x => x.id === id ? { ...x, ...patch } : x));
    setViewer(p => p?.id === id ? { ...p, ...patch } : p);
  }, []);

  const handleFavorite = useCallback(async (id: string) => {
    const p = photos.find(x => x.id === id);
    if (!p) return;
    optimistic(id, { favorite: !p.favorite });
    await patchPhoto(id, { action: "favorite", value: !p.favorite });
  }, [photos, optimistic]);

  const handleArchive = useCallback(async (id: string) => {
    // Unarchiving removes it from this page
    setPhotos(p => p.filter(x => x.id !== id));
    setViewer(null);
    await patchPhoto(id, { action: "archive", value: false });
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Move to trash?")) return;
    setPhotos(p => p.filter(x => x.id !== id));
    setViewer(null);
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

  const handleBulkUnarchive = useCallback(async () => {
    const ids = Array.from(selectedIds);
    setPhotos(p => p.filter(x => !ids.includes(x.id)));
    setSelected(new Set());
    await Promise.all(ids.map(id => patchPhoto(id, { action: "archive", value: false })));
  }, [selectedIds]);

  const handleBulkDelete = useCallback(async () => {
    const ids = Array.from(selectedIds);
    setPhotos(p => p.filter(x => !ids.includes(x.id)));
    setSelected(new Set());
    await Promise.all(ids.map(id => fetch(`/api/photos/${id}`, { method: "DELETE" })));
  }, [selectedIds]);

  if (status === "loading" || !userId) return null;

  return (
    <AppShell title="Archive" subtitle={photos.length ? `${photos.length} photos` : undefined}>
      {photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-[--surfaceHover] flex items-center justify-center">
            <Archive className="w-7 h-7 opacity-30" />
          </div>
          <p className="text-lg font-medium">Archive is empty</p>
          <p className="text-sm text-[--text-secondary] max-w-xs">
            Photos you archive will appear here and won't show in your main gallery.
          </p>
        </div>
      ) : (
        <PhotoRowGrid photos={photos} selectedIds={selectedIds} onSelect={handleSelect} onOpen={setViewer} />
      )}

      <SelectionBar
        selectedCount={selectedIds.size}
        onClear={() => setSelected(new Set())}
        onDelete={handleBulkDelete}
        onFavorite={async () => {}}
        onArchive={handleBulkUnarchive}
      />

      <PhotoViewer
        photo={viewerPhoto}
        onClose={() => setViewer(null)}
        onNavigate={handleNavigate}
        onFavorite={handleFavorite}
        onArchive={handleArchive}
        onDelete={handleDelete}
      />
    </AppShell>
  );
}
