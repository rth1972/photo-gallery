"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PhotoViewer } from "@/components/PhotoViewer";
import { PhotoRowGrid } from "@/components/PhotoRowGrid";
import { getPhotos } from "@/lib/data";
import { Photo } from "@/types";

function pad(n: number) { return String(n).padStart(2, "0"); }
function dateKey(y: number, m: number, d: number) { return `${y}-${pad(m + 1)}-${pad(d)}`; }

export default function CalendarPage() {
  const { data: session, status } = useSession();
  const userId = status === "authenticated" ? (session?.user as any)?.id : "";
  const [current, setCurrent]        = useState(new Date());
  const [photosByDate, setByDate]    = useState<Record<string, Photo[]>>({});
  const [selectedDate, setSelected]  = useState<string | null>(null);
  const [viewerPhoto, setViewer]     = useState<Photo | null>(null);
  const [selectedIds]                = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) return;
    getPhotos(userId).then(photos => {
      const map: Record<string, Photo[]> = {};
      for (const p of photos) {
        const k = p.createdAt.split("T")[0];
        (map[k] ??= []).push(p);
      }
      setByDate(map);
    });
  }, [userId]);

  const daysInMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
  const firstDow    = new Date(current.getFullYear(), current.getMonth(), 1).getDay();
  const todayKey    = dateKey(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  const dayPhotos = selectedDate ? (photosByDate[selectedDate] ?? []) : [];

  const handleNavigate = useCallback((dir: "prev" | "next") => {
    if (!viewerPhoto) return;
    const idx = dayPhotos.findIndex(p => p.id === viewerPhoto.id);
    if (idx === -1) return;
    setViewer(dayPhotos[dir === "prev" ? Math.max(0, idx - 1) : Math.min(dayPhotos.length - 1, idx + 1)]);
  }, [viewerPhoto, dayPhotos]);

  if (status === "loading" || !userId) return null;

  return (
    <AppShell
      title={current.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
      headerActions={
        <div className="flex items-center gap-1 ml-4">
          <button onClick={() => setCurrent(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[--surfaceHover]">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => setCurrent(new Date())}
            className="px-3 py-1 text-xs rounded-full hover:bg-[--surfaceHover] font-medium">
            Today
          </button>
          <button onClick={() => setCurrent(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[--surfaceHover]">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      }
    >
      {/* Calendar grid */}
      <div className="rounded-2xl overflow-hidden border border-[--border]">
        {/* Day labels */}
        <div className="grid grid-cols-7 bg-[--surfaceHover]/40">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
            <div key={d} className="py-2 text-center text-xs font-medium text-[--text-secondary]">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 divide-x divide-y divide-[--border]">
          {Array.from({ length: firstDow }, (_, i) => (
            <div key={`e${i}`} className="h-20 md:h-28 bg-[--surfaceHover]/10" />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day   = i + 1;
            const key   = dateKey(current.getFullYear(), current.getMonth(), day);
            const dps   = photosByDate[key] ?? [];
            const isToday = key === todayKey;
            const isSel   = selectedDate === key;

            return (
              <div
                key={day}
                onClick={() => dps.length && setSelected(isSel ? null : key)}
                className={[
                  "h-20 md:h-28 p-1.5 transition-colors cursor-pointer relative overflow-hidden",
                  dps.length ? "hover:bg-[--surfaceHover]/50" : "opacity-50 cursor-default",
                  isToday ? "bg-[--accent]/8" : "",
                  isSel   ? "ring-2 ring-inset ring-[--accent] bg-[--accent]/5" : "",
                ].join(" ")}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-medium w-5 h-5 flex items-center justify-center rounded-full ${
                    isToday ? "bg-[--accent] text-white" : ""
                  }`}>{day}</span>
                  {dps.length > 0 && (
                    <span className="text-[10px] text-[--accent] font-medium">{dps.length}</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-0.5">
                  {dps.slice(0, 4).map((p, j) => (
                    <div key={j} className="aspect-square rounded-sm overflow-hidden bg-[--surfaceHover]">
                      <img src={p.thumbnail} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected day photos */}
      {selectedDate && dayPhotos.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-medium">
              {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </h2>
            <button onClick={() => setSelected(null)} className="text-sm text-[--text-secondary] hover:text-[--text-primary]">
              Close
            </button>
          </div>
          <PhotoRowGrid photos={dayPhotos} selectedIds={selectedIds} onSelect={() => {}} onOpen={setViewer} />
        </div>
      )}

      <PhotoViewer photo={viewerPhoto} onClose={() => setViewer(null)} onNavigate={handleNavigate} />
    </AppShell>
  );
}
