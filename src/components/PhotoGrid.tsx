"use client";

import { useCallback } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Heart, FileVideo } from "lucide-react";
import { Photo } from "@/types";
import clsx from "clsx";

const getFileIcon = (photo: Photo) => {
  if (photo.type === "video") {
    return <FileVideo className="w-3.5 h-3.5" />;
  }
  return null;
};

const getFileLabel = (photo: Photo) => {
  if (photo.thumbnail) {
    const ext = photo.thumbnail.split(".").pop()?.toLowerCase();
    if (ext && ["mp4", "mov", "avi", "mkv", "webm"].includes(ext)) {
      return ext.toUpperCase();
    }
    if (photo.type === "video") return "VID";
  }
  return null;
};

interface PhotoGridProps {
  photos: Photo[];
  onSelect?: (photo: Photo, isMultiSelect: boolean) => void;
  onPhotoOpen?: (photo: Photo) => void;
  selectedIds?: Set<string>;
  viewMode?: "grid" | "list";
}

export function PhotoGrid({ photos, onSelect, onPhotoOpen, selectedIds = new Set(), viewMode = "grid" }: PhotoGridProps) {
  const handleCheckboxClick = useCallback((photo: Photo, e: React.MouseEvent) => {
    e.stopPropagation();
    const isMultiSelect = e.shiftKey || e.ctrlKey || e.metaKey;
    onSelect?.(photo, isMultiSelect);
  }, [onSelect]);

  const handleImageClick = useCallback((photo: Photo) => {
    onPhotoOpen?.(photo);
  }, [onPhotoOpen]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (viewMode === "list") {
    return (
      <div className="space-y-1">
        {photos.map((photo) => {
          const isSelected = selectedIds.has(photo.id);
          
          return (
            <motion.div
              key={photo.id}
              layout
              className={clsx(
                "flex items-center gap-4 p-2 rounded-lg cursor-pointer transition-colors",
                isSelected ? "bg-[--accent]/20" : "hover:bg-[--surfaceHover]/50"
              )}
              onClick={() => handleImageClick(photo)}
            >
              <button
                type="button"
                onClick={(e) => handleCheckboxClick(photo, e)}
                className={clsx(
                  "w-5 h-5 rounded flex items-center justify-center border-2 transition-colors",
                  isSelected 
                    ? "bg-[--accent] border-[--accent]" 
                    : "border-gray-500 hover:border-white"
                )}
              >
                {isSelected && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-[--surface]">
                <Image
                  src={photo.thumbnail}
                  alt=""
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="flex-1">
                <p className="text-sm truncate">Photo {photo.id}</p>
                <p className="text-xs opacity-60">{formatDate(photo.createdAt)}</p>
              </div>
              
              {photo.favorite && <Heart className="w-4 h-4 fill-red-500 text-red-500" />}
            </motion.div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-1 sm:gap-2">
      {photos.map((photo, index) => {
        const isSelected = selectedIds.has(photo.id);

        return (
          <div
            key={photo.id}
            className={clsx(
              "relative aspect-square rounded-xl overflow-hidden cursor-pointer group",
              isSelected && "ring-2 ring-[--accent] ring-offset-2 ring-offset-[--background]"
            )}
            onClick={() => handleImageClick(photo)}
          >
            <Image
              src={photo.thumbnail}
              alt=""
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              priority={index < 8}
              onClick={() => handleImageClick(photo)}
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-xs text-white/60">{formatDate(photo.createdAt)}</p>
              </div>
            </div>
            
            <div 
              className="absolute top-2 left-2 z-20"
              onClick={(e) => handleCheckboxClick(photo, e)}
            >
              <button
                type="button"
                className={clsx(
                  "w-6 h-6 rounded-full flex items-center justify-center transition-colors border-2",
                  isSelected 
                    ? "bg-[--accent] border-[--accent]" 
                    : "bg-black/40 border-white/50 hover:border-white"
                )}
              >
                {isSelected && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            </div>
            
            <div className="absolute top-2 right-2 z-20">
              <div className="flex items-center gap-1">
                {photo.type === "video" && (
                  <div className="w-7 h-7 rounded-full bg-black/60 flex items-center justify-center">
                    <FileVideo className="w-3.5 h-3.5" />
                  </div>
                )}
                {photo.type === "photo" && (
                  <div className="px-1.5 h-5 rounded bg-black/60 flex items-center justify-center text-white">
                    <span className="text-[10px] font-medium text-white">
                      {photo.thumbnail?.split(".").pop()?.toUpperCase() || "IMG"}
                    </span>
                  </div>
                )}
                {photo.favorite && (
                  <div className="w-7 h-7 rounded-full bg-black/60 flex items-center justify-center">
                    <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}