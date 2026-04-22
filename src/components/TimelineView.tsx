"use client";

// TimelineView — horizontal strip of photos sorted by date.
// Uses PhotoRowGrid internally so it inherits the justified layout.

import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import { Photo } from "@/types";
import clsx from "clsx";

interface TimelineViewProps {
  photos: Photo[];
  onPhotoOpen?: (photo: Photo) => void;
  onSelect?: (photo: Photo, isMultiSelect: boolean) => void;
  selectedIds?: Set<string>;
}

export function TimelineView({ photos, onPhotoOpen, onSelect, selectedIds = new Set() }: TimelineViewProps) {
  if (photos.length === 0) {
    return <div className="text-center py-12 text-[--text-secondary] text-sm">No photos yet</div>;
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-thin">
      {photos.map(photo => {
        const sel = selectedIds.has(photo.id);
        return (
          <div
            key={photo.id}
            onClick={() => onPhotoOpen?.(photo)}
            className={clsx(
              "flex-shrink-0 w-44 relative aspect-[3/4] overflow-hidden cursor-pointer group rounded-xl bg-[--surfaceHover]",
              sel && "ring-2 ring-[--accent] ring-inset"
            )}
          >
            <Image
              src={photo.thumbnail}
              alt=""
              fill
              sizes="176px"
              className={clsx("object-cover transition-transform duration-200 group-hover:scale-[1.03]", sel && "brightness-75")}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="absolute bottom-0 left-0 right-0 p-2.5">
                <p className="text-[10px] text-white/70">{new Date(photo.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onSelect?.(photo, e.shiftKey || e.ctrlKey || e.metaKey); }}
              className={clsx(
                "absolute top-2 left-2 z-10 transition-all duration-150",
                sel ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              )}
            >
              {sel ? (
                <div className="w-6 h-6 rounded-full bg-[--accent] flex items-center justify-center shadow">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-black/40 border-2 border-white/70 shadow" />
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
