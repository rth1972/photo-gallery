"use client";

import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { Loader2, MapPin } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PhotoViewer } from "@/components/PhotoViewer";
import { getPhotos } from "@/lib/data";
import { Photo } from "@/types";
import { useTheme } from "@/context/ThemeContext";

const DynamicMap = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin opacity-40" />
    </div>
  ),
});

export default function MapPage() {
  const { data: session, status } = useSession();
  const userId = status === "authenticated" ? (session?.user as any)?.id : "";
  const { theme } = useTheme();
  const [photos, setPhotos]        = useState<Photo[]>([]);
  const [viewerPhoto, setViewer]   = useState<Photo | null>(null);

  useEffect(() => {
    if (!userId) return;
    getPhotos(userId).then(all => setPhotos(all.filter(p => p.latitude && p.longitude)));
  }, [userId]);

  if (status === "loading" || !userId) return null;

  return (
    <AppShell
      title="Map"
      subtitle={photos.length ? `${photos.length} photos with location` : undefined}
      noPadding
      scrollable={false}
    >
      {photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-4">
          <div className="w-16 h-16 rounded-full bg-[--surfaceHover] flex items-center justify-center">
            <MapPin className="w-7 h-7 opacity-30" />
          </div>
          <p className="text-lg font-medium">No location data</p>
          <p className="text-sm text-[--text-secondary] max-w-xs">
            Photos with GPS coordinates will appear on the map.
          </p>
        </div>
      ) : (
        <div className="h-full">
          <DynamicMap photos={photos} theme={theme} />
        </div>
      )}

      <PhotoViewer photo={viewerPhoto} onClose={() => setViewer(null)} />
    </AppShell>
  );
}
