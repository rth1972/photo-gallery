"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Heart, Archive, FolderPlus, AlertTriangle, Check, Plus } from "lucide-react";
import { Album } from "@/types";

interface SelectionBarProps {
  selectedCount: number;
  onClear: () => void;
  onDelete: () => void;
  onFavorite: () => void;
  onArchive: () => void;
  onMoveToAlbum?: (albumId: string) => void;
  archiveLabel?: string;
  albums?: Album[];
  userId?: string;
}

export function SelectionBar({
  selectedCount,
  onClear,
  onDelete,
  onFavorite,
  onArchive,
  onMoveToAlbum,
  archiveLabel = "Archive",
  albums = [],
  userId,
}: SelectionBarProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAlbumMenu, setShowAlbumMenu] = useState(false);

  const handleConfirmDelete = () => {
    setShowDeleteConfirm(false);
    onDelete();
  };

  return (
    <>
      <AnimatePresence>
        {selectedCount > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40"
          >
            <div className="flex items-center gap-1 px-2 py-2 rounded-2xl bg-[--surface] border border-[--border] shadow-2xl shadow-black/40">
              {/* Count + clear */}
              <div className="flex items-center gap-2 px-3 border-r border-[--border] mr-1 pr-4">
                <span className="text-sm font-semibold tabular-nums">
                  {selectedCount}
                </span>
                <span className="text-sm opacity-60 hidden sm:block">
                  {selectedCount === 1 ? "photo selected" : "photos selected"}
                </span>
                <button
                  onClick={onClear}
                  className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-[--surfaceHover] ml-1"
                  title="Clear selection"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <ActionButton icon={<Heart className="w-4 h-4" />} label="Favorite" onClick={onFavorite} />
              <ActionButton icon={<Archive className="w-4 h-4" />} label={archiveLabel} onClick={onArchive} />
              {onMoveToAlbum && (
                <div className="relative">
                  <ActionButton 
                    icon={<FolderPlus className="w-4 h-4" />} 
                    label="Move to album" 
                    onClick={() => setShowAlbumMenu(!showAlbumMenu)} 
                  />
                  <AnimatePresence>
                    {showAlbumMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute bottom-full left-0 mb-2 w-48 bg-[--surface] rounded-lg shadow-lg border border-[--border] py-1 z-10"
                      >
                        {albums.length === 0 ? (
                          <p className="px-3 py-2 text-sm opacity-60">No albums yet</p>
                        ) : (
                          albums.map((album) => (
                            <button
                              key={album.id}
                              onClick={() => {
                                onMoveToAlbum(album.id);
                                setShowAlbumMenu(false);
                              }}
                              className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-[--surfaceHover]"
                            >
                              <span>{album.name}</span>
                              <span className="text-xs opacity-50">{album.photoCount}</span>
                            </button>
                          ))
                        )}
                        <button 
                          onClick={() => {
                            // Navigate to create album page
                            window.location.href = "/albums";
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[--surfaceHover] text-[--accent]"
                        >
                          <Plus className="w-4 h-4" />
                          Create new album
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <div className="w-px h-6 bg-[--border] mx-1" />

              <ActionButton
                icon={<Trash2 className="w-4 h-4" />}
                label="Delete"
                onClick={() => setShowDeleteConfirm(true)}
                danger
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation dialog */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[--surface] border border-[--border] rounded-2xl p-6 w-full max-w-sm shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="font-semibold">
                    Delete {selectedCount} {selectedCount === 1 ? "photo" : "photos"}?
                  </h3>
                  <p className="text-sm opacity-60">This cannot be undone.</p>
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[--surfaceHover] hover:opacity-80 text-sm font-medium transition-opacity"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
        danger
          ? "hover:bg-red-500/20 hover:text-red-400"
          : "hover:bg-[--surfaceHover]"
      }`}
    >
      {icon}
      <span className="hidden sm:block">{label}</span>
    </button>
  );
}
