"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { Heart } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PhotoViewer } from "@/components/PhotoViewer";
import { SelectionBar } from "@/components/SelectionBar";
import { getPhotos } from "@/lib/data";
import { Photo } from "@/types";
import { PhotoRowGrid } from "@/components/PhotoRowGrid";

function patchPhoto(id: string, body: object) {
  return fetch(`/api/photos/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export default function FavoritesPage() {
  const { data: session, status } = useSession();
  const userId = status === "authenticated" ? (session?.user as any)?.id : "";
  const [photos, setPhotos]         = useState<Photo[]>([]);
  const [viewerPhoto, setViewer]    = useState<Photo | null>(null);
  const [selectedIds, setSelected]  = useState<Set<string>>(new Set());

  const load = useCallback(() => {
    if (userId) getPhotos(userId, { favorite: true }).then(setPhotos);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const optimistic = useCallback((id: string, patch: Partial<Photo>) => {
    setPhotos(p => p.map(x => x.id === id ? { ...x, ...patch } : x));
    setViewer(p => p?.id === id ? { ...p, ...patch } : p);
  }, []);

  const handleFavorite = useCallback(async (id: string) => {
    const photo = photos.find(p => p.id === id);
    if (!photo) return;
    const val = !photo.favorite;
    optimistic(id, { favorite: val });
    if (!val) setPhotos(p => p.filter(x => x.id !== id)); // remove from favs if unfavourited
    await patchPhoto(id, { action: "favorite", value: val });
  }, [photos, optimistic]);

  const handleArchive = useCallback(async (id: string) => {
    const photo = photos.find(p => p.id === id);
    if (!photo) return;
    optimistic(id, { archive: !photo.archive });
    await patchPhoto(id, { action: "archive", value: !photo.archive });
  }, [photos, optimistic]);

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

  const handleBulkDelete = useCallback(async () => {
    const ids = Array.from(selectedIds);
    setPhotos(p => p.filter(x => !ids.includes(x.id)));
    setSelected(new Set());
    await Promise.all(ids.map(id => fetch(`/api/photos/${id}`, { method: "DELETE" })));
  }, [selectedIds]);

  const handleBulkUnfav = useCallback(async () => {
    const ids = Array.from(selectedIds);
    setPhotos(p => p.filter(x => !ids.includes(x.id)));
    setSelected(new Set());
    await Promise.all(ids.map(id => patchPhoto(id, { action: "favorite", value: false })));
  }, [selectedIds]);

  if (status === "loading" || !userId) return null;

  return (
    <AppShell
      title="Favorites"
      subtitle={photos.length ? `${photos.length} photos` : undefined}
    >
      {photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-[--surfaceHover] flex items-center justify-center">
            <Heart className="w-7 h-7 opacity-30" />
          </div>
          <p className="text-lg font-medium">No favorites yet</p>
          <p className="text-sm text-[--text-secondary] max-w-xs">
            Tap the heart on any photo to add it to your favorites.
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
        onFavorite={handleBulkUnfav}
        onArchive={async () => {}}
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
