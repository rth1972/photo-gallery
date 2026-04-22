export interface Photo {
  id: string;
  url: string;
  thumbnail: string;
  width: number;
  height: number;
  createdAt: string;
  type: "photo" | "video";
  duration?: number;
  favorite: boolean;
  archive: boolean;
  deletedAt?: string | null;
  rotation: number;
  tags: string[];
  latitude?: number;
  longitude?: number;
  location?: string;
  edits?: {
    brightness?: number;
    contrast?: number;
    saturation?: number;
    warmth?: number;
    filter?: string;
    aiUrl?: string;
  };
  aiTags?: string[];
  exif?: {
    make?: string;
    model?: string;
    dateTimeOriginal?: string;
    exposureTime?: string;
    fNumber?: string;
    iso?: number;
    focalLength?: string;
  };
}

export interface Album {
  id: string;
  name: string;
  coverPhoto?: string;
  coverPhotoId?: string;
  photoCount: number;
  isShared: boolean;
  shareLink?: string;
  createdAt: string;
  userId?: string;
  collaborators?: Collaborator[];
}

export interface Collaborator {
  id: string;
  userId: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface Person {
  id: string;
  name: string;
  avatar?: string;
}

export interface AssetResponse {
  items: Photo[];
  total: number;
  hasNextPage: boolean;
}

export interface DateGroup {
  date: string;
  label: string;
  photos: Photo[];
}
