declare module 'leaflet' {
  const L: any;
  export default L;
  export const divIcon: any;
  export const icon: any;
  export const marker: any;
}

declare module 'react-leaflet' {
  export { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
}