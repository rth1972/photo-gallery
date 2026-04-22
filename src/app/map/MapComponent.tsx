"use client";

import { Photo } from "@/types";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { divIcon } from "leaflet";
import { useEffect } from "react";

const createCustomIcon = (photo: Photo) => {
  return divIcon({
    html: `<div style="width: 40px; height: 40px; border-radius: 50%; overflow: hidden; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
      <img src="${photo.thumbnail}" style="width: 100%; height: 100%; object-fit: cover;" />
    </div>`,
    className: "custom-marker",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

function MapController({ photos }: { photos: Photo[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (photos.length > 0) {
      const bounds = L.latLngBounds(
        photos.map(p => [p.latitude!, p.longitude!] as [number, number])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, photos]);
  
  return null;
}

export default function MapComponent({ photos, theme }: { photos: Photo[]; theme: string }) {
  const tileUrl = theme === "dark"
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  return (
    <MapContainer
      center={[photos[0].latitude!, photos[0].longitude!]}
      zoom={3}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url={tileUrl}
      />
      <MapController photos={photos} />
      {photos.map((photo) => (
        <Marker
          key={photo.id}
          position={[photo.latitude!, photo.longitude!]}
          icon={createCustomIcon(photo)}
        >
          <Popup>
            <div className="w-32">
              <img
                src={photo.thumbnail}
                alt=""
                className="w-full h-24 object-cover rounded"
              />
              <p className="text-xs mt-1">
                {new Date(photo.createdAt).toLocaleDateString()}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}