"use client";

import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import { Heart } from "lucide-react";
import { Photo } from "@/types";
import clsx from "clsx";

const TARGET_ROW_H = 220;
const MIN_ROW_H    = 100;
const GAP          = 4;

interface RowPhoto extends Photo { displayW: number; displayH: number }

function buildRows(photos: Photo[], containerW: number): RowPhoto[][] {
  if (!containerW || !photos.length) return [];
  const rows: RowPhoto[][] = [];
  let row: RowPhoto[] = [];
  let rowW = 0;

  for (const photo of photos) {
    const aspect = photo.width && photo.height ? photo.width / photo.height : 4 / 3;
    const w = TARGET_ROW_H * aspect;
    row.push({ ...photo, displayW: w, displayH: TARGET_ROW_H });
    rowW += w;

    const totalGap = (row.length - 1) * GAP;
    const available = containerW - totalGap;
    const rawScale  = available / (rowW - totalGap + (row.length - 1) * GAP);

    if (rowW >= containerW * 0.8) {
      const h = Math.max(MIN_ROW_H, TARGET_ROW_H * rawScale);
      rows.push(row.map(p => ({ ...p, displayW: p.displayW * rawScale, displayH: h })));
      row = []; rowW = 0;
    }
  }

  // Last partial row — natural height, left-aligned
  if (row.length) rows.push(row.map(p => ({ ...p, displayH: TARGET_ROW_H })));
  return rows;
}

export function PhotoRowGrid({
  photos,
  selectedIds,
  onSelect,
  onOpen,
}: {
  photos: Photo[];
  selectedIds: Set<string>;
  onSelect: (p: Photo) => void;
  onOpen: (p: Photo) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  const rows = buildRows(photos, width);

  return (
    <div ref={ref} className="w-full">
      {rows.map((row, ri) => (
        <div key={ri} className="flex mb-1" style={{ gap: GAP }}>
          {row.map(photo => {
            const sel = selectedIds.has(photo.id);
            return (
              <div
                key={photo.id}
                onClick={() => onOpen(photo)}
                style={{ width: photo.displayW, height: photo.displayH, flexShrink: 0 }}
                className={clsx(
                  "relative overflow-hidden cursor-pointer group rounded-sm bg-[--surfaceHover]",
                  sel && "ring-2 ring-[--accent] ring-inset"
                )}
              >
                <Image
                  src={photo.thumbnail}
                  alt=""
                  fill
                  sizes="400px"
                  className={clsx(
                    "object-cover transition-transform duration-200 group-hover:scale-[1.02]",
                    sel && "brightness-75"
                  )}
                />

                {/* Hover tint */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />

                {/* Select circle */}
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); onSelect(photo); }}
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

                {/* Favorite */}
                {photo.favorite && (
                  <div className="absolute top-2 right-2 z-10 pointer-events-none">
                    <Heart className="w-4 h-4 fill-white text-white drop-shadow" />
                  </div>
                )}

                {/* Video badge */}
                {photo.type === "video" && (
                  <div className="absolute bottom-2 right-2 z-10 bg-black/60 rounded px-1.5 py-0.5 flex items-center gap-1">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
