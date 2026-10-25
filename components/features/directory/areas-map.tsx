"use client";

import "leaflet/dist/leaflet.css";
import { useMemo } from "react";
import L from "leaflet";
import { Circle, MapContainer, TileLayer, Tooltip } from "react-leaflet";
import { useTheme } from "next-themes";
import type { GeoPoint } from "@/lib/data/types";

/** Circles over the neighbourhoods an agent or agency covers. */
export default function AreasMap({ areas }: { areas: { id: string; name: string; center: GeoPoint }[] }) {
  const { resolvedTheme } = useTheme();
  const color = resolvedTheme === "dark" ? "#2a9d84" : "#00876a";
  const bounds = useMemo(
    () => (areas.length ? L.latLngBounds(areas.map((a) => [a.center.lat, a.center.lng] as [number, number])).pad(0.6) : undefined),
    [areas],
  );
  return (
    <MapContainer bounds={bounds} center={bounds ? undefined : [31.47, 74.31]} zoom={bounds ? undefined : 11} scrollWheelZoom={false} className="size-full">
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {areas.map((a) => (
        <Circle key={a.id} center={[a.center.lat, a.center.lng]} radius={1600} pathOptions={{ color, weight: 2, fillColor: color, fillOpacity: 0.15 }}>
          <Tooltip permanent direction="center" className="!border-0 !bg-transparent !shadow-none !text-xs !font-medium">{a.name}</Tooltip>
        </Circle>
      ))}
    </MapContainer>
  );
}
