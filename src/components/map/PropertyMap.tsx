"use client";
import { useEffect, useRef, useState } from "react";
import type { Map as MapboxMap, Marker } from "mapbox-gl";
import type { PropertyIdentity } from "@/lib/property/types";
const markerSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="42" viewBox="0 0 36 42"><ellipse cx="18" cy="37" rx="12" ry="3" fill="#20392f" opacity=".18"/><path d="M18 39 11 29h14Z" fill="#315f48"/><path d="M6 17 18 6l12 11v16H6Z" fill="#f6f7ef" stroke="#315f48" stroke-width="2"/><path d="M18 6 32 18l-3 3L18 11 7 21l-3-3Z" fill="#315f48"/><path d="M18 11v21h12V21Z" fill="#dce9d7"/><path d="M14 23h8v10h-8Z" fill="#315f48"/><path d="M10 19h5v5h-5Z" fill="#a5c7af"/></svg>';
export default function PropertyMap({ property }: { property: PropertyIdentity | null }) {
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<MapboxMap | null>(null);
  const marker = useRef<Marker | null>(null);
  const latest = useRef(property);
  const initialization = useRef<Promise<void> | null>(null);
  const disposed = useRef(false);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "unavailable">("idle");
  useEffect(() => {
    disposed.current = false;
    return () => { disposed.current = true; marker.current?.remove(); map.current?.remove(); map.current = null; };
  }, []);
  useEffect(() => {
    latest.current = property;
    if (!property) { marker.current?.remove(); return; }
    const position = () => {
      const current = latest.current;
      if (!current || !map.current || !marker.current || disposed.current) return;
      map.current.resize(); map.current.jumpTo({ center: [current.location.x, current.location.y], zoom: 16, pitch: 0, bearing: 0 });
      marker.current.setLngLat([current.location.x, current.location.y]).addTo(map.current);
      marker.current.getElement().setAttribute("aria-label", `Confirmed parcel location for ${current.address}`);
    };
    if (map.current) { position(); return; }
    if (!initialization.current) {
      initialization.current = (async () => {
        const response = await fetch("/api/map-config");
        if (!response.ok) throw new Error("Map unavailable.");
        const config = await response.json();
        const mapbox = (await import("mapbox-gl")).default;
        if (disposed.current || !host.current || !latest.current) return;
        if (!mapbox.supported()) throw new Error("Map unavailable.");
        const current = latest.current;
        const instance = new mapbox.Map({ container: host.current, accessToken: config.token,
          style: "mapbox://styles/mapbox/light-v11", center: [current.location.x, current.location.y],
          zoom: 16, pitch: 0, bearing: 0, attributionControl: true, cooperativeGestures: true,
        });
        map.current = instance;
        instance.addControl(new mapbox.NavigationControl({ showCompass: false }), "top-right");
        instance.on("load", () => { if (!disposed.current) { setStatus("ready"); position(); } });
        instance.on("error", () => { if (!disposed.current) setStatus("unavailable"); });
        const element = document.createElement("div"); element.className = "house-marker"; element.innerHTML = markerSvg;
        element.setAttribute("role", "img"); marker.current = new mapbox.Marker({ element, anchor: "bottom" }); position();
      })().catch(() => { if (!disposed.current) setStatus("unavailable"); })
        .finally(() => { if (!map.current) initialization.current = null; });
    }
    void initialization.current.then(position);
  }, [property]);
  return <div className="map-panel" aria-label="Property location">
    <div className="map-canvas" ref={host} style={{ visibility: property && status !== "unavailable" ? "visible" : "hidden" }} />
    {(!property || status !== "ready") && <div className="map-placeholder" role="status"><div className="map-placeholder-symbol" aria-hidden="true">⌂</div>
      <h2>{!property ? "Put a property in context." : status === "unavailable" ? "The map is unavailable." : "Locating your property…"}</h2>
      <p>{!property ? "Search an address and confirm its parcel to see the location here." : status === "unavailable" ? "You can still review its address, parcel identifiers and source records." : "Your source records will appear independently of the map."}</p>
      {property && <p className="map-coordinate">{property.location.y.toFixed(6)}, {property.location.x.toFixed(6)}</p>}
    </div>}
    {property && status === "ready" && <div className="map-caption">{property.precision === "PointAddress" ? "Address-point location" : "Approximate location"} · Parcel boundaries are not a survey</div>}
  </div>;
}
