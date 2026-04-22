import { Photo, Album, DateGroup } from "@/types";

// ─── Core photo fetcher (single source of truth) ──────────────────────────────
// Returns a flat array of mapped Photo objects.
// The API now returns { photos, nextCursor } — we unwrap that here.

export async function getPhotos(
  userId: string,
  options?: {
    favorite?: boolean;
    archive?: boolean;
    trash?: boolean;
    search?: string;
    startDate?: string;
    endDate?: string;
    cursor?: string;
    take?: number;
  }
): Promise<Photo[]> {
  if (!userId) return [];

  const params = new URLSearchParams({ userId });
  if (options?.trash)     params.set("includeTrash", "true");
  if (options?.favorite)  params.set("favorite", "true");
  if (options?.archive)   params.set("archive",  "true");
  if (options?.search)    params.set("search",   options.search);
  if (options?.startDate) params.set("startDate", options.startDate);
  if (options?.endDate)   params.set("endDate",   options.endDate);
  if (options?.cursor)    params.set("cursor",    options.cursor);
  if (options?.take)      params.set("take",      String(options.take));

  const res = await fetch(`/api/photos?${params}`);
  if (!res.ok) return [];

  const json = await res.json();
  // Handle both old shape (plain array) and new shape ({ photos, nextCursor })
  const raw: any[] = Array.isArray(json) ? json : (json.photos ?? []);

  return raw.map(mapPhoto);
}

// ─── Map raw DB row → typed Photo ─────────────────────────────────────────────
function mapPhoto(p: any): Photo {
  return {
    id:        p.id,
    url:       p.url,
    thumbnail: p.thumbnail,
    width:     p.width,
    height:    p.height,
    createdAt: p.createdAt,
    type:      p.type,
    favorite:  p.favorite,
    archive:   p.archive,
    deletedAt: p.deletedAt ?? null,
    rotation:  p.rotation ?? 0,
    latitude:  p.latitude,
    longitude: p.longitude,
    tags:      [],
    // Parse JSON strings only when present
    edits:   p.edits   ? (typeof p.edits === "string"   ? JSON.parse(p.edits)   : p.edits)   : undefined,
    aiTags:  p.aiTags  ? (typeof p.aiTags === "string"  ? JSON.parse(p.aiTags)  : p.aiTags)  : undefined,
    exif: (p.exifMake || p.exifModel)
      ? { make: p.exifMake, model: p.exifModel, dateTimeOriginal: p.exifDate }
      : undefined,
  };
}

// ─── Date groups — computed from the photos already in memory ─────────────────
// Previously this called getPhotos() a second time, causing a redundant HTTP
// round-trip on every page load.  Now it just re-groups what the caller
// already has.

export function buildDateGroups(photos: Photo[]): DateGroup[] {
  const today     = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd   = new Date(today.getFullYear(), today.getMonth(), 0);

  const buckets = new Map<string, Photo[]>();

  for (const photo of photos) {
    const d = new Date(photo.createdAt); d.setHours(0, 0, 0, 0);
    let label: string;

    if (d.getTime() === today.getTime())               label = "Today";
    else if (d.getTime() === yesterday.getTime())      label = "Yesterday";
    else if (d >= thisMonth)                           label = "This Month";
    else if (d >= lastMonthStart && d <= lastMonthEnd) label = "Last Month";
    else label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    if (!buckets.has(label)) buckets.set(label, []);
    buckets.get(label)!.push(photo);
  }

  return Array.from(buckets.entries()).map(([label, ps]) => ({
    label,
    date: ps[0].createdAt,
    photos: ps,
  }));
}

// Keep the old async signature so existing callers don't break,
// but have it use the photos that were already loaded.
export async function getDateGroups(userId: string): Promise<DateGroup[]> {
  const photos = await getPhotos(userId);
  return buildDateGroups(photos);
}

// ─── Albums ───────────────────────────────────────────────────────────────────

export async function getAlbums(userId: string): Promise<Album[]> {
  if (!userId) return [];
  const res = await fetch(`/api/albums?userId=${userId}`);
  if (!res.ok) return [];
  const albums: any[] = await res.json();

  return albums.map((a: any) => ({
    id:          a.id,
    name:        a.name,
    coverPhoto:  a.coverPhoto  ?? undefined,
    coverPhotoId: a.coverPhotoId ?? undefined,
    photoCount:  a.photoCount  ?? a._count?.photos ?? 0,
    isShared:    a.isShared    ?? false,
    shareLink:   a.shareLink   ?? undefined,
    createdAt:   a.createdAt,
  }));
}

export async function getAlbumById(userId: string, albumId: string): Promise<Album | undefined> {
  const res = await fetch(`/api/albums?userId=${userId}&albumId=${albumId}`);
  if (!res.ok) return undefined;
  const a = await res.json();
  if (!a) return undefined;
  return {
    id:          a.id,
    name:        a.name,
    coverPhoto:  a.coverPhoto,
    coverPhotoId: a.coverPhotoId,
    photoCount:  a._count?.photos ?? 0,
    isShared:    a.isShared,
    shareLink:   a.shareLink,
    createdAt:   a.createdAt,
    userId:      a.userId,
    collaborators: a.collaborators,
  };
}

export async function getPhotosByAlbum(userId: string, albumId: string): Promise<Photo[]> {
  const res = await fetch(`/api/albums/${albumId}/photos?userId=${userId}`);
  if (!res.ok) return [];
  const photos: any[] = await res.json();
  return photos.map(mapPhoto);
}

export async function getStorageUsage(userId: string): Promise<{ used: number; limit: number }> {
  const res = await fetch(`/api/user/storage?userId=${userId}`);
  if (!res.ok) return { used: 0, limit: 10737418240 };
  return res.json();
}
