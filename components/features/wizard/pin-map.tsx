"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { GeoPoint } from "@/lib/data/types";

const icon = L.divIcon({ className: "", iconSize: [0, 0], html: `<div class="nestly-pin" data-active="true">Here</div>` });

function Recenter({ center }: { center: GeoPoint }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([center.lat, center.lng], 15, { duration: 0.6 });
  }, [center.lat, center.lng, map]);
  return null;
}

function ClickToPlace({ onChange }: { onChange: (p: GeoPoint) => void }) {
  useMapEvents({ click: (e) => onChange({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
}

/** Click the map (or drag the pin) to set the exact location. */
export default function PinMap({ center, value, onChange }: { center: GeoPoint; value: GeoPoint | null; onChange: (p: GeoPoint) => void }) {
  return (
    <MapContainer center={[center.lat, center.lng]} zoom={15} scrollWheelZoom className="size-full">
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Recenter center={center} />
      <ClickToPlace onChange={onChange} />
      {value && (
        <Marker position={[value.lat, value.lng]} icon={icon} draggable title="Property location" alt="Property location"
          eventHandlers={{ dragend: (e) => { const p = (e.target as L.Marker).getLatLng(); onChange({ lat: p.lat, lng: p.lng }); } }} />
      )}
    </MapContainer>
  );
}
