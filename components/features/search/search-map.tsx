"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Supercluster from "supercluster";
import type { Feature, Point } from "geojson";
import { useEffect, useMemo, useRef, useState } from "react";
import { CircleMarker, MapContainer, Marker, Polygon, Polyline, TileLayer, ZoomControl, useMap, useMapEvents } from "react-leaflet";
import { useTheme } from "next-themes";
import { Check, PenLine, Undo2, X } from "lucide-react";
import { locale } from "@/config/locale";
import { pointInPolygon } from "@/lib/search/filter";
import { shortPrice } from "@/lib/search/describe";
import type { Pin } from "@/app/api/listings/pins/route";
import { cn } from "@/lib/utils";

export interface SearchMapProps {
  pins: Pin[];
  hoveredId: string | null;
  selectedId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string | null) => void;
  polygon?: [number, number][];
  onPolygonChange: (polygon: [number, number][] | undefined) => void;
  children?: React.ReactNode;
}

type PinFeature = Feature<Point, { pin: Pin }>;

// Icons are cached by visual state so React-Leaflet only swaps the one icon whose state changed.
const iconCache = new Map<string, L.DivIcon>();
function pinIcon(pin: Pin, active: boolean, outside: boolean) {
  const key = `${pin.id}|${active}|${outside}`;
  let icon = iconCache.get(key);
  if (!icon) {
    const label = `${shortPrice(pin.price)}${pin.purpose === "rent" ? "/mo" : ""}`;
    icon = L.divIcon({ className: "", iconSize: [0, 0], html: `<div class="nestly-pin" data-active="${active}" data-outside="${outside}">${label}</div>` });
    iconCache.set(key, icon);
  }
  return icon;
}
function clusterIcon(count: number) {
  const key = `cluster|${count}`;
  let icon = iconCache.get(key);
  if (!icon) {
    const size = 34 + Math.min(22, count);
    icon = L.divIcon({ className: "", iconSize: [0, 0], html: `<div class="nestly-cluster" style="width:${size}px;height:${size}px">${count}</div>` });
    iconCache.set(key, icon);
  }
  return icon;
}

function Clusters({ pins, hoveredId, selectedId, onHover, onSelect, polygon }: Omit<SearchMapProps, "onPolygonChange" | "children">) {
  const map = useMap();
  const index = useMemo(() => {
    const s = new Supercluster<{ pin: Pin }>({ radius: 56, maxZoom: 16 });
    s.load(pins.map((pin): PinFeature => ({ type: "Feature", properties: { pin }, geometry: { type: "Point", coordinates: [pin.lng, pin.lat] } })));
    return s;
  }, [pins]);
  // Map events only trigger a re-render; bounds and zoom are always read fresh from the map, so a
  // new result set (or a fitBounds that lands before our listener fires) can't use a stale view.
  const [, rerender] = useState(0);
  useMapEvents({ moveend: () => rerender((n) => n + 1), zoomend: () => rerender((n) => n + 1) });

  const b = map.getBounds();
  const features = index.getClusters([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()], Math.round(map.getZoom()));

  return features.map((f) => {
    const [lng, lat] = f.geometry.coordinates;
    if ("cluster" in f.properties && f.properties.cluster) {
      const id = f.properties.cluster_id;
      const count = f.properties.point_count;
      return (
        <Marker key={`c${id}`} position={[lat, lng]} icon={clusterIcon(count)} title={`${count} homes here. Zoom in`}
          eventHandlers={{ click: () => map.flyTo([lat, lng], Math.min(index.getClusterExpansionZoom(id), 17), { duration: 0.6 }) }} />
      );
    }
    const pin = (f.properties as { pin: Pin }).pin;
    const active = pin.id === hoveredId || pin.id === selectedId;
    const outside = !!polygon && !pointInPolygon(pin.lat, pin.lng, polygon);
    return (
      <Marker key={pin.id} position={[lat, lng]} icon={pinIcon(pin, active, outside)} zIndexOffset={active ? 1000 : 0}
        title={`${pin.title}, ${shortPrice(pin.price)}`} alt={pin.title}
        eventHandlers={{ mouseover: () => onHover(pin.id), mouseout: () => onHover(null), click: () => onSelect(pin.id) }} />
    );
  });
}

