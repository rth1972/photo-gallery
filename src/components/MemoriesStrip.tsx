"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Sparkles, ChevronRight, X } from "lucide-react";
import { PhotoViewer } from "@/components/PhotoViewer";
import { Photo } from "@/types";
import clsx from "clsx";

function mapPhoto(p: any): Photo {
  return {
    id: p.id, url: p.url, thumbnail: p.thumbnail,
    width: p.width, height: p.height, createdAt: p.createdAt,
    type: p.type, favorite: p.favorite, archive: p.archive,
    deletedAt: p.deletedAt ?? null, rotation: p.rotation ?? 0,
    latitude: p.latitude, longitude: p.longitude, tags: [],
    edits:  p.edits  ? JSON.parse(p.edits)  : undefined,
    aiTags: p.aiTags ? JSON.parse(p.aiTags) : undefined,
    exif: (p.exifMake || p.exifModel) ? { make: p.exifMake, model: p.exifModel, dateTimeOriginal: p.exifDate } : undefined,
  };
}

function yearsAgo(dateStr: string) {
  const n = new Date().getFullYear() - new Date(dateStr).getFullYear();
  return n === 1 ? "1 year ago" : `${n} years ago`;
}

export function MemoriesStrip({ userId }: { userId: string }) {
  const [photos,  setPhotos]  = useState<Photo[]>([]);
  const [viewer,  setViewer]  = useState<Photo | null>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/memories?userId=${userId}`)
      .then(r => r.json())
      .then((raw: any[]) => setPhotos(raw.map(mapPhoto)))
      .catch(() => {});
  }, [userId]);

  if (!visible || photos.length === 0) return null;

  const handleNavigate = (dir: "prev" | "next") => {
    if (!viewer) return;
    const idx = photos.findIndex(p => p.id === viewer.id);
    if (idx === -1) return;
    setViewer(photos[dir === "prev" ? Math.max(0, idx - 1) : Math.min(photos.length - 1, idx + 1)]);
  };

  return (
    <>
      <section className="mb-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold">Memories</span>
            <span className="text-xs text-[--text-secondary]">
              {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" })}
            </span>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="w-7 h-7 rounded-full hover:bg-[--surfaceHover] flex items-center justify-center transition-colors"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5 opacity-40" />
          </button>
        </div>

        {/* Photo strip */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {photos.map(photo => (
            <div
              key={photo.id}
              onClick={() => setViewer(photo)}
              className="flex-shrink-0 relative cursor-pointer group rounded-xl overflow-hidden bg-[--surfaceHover]"
              style={{ width: 160, height: 200 }}
            >
              <Image
                src={photo.thumbnail}
                alt=""
                fill
                sizes="160px"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              {/* Year label */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-white text-xs font-semibold leading-tight">
                  {yearsAgo(photo.createdAt)}
                </p>
                <p className="text-white/60 text-[10px] leading-tight">
                  {new Date(photo.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
              {/* AI tags pill */}
              {photo.aiTags && photo.aiTags.length > 0 && (
                <div className="absolute top-2 left-2">
                  <span className="bg-black/50 backdrop-blur text-white/80 text-[9px] px-1.5 py-0.5 rounded-full">
                    {photo.aiTags[0]}
                  </span>
                </div>
              )}
            </div>
          ))}

          {/* "See all" button if more than one year */}
          {photos.length > 1 && (
            <div
              className="flex-shrink-0 flex flex-col items-center justify-center gap-1 rounded-xl bg-[--surfaceHover] cursor-pointer hover:bg-[--border] transition-colors px-4"
              style={{ width: 80, height: 200 }}
              onClick={() => setViewer(photos[0])}
            >
              <ChevronRight className="w-5 h-5 opacity-40" />
              <span className="text-[10px] opacity-40 text-center">See all</span>
            </div>
          )}
        </div>
      </section>

      <PhotoViewer
        photo={viewer}
        onClose={() => setViewer(null)}
        onNavigate={handleNavigate}
      />
    </>
  );
}
