"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { PhotoGrid } from "@/components/PhotoGrid";
import { PhotoViewer } from "@/components/PhotoViewer";
import { Photo } from "@/types";

export default function SharedAlbumPage() {
  const params = useParams();
  const shareToken = params.shareToken as string;
  const [album, setAlbum] = useState<any>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [viewerPhoto, setViewerPhoto] = useState<Photo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/albums?shareToken=${shareToken}`)
      .then(res => res.json())
      .then(data => {
        setAlbum(data);
        if (data.photos) {
          setPhotos(data.photos.map((p: any) => ({
            id: p.photo.id,
            url: p.photo.url,
            thumbnail: p.photo.thumbnail,
            width: p.photo.width,
            height: p.photo.height,
            createdAt: p.photo.createdAt,
            type: p.photo.type,
            favorite: p.photo.favorite,
            archive: p.photo.archive,
            rotation: p.photo.rotation,
            tags: [],
          })));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [shareToken]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Album not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="p-4">
        <div className="mb-4">
          <h1 className="text-2xl font-bold">{album.name}</h1>
          <p className="text-gray-500">{photos.length} photos</p>
          <p className="text-sm text-[--accent] mt-2">Shared album</p>
        </div>
        
        <PhotoGrid
          photos={photos}
          onPhotoOpen={setViewerPhoto}
        />
      </main>
      
      <PhotoViewer
        photo={viewerPhoto}
        onClose={() => setViewerPhoto(null)}
      />
    </div>
  );
}
