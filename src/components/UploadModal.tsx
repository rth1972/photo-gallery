"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, ImageIcon, FileVideo, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import clsx from "clsx";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onUploadComplete?: () => void;
}

interface FileEntry {
  file: File;
  status: "pending" | "uploading" | "done" | "error";
}

export function UploadModal({ isOpen, onClose, userId, onUploadComplete }: UploadModalProps) {
  const [dragOver,  setDragOver]  = useState(false);
  const [entries,   setEntries]   = useState<FileEntry[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((incoming: File[]) => {
    const valid = incoming.filter(
      f => f.type.startsWith("image/") || f.type.startsWith("video/") || /\.(mp4|mov|avi|mpg|mkv|webm)$/i.test(f.name)
    );
    setEntries(prev => [
      ...prev,
      ...valid.map(file => ({ file, status: "pending" as const })),
    ]);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(Array.from(e.dataTransfer.files));
  }, [addFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files));
    // reset so the same file can be re-selected
    e.target.value = "";
  }, [addFiles]);

  const removeFile = useCallback((index: number) => {
    setEntries(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpload = useCallback(async () => {
    const pending = entries.filter(e => e.status === "pending");
    if (pending.length === 0 || uploading) return;

    setUploading(true);

    // Upload sequentially so Ollama AI tagging (fire-and-forget on server)
    // doesn't get overwhelmed. Each POST returns fast; tagging runs in bg.
    for (let i = 0; i < entries.length; i++) {
      if (entries[i].status !== "pending") continue;

      // Mark as uploading
      setEntries(prev => prev.map((e, idx) => idx === i ? { ...e, status: "uploading" } : e));

      try {
        const formData = new FormData();
        formData.append("file", entries[i].file);
        formData.append("userId", userId);
        const res = await fetch("/api/photos", { method: "POST", body: formData });
        const status = res.ok ? "done" : "error";
        setEntries(prev => prev.map((e, idx) => idx === i ? { ...e, status } : e));
      } catch {
        setEntries(prev => prev.map((e, idx) => idx === i ? { ...e, status: "error" } : e));
      }
    }

    setUploading(false);

    // Refresh the gallery THEN close — this is the key fix.
    // Calling onUploadComplete first ensures loadAll() fires before the modal
    // unmounts and clears state.
    await onUploadComplete?.();
    onClose();
    setEntries([]);
  }, [entries, uploading, userId, onUploadComplete, onClose]);

  const handleClose = useCallback(() => {
    if (uploading) return; // prevent closing mid-upload
    onClose();
    setEntries([]);
  }, [uploading, onClose]);

  const doneCount    = entries.filter(e => e.status === "done").length;
  const errorCount   = entries.filter(e => e.status === "error").length;
  const pendingCount = entries.filter(e => e.status === "pending").length;
  const totalCount   = entries.length;

  const fmt = (bytes: number) => {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="w-full sm:max-w-md bg-[--surface] rounded-t-2xl sm:rounded-2xl overflow-hidden border border-[--border] shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[--border]">
              <h2 className="text-base font-semibold">Upload photos</h2>
              <button
                onClick={handleClose}
                disabled={uploading}
                className="w-8 h-8 rounded-full hover:bg-[--surfaceHover] flex items-center justify-center disabled:opacity-40 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={clsx(
                  "relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                  dragOver
                    ? "border-[--accent] bg-[--accent]/8 scale-[1.01]"
                    : "border-[--border] hover:border-[--accent]/50 hover:bg-[--surfaceHover]/40"
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <div className="flex flex-col items-center gap-2 pointer-events-none">
                  <div className={clsx(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                    dragOver ? "bg-[--accent] text-white" : "bg-[--surfaceHover]"
                  )}>
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-medium">
                    {dragOver ? "Drop to add" : "Drag photos here"}
                  </p>
                  <p className="text-xs text-[--text-secondary]">or click to browse</p>
                </div>
              </div>

              {/* File list */}
              {entries.length > 0 && (
                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  {entries.map((entry, i) => {
                    const isImg = entry.file.type.startsWith("image/");
                    return (
                      <div
                        key={i}
                        className={clsx(
                          "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors",
                          entry.status === "done"      && "bg-green-500/8",
                          entry.status === "error"     && "bg-red-500/8",
                          entry.status === "uploading" && "bg-[--accent]/8",
                          entry.status === "pending"   && "bg-[--surfaceHover]/50",
                        )}
                      >
                        {/* Icon */}
                        <div className="w-8 h-8 rounded-lg bg-[--surfaceHover] flex items-center justify-center flex-shrink-0">
                          {isImg
                            ? <ImageIcon className="w-4 h-4 opacity-50" />
                            : <FileVideo className="w-4 h-4 opacity-50" />}
                        </div>

                        {/* Name + size */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate leading-tight">{entry.file.name}</p>
                          <p className="text-xs text-[--text-secondary]">{fmt(entry.file.size)}</p>
                        </div>

                        {/* Status */}
                        <div className="flex-shrink-0">
                          {entry.status === "pending" && (
                            <button onClick={() => removeFile(i)} className="w-6 h-6 rounded-full hover:bg-[--border] flex items-center justify-center">
                              <X className="w-3.5 h-3.5 opacity-40" />
                            </button>
                          )}
                          {entry.status === "uploading" && (
                            <Loader2 className="w-4 h-4 animate-spin text-[--accent]" />
                          )}
                          {entry.status === "done" && (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          )}
                          {entry.status === "error" && (
                            <AlertCircle className="w-4 h-4 text-red-400" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Progress summary while uploading */}
              {uploading && totalCount > 1 && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-[--text-secondary]">
                    <span>{doneCount} of {totalCount} uploaded</span>
                    {errorCount > 0 && <span className="text-red-400">{errorCount} failed</span>}
                  </div>
                  <div className="h-1 rounded-full bg-[--surfaceHover] overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-[--accent]"
                      animate={{ width: `${(doneCount / totalCount) * 100}%` }}
                      transition={{ ease: "easeOut" }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-[--border]">
              <p className="text-xs text-[--text-secondary]">
                {pendingCount > 0
                  ? `${pendingCount} file${pendingCount !== 1 ? "s" : ""} ready`
                  : entries.length > 0
                  ? `${doneCount} uploaded${errorCount > 0 ? `, ${errorCount} failed` : ""}`
                  : "No files selected"}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleClose}
                  disabled={uploading}
                  className="px-4 py-2 rounded-xl text-sm hover:bg-[--surfaceHover] disabled:opacity-40 transition-colors"
                >
                  {doneCount > 0 && !uploading ? "Close" : "Cancel"}
                </button>
                <button
                  onClick={handleUpload}
                  disabled={pendingCount === 0 || uploading}
                  className={clsx(
                    "px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all",
                    pendingCount > 0 && !uploading
                      ? "bg-[--accent] text-white hover:opacity-90"
                      : "bg-[--surfaceHover] text-[--text-secondary] cursor-not-allowed opacity-50"
                  )}
                >
                  {uploading ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading…</>
                  ) : (
                    <><Upload className="w-3.5 h-3.5" /> Upload {pendingCount > 0 && `${pendingCount} file${pendingCount !== 1 ? "s" : ""}`}</>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
