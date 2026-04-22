"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Photo } from "@/types";
import {
  X, Heart, Trash2, Archive, ChevronLeft, ChevronRight,
  Info, Calendar, MoreHorizontal, AlertTriangle, RotateCw,
  MapPin, FileImage, Sliders, Save, Undo, Tag, RefreshCw,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ImageEdits {
  brightness: number;
  contrast: number;
  saturation: number;
  warmth: number;
  filter: string;
}

interface PhotoViewerProps {
  photo: Photo | null;
  onClose: () => void;
  onNavigate?: (direction: "prev" | "next") => void;
  onDelete?: (photoId: string) => void;
  onFavorite?: (photoId: string) => void;
  onArchive?: (photoId: string) => void;
  onRotate?: (photoId: string, rotation: number) => void;
  onSaveEdit?: (photoId: string, edits: ImageEdits) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const defaultEdits: ImageEdits = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  warmth: 0,
  filter: "none",
};

const FILTERS = [
  { id: "none",      name: "None"     },
  { id: "grayscale", name: "B&W"      },
  { id: "sepia",     name: "Sepia"    },
  { id: "vintage",   name: "Vintage"  },
  { id: "vivid",     name: "Vivid"    },
  { id: "cool",      name: "Cool"     },
  { id: "warm",      name: "Warm"     },
  { id: "dramatic",  name: "Dramatic" },
];

function getFilterString(edits: ImageEdits): string {
  const parts: string[] = [];
  if (edits.brightness !== 100) parts.push(`brightness(${edits.brightness}%)`);
  if (edits.contrast   !== 100) parts.push(`contrast(${edits.contrast}%)`);
  if (edits.saturation !== 100) parts.push(`saturate(${edits.saturation}%)`);
  if (edits.warmth     !== 0)   parts.push(`sepia(${Math.abs(edits.warmth)}%)`);
  switch (edits.filter) {
    case "grayscale": parts.push("grayscale(100%)"); break;
    case "sepia":     parts.push("sepia(100%)"); break;
    case "vintage":   parts.push("sepia(50%)", "contrast(90%)"); break;
    case "vivid":     parts.push("saturate(150%)"); break;
    case "cool":      parts.push("hue-rotate(180deg)"); break;
    case "warm":      parts.push("sepia(30%)"); break;
    case "dramatic":  parts.push("contrast(130%)", "saturate(80%)"); break;
  }
  return parts.length ? parts.join(" ") : "none";
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PhotoViewer({
  photo,
  onClose,
  onNavigate,
  onDelete,
  onFavorite,
  onArchive,
  onRotate,
  onSaveEdit,
}: PhotoViewerProps) {
  const [favorite,         setFavorite]         = useState(false);
  const [archived,         setArchived]          = useState(false);
  const [showDeleteConfirm,setShowDeleteConfirm] = useState(false);
  const [sidePanel,        setSidePanel]         = useState<"info" | "edit" | null>(null);
  const [rotation,         setRotation]          = useState(0);
  const [edits,            setEdits]             = useState<ImageEdits>(defaultEdits);
  const [originalEdits,    setOriginalEdits]     = useState<ImageEdits>(defaultEdits);
  // Local tags state — updated when photo changes or when we regenerate
  const [localTags,        setLocalTags]         = useState<string[]>([]);
  const [generatingTags,   setGeneratingTags]    = useState(false);

  // Reset all state whenever the viewed photo changes
  useEffect(() => {
    if (!photo) return;
    setFavorite(photo.favorite || false);
    setArchived(photo.archive  || false);
    setShowDeleteConfirm(false);
    setSidePanel(null);
    setRotation(photo.rotation || 0);
    setLocalTags(photo.aiTags ?? []);
    const saved = photo.edits ? { ...defaultEdits, ...photo.edits } : defaultEdits;
    setEdits(saved);
    setOriginalEdits(saved);
  }, [photo]);

  // Keyboard navigation
  useEffect(() => {
    if (!photo) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape")      onClose();
      if (e.key === "ArrowLeft")   onNavigate?.("prev");
      if (e.key === "ArrowRight")  onNavigate?.("next");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [photo, onClose, onNavigate]);

  const handleRotate = useCallback((dir: "left" | "right") => {
    if (!photo) return;
    const r = dir === "right" ? rotation + 90 : rotation - 90;
    setRotation(r);
    onRotate?.(photo.id, r);
  }, [photo, rotation, onRotate]);

  const handleSaveEdits = useCallback(() => {
    if (!photo) return;
    onSaveEdit?.(photo.id, edits);
    setOriginalEdits(edits);
  }, [photo, edits, onSaveEdit]);

  const handleDeleteConfirm = useCallback(() => {
    if (!photo) return;
    onDelete?.(photo.id);
    setShowDeleteConfirm(false);
  }, [photo, onDelete]);

  // Re-generate AI tags on demand via /api/ai/tags
  const handleRegenerateTags = useCallback(async () => {
    if (!photo || generatingTags) return;
    setGeneratingTags(true);
    try {
      const res = await fetch("/api/ai/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId: photo.id }),
      });
      const data = await res.json();
      if (Array.isArray(data.tags) && data.tags.length > 0) {
        setLocalTags(data.tags);
      }
    } catch { /* silent — Ollama may not be running */ }
    setGeneratingTags(false);
  }, [photo, generatingTags]);

  if (!photo) return null;

  const hasChanges =
    JSON.stringify(edits) !== JSON.stringify(defaultEdits) &&
    JSON.stringify(edits) !== JSON.stringify(originalEdits);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex"
      onClick={onClose}
    >
      {/* ── Delete confirmation ── */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-60 flex items-center justify-center bg-black/60"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-[--surface] p-6 rounded-2xl max-w-sm w-full mx-4 text-center space-y-4 border border-[--border]">
              <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
              <div>
                <h3 className="font-semibold text-base">Move to trash?</h3>
                <p className="text-sm opacity-50 mt-1">Kept for 30 days before permanent deletion.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={e => { e.stopPropagation(); setShowDeleteConfirm(false); }}
                  className="flex-1 py-2.5 rounded-xl bg-[--surfaceHover] text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={e => { e.stopPropagation(); handleDeleteConfirm(); }}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Top toolbar ── */}
      <div
        className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/70 to-transparent flex items-center justify-between px-4 z-10"
        onClick={e => e.stopPropagation()}
      >
        {/* Left: close + date */}
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <span className="text-sm text-white/60 hidden sm:block">
            {photo.createdAt
              ? new Date(photo.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
              : ""}
          </span>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1">
          <ToolBtn
            active={favorite}
            onClick={() => { setFavorite(v => !v); onFavorite?.(photo.id); }}
            activeClass="bg-red-500"
          >
            <Heart className={`w-5 h-5 text-white ${favorite ? "fill-white" : ""}`} />
          </ToolBtn>

          <ToolBtn
            active={archived}
            onClick={() => { setArchived(v => !v); onArchive?.(photo.id); }}
            activeClass="bg-amber-500"
          >
            <Archive className={`w-5 h-5 text-white ${archived ? "fill-white" : ""}`} />
          </ToolBtn>

          <ToolBtn onClick={() => handleRotate("left")}>
            <RotateCw className="w-5 h-5 text-white scale-x-[-1]" />
          </ToolBtn>

          <ToolBtn onClick={() => handleRotate("right")}>
            <RotateCw className="w-5 h-5 text-white" />
          </ToolBtn>

          <ToolBtn
            active={sidePanel === "info"}
            onClick={() => setSidePanel(p => p === "info" ? null : "info")}
          >
            <Info className="w-5 h-5 text-white" />
          </ToolBtn>

          <ToolBtn
            active={sidePanel === "edit"}
            onClick={() => setSidePanel(p => p === "edit" ? null : "edit")}
          >
            <Sliders className="w-5 h-5 text-white" />
          </ToolBtn>

          <ToolBtn
            onClick={() => setShowDeleteConfirm(true)}
            className="hover:bg-red-500/80"
          >
            <Trash2 className="w-5 h-5 text-white" />
          </ToolBtn>
        </div>
      </div>

      {/* ── Main image ── */}
      <div
        className="flex-1 flex items-center justify-center"
        style={{ padding: "80px 60px" }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        {photo.type === "video" ? (
          <video
            src={`${photo.url}?v=${photo.id}`}
            controls autoPlay loop
            className="max-h-[85vh] max-w-full object-contain"
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <img
            src={`${photo.url}?v=${photo.id}`}
            alt=""
            className="max-h-[85vh] max-w-full object-contain select-none"
            style={{
              transform: `rotate(${rotation}deg)`,
              filter: getFilterString(edits),
            }}
            onClick={e => e.stopPropagation()}
          />
        )}
      </div>

      {/* ── Prev / Next ── */}
      {onNavigate && (
        <>
          <button
            onClick={e => { e.stopPropagation(); onNavigate("prev"); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center z-20 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onNavigate("next"); }}
            className={`absolute top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center z-20 transition-colors ${sidePanel ? "right-[336px]" : "right-3"}`}
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </>
      )}

      {/* ── Side panel ── */}
      <AnimatePresence>
        {sidePanel && (
          <motion.div
            key={sidePanel}
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0,   opacity: 1 }}
            exit={{ x: 320,    opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            className="absolute right-0 top-0 bottom-0 w-80 bg-[--surface] border-l border-[--border] overflow-y-auto z-10"
            onClick={e => e.stopPropagation()}
          >
            {sidePanel === "info" ? (
              <InfoPanel
                photo={photo}
                localTags={localTags}
                generatingTags={generatingTags}
                onRegenerateTags={handleRegenerateTags}
                onClose={() => setSidePanel(null)}
              />
            ) : (
              <EditPanel
                edits={edits}
                hasChanges={hasChanges}
                onChange={setEdits}
                onSave={handleSaveEdits}
                onReset={() => setEdits(defaultEdits)}
                onClose={() => setSidePanel(null)}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Small helper: toolbar button ────────────────────────────────────────────

function ToolBtn({
  children,
  onClick,
  active = false,
  activeClass = "bg-white/30",
  className = "",
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  activeClass?: string;
  className?: string;
}) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick(); }}
      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
        active ? activeClass : `bg-white/10 hover:bg-white/20 ${className}`
      }`}
    >
      {children}
    </button>
  );
}

// ─── Info panel ───────────────────────────────────────────────────────────────

function InfoPanel({
  photo,
  localTags,
  generatingTags,
  onRegenerateTags,
  onClose,
}: {
  photo: Photo;
  localTags: string[];
  generatingTags: boolean;
  onRegenerateTags: () => void;
  onClose: () => void;
}) {
  return (
    <div className="p-5 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide opacity-50">Details</h2>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-full hover:bg-[--surfaceHover] flex items-center justify-center transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Metadata rows */}
      <div className="space-y-3">
        <MetaRow icon={<Calendar className="w-4 h-4" />}>
          {photo.createdAt
            ? new Date(photo.createdAt).toLocaleDateString("en-US", {
                weekday: "long", year: "numeric", month: "long", day: "numeric",
              })
            : "Unknown date"}
        </MetaRow>

        {(photo.width > 0 && photo.height > 0) && (
          <MetaRow icon={<MoreHorizontal className="w-4 h-4" />}>
            {photo.width} × {photo.height}
          </MetaRow>
        )}

        {photo.exif?.make && (
          <MetaRow icon={<FileImage className="w-4 h-4" />}>
            {photo.exif.make}{photo.exif.model ? ` ${photo.exif.model}` : ""}
          </MetaRow>
        )}

        {(photo.location || (photo.latitude && photo.longitude)) && (
          <MetaRow icon={<MapPin className="w-4 h-4" />}>
            {photo.location ?? `${photo.latitude?.toFixed(5)}, ${photo.longitude?.toFixed(5)}`}
          </MetaRow>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-[--border]" />

      {/* AI Tags */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 opacity-50" />
            <span className="text-xs font-semibold uppercase tracking-wide opacity-50">AI Tags</span>
          </div>
          <button
            onClick={onRegenerateTags}
            disabled={generatingTags}
            title={localTags.length ? "Regenerate tags" : "Generate tags"}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-xs hover:bg-[--surfaceHover] disabled:opacity-40 transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${generatingTags ? "animate-spin" : ""}`} />
            <span className="opacity-60">{localTags.length ? "Redo" : "Generate"}</span>
          </button>
        </div>

        {localTags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {localTags.map(tag => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-full bg-[--surfaceHover] text-xs font-medium capitalize"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs opacity-40 italic">
            {generatingTags
              ? "Generating tags…"
              : "No tags yet — click Generate to analyse this photo with AI"}
          </p>
        )}
      </div>
    </div>
  );
}

function MetaRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 text-sm opacity-70">
      <span className="mt-0.5 flex-shrink-0">{icon}</span>
      <span className="leading-snug">{children}</span>
    </div>
  );
}

// ─── Edit panel ───────────────────────────────────────────────────────────────

function EditPanel({
  edits,
  hasChanges,
  onChange,
  onSave,
  onReset,
  onClose,
}: {
  edits: ImageEdits;
  hasChanges: boolean;
  onChange: (e: ImageEdits) => void;
  onSave: () => void;
  onReset: () => void;
  onClose: () => void;
}) {
  return (
    <div className="p-5 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide opacity-50">Edit</h2>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-full hover:bg-[--surfaceHover] flex items-center justify-center"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Filters */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide opacity-50 mb-2">Filters</p>
        <div className="grid grid-cols-4 gap-1.5">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => onChange({ ...edits, filter: f.id })}
              className={`py-2 rounded-xl text-xs font-medium transition-colors ${
                edits.filter === f.id
                  ? "bg-[--accent] text-white"
                  : "bg-[--surfaceHover] hover:bg-[--border] opacity-80"
              }`}
            >
              {f.name}
            </button>
          ))}
        </div>
      </div>

      {/* Sliders */}
      <div className="space-y-4">
        {(["brightness", "contrast", "saturation", "warmth"] as const).map(key => (
          <div key={key}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium capitalize opacity-60">{key}</span>
              <span className="text-xs opacity-40 tabular-nums">{edits[key]}</span>
            </div>
            <input
              type="range"
              min={key === "warmth" ? -100 : 0}
              max={key === "warmth" ? 100 : 200}
              value={edits[key]}
              onChange={e => onChange({ ...edits, [key]: parseInt(e.target.value) })}
              className="w-full accent-[--accent]"
            />
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={onReset}
          className="flex-1 py-2.5 rounded-xl bg-[--surfaceHover] text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-[--border] transition-colors"
        >
          <Undo className="w-3.5 h-3.5" /> Reset
        </button>
        <button
          onClick={onSave}
          disabled={!hasChanges}
          className="flex-1 py-2.5 rounded-xl bg-[--accent] text-white text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          <Save className="w-3.5 h-3.5" /> Save
        </button>
      </div>
    </div>
  );
}
