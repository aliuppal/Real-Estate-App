"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, Tooltip } from "react-leaflet";
import type { GeoPoint } from "@/lib/data/types";
import type { NearbyPlace } from "@/lib/nearby";

const homeIcon = L.divIcon({ className: "", iconSize: [0, 0], html: `<div class="nestly-pin" data-active="true">Home</div>` });
const placeIcon = (label: string) =>
  L.divIcon({ className: "", iconSize: [0, 0], html: `<div class="nestly-cluster" style="width:26px;height:26px;font-size:0.65rem">${label}</div>` });

const SHORT: Record<NearbyPlace["kind"], string> = { school: "Sc", hospital: "H", mosque: "M", park: "P", market: "Mk" };

export default function LocationMap({ location, places, title }: { location: GeoPoint; places: NearbyPlace[]; title: string }) {
  return (
    <MapContainer center={[location.lat, location.lng]} zoom={15} scrollWheelZoom={false} className="size-full">
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={[location.lat, location.lng]} icon={homeIcon} title={title} alt={title} zIndexOffset={1000} />
      {places.map((p) => (
        <Marker key={p.kind} position={[p.location.lat, p.location.lng]} icon={placeIcon(SHORT[p.kind])} title={p.name} alt={p.name}>
          <Tooltip direction="top" offset={[0, -14]}>{p.name} · {p.distanceKm} km</Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
}