/** Fits the view to the results whenever the result set changes (not while an area is drawn). */
function FitToPins({ pins, skip }: { pins: Pin[]; skip: boolean }) {
  const map = useMap();
  const signature = pins.map((p) => p.id).join();
  useEffect(() => {
    if (skip || !pins.length) return;
    map.fitBounds(L.latLngBounds(pins.map((p) => [p.lat, p.lng] as [number, number])), { padding: [48, 48], maxZoom: 15 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, skip, map]);
  return null;
}

/** Keeps Leaflet's size in sync when the split view or mobile toggle resizes the container. */
function ResizeSync() {
  const map = useMap();
  useEffect(() => {
    const ro = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    ro.observe(map.getContainer());
    return () => ro.disconnect();
  }, [map]);
  return null;
}

function DrawCapture({ onPoint }: { onPoint: (p: [number, number]) => void }) {
  const map = useMap();
  useEffect(() => {
    map.doubleClickZoom.disable();
    map.getContainer().style.cursor = "crosshair";
    return () => {
      map.doubleClickZoom.enable();
      map.getContainer().style.cursor = "";
    };
  }, [map]);
  useMapEvents({ click: (e) => onPoint([e.latlng.lat, e.latlng.lng]) });
  return null;
}

const control = "inline-flex h-10 items-center gap-2 rounded-full bg-card px-4 text-sm shadow-md ring-1 ring-hairline transition-colors hover:bg-muted disabled:opacity-50";

export default function SearchMap(props: SearchMapProps) {
  const { polygon, onPolygonChange, children } = props;
  const { resolvedTheme } = useTheme();
  const stroke = resolvedTheme === "dark" ? "#4cc3a4" : "#003c33";
  const [drawing, setDrawing] = useState(false);
  const [draft, setDraft] = useState<[number, number][]>([]);
  const wrapper = useRef<HTMLDivElement>(null);

  const cancel = () => { setDrawing(false); setDraft([]); };
  const finish = () => { onPolygonChange(draft); cancel(); };

  useEffect(() => {
    if (!drawing) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") cancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawing]);

  return (
    <div ref={wrapper} className="relative size-full overflow-hidden" role="region" aria-label="Map of search results">
      <MapContainer center={locale.map.center} zoom={locale.map.zoom} zoomControl={false} className="size-full" scrollWheelZoom>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ZoomControl position="bottomright" />
        <ResizeSync />
        <FitToPins pins={props.pins} skip={!!polygon} />
        <Clusters {...props} />
        {drawing && <DrawCapture onPoint={(p) => setDraft((d) => [...d, p])} />}
        {drawing && draft.length > 0 && (
          <>
            <Polyline positions={draft.length > 2 ? [...draft, draft[0]] : draft} pathOptions={{ color: stroke, weight: 2, dashArray: "4 6" }} />
            {draft.map((p, i) => <CircleMarker key={i} center={p} radius={4} pathOptions={{ color: stroke, fillColor: "#fff", fillOpacity: 1, weight: 2 }} />)}
          </>
        )}
        {polygon && !drawing && <Polygon positions={polygon} pathOptions={{ color: stroke, weight: 2, fillColor: stroke, fillOpacity: 0.08 }} />}
      </MapContainer>

      <div className="absolute left-3 top-3 z-[1000] flex flex-wrap gap-2">
        {!drawing ? (
          <>
            <button type="button" className={control} onClick={() => setDrawing(true)} aria-label="Draw an area to search within">
              <PenLine className="size-4" aria-hidden /> {polygon ? "Redraw area" : "Draw area"}
            </button>
            {polygon && (
              <button type="button" className={control} onClick={() => onPolygonChange(undefined)}>
                <X className="size-4" aria-hidden /> Clear area
              </button>
            )}
          </>
        ) : (
          <>
            <button type="button" className={cn(control, "bg-primary text-primary-foreground hover:bg-primary/90")} disabled={draft.length < 3} onClick={finish}>
              <Check className="size-4" aria-hidden /> Search this area
            </button>
            <button type="button" className={control} disabled={!draft.length} onClick={() => setDraft((d) => d.slice(0, -1))} aria-label="Undo last point">
              <Undo2 className="size-4" aria-hidden />
            </button>
            <button type="button" className={control} onClick={cancel}>Cancel</button>
          </>
        )}
      </div>
      {drawing && (
        <p role="status" className="absolute inset-x-0 bottom-6 z-[1000] mx-auto w-fit rounded-full bg-[#17171c] px-4 py-2 text-sm text-white shadow-lg">
          {draft.length < 3 ? `Click the map to outline an area (${draft.length}/3 points)` : "Add more points or press “Search this area”"}
        </p>
      )}
      {children}
    </div>
  );
}
