"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function sanitizeHref(href: string): string {
  // Only allow relative paths starting with /
  if (href.startsWith("/")) return href;
  return "#";
}

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
  type?: string;
  href?: string;
  distance?: number;
}

interface MapViewProps {
  markers: MapMarker[];
  center?: [number, number];
  zoom?: number;
  className?: string;
  onMarkerClick?: (marker: MapMarker) => void;
  userLocation?: [number, number] | null;
}

// Nepal center coordinates (Kathmandu area)
const DEFAULT_CENTER: [number, number] = [27.7172, 85.324];
const DEFAULT_ZOOM = 12;

export function MapView({
  markers,
  center,
  zoom,
  className = "",
  onMarkerClick,
  userLocation,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<LeafletMap | null>(null);
  const onMarkerClickRef = useRef(onMarkerClick);
  onMarkerClickRef.current = onMarkerClick;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    let cancelled = false;

    async function initMap() {
      const L = (await import("leaflet")).default;

      // Fix default marker icons (Leaflet SSR issue with webpack)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (cancelled || !mapRef.current) return;

      const map = L.map(mapRef.current).setView(
        center || DEFAULT_CENTER,
        zoom || DEFAULT_ZOOM
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      leafletMapRef.current = map;
      setReady(true);
    }

    initMap();

    return () => {
      cancelled = true;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update markers when data changes
  useEffect(() => {
    if (!ready || !leafletMapRef.current) return;

    const map = leafletMapRef.current;

    async function updateMarkers() {
      const L = (await import("leaflet")).default;

      // Clear existing markers (except tile layers)
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
          map.removeLayer(layer);
        }
      });

      // Add user location marker
      if (userLocation) {
        const userIcon = L.divIcon({
          html: '<div style="width:16px;height:16px;background:#3B82F6;border:3px solid white;border-radius:50%;box-shadow:0 0 6px rgba(0,0,0,0.3);"></div>',
          iconSize: [16, 16],
          iconAnchor: [8, 8],
          className: "",
        });
        L.marker(userLocation, { icon: userIcon })
          .addTo(map)
          .bindPopup("You are here");
      }

      // Add markers
      const bounds = L.latLngBounds([]);

      for (const marker of markers) {
        const distText = marker.distance != null
          ? `<br><strong>${marker.distance < 1 ? Math.round(marker.distance * 1000) + "m" : marker.distance.toFixed(1) + "km"}</strong> away`
          : "";

        const safeType = escapeHtml(marker.type || "");
        const safeTitle = escapeHtml(marker.title);
        const safeSubtitle = marker.subtitle ? escapeHtml(marker.subtitle) : "";
        const safeHref = marker.href ? sanitizeHref(marker.href) : "";

        const popupContent = `
          <div style="min-width:180px;font-family:system-ui,sans-serif;">
            <div style="font-size:11px;text-transform:uppercase;font-weight:700;letter-spacing:0.05em;color:#6b7280;margin-bottom:2px;">${safeType}</div>
            <div style="font-weight:700;font-size:14px;margin-bottom:4px;">${safeTitle}</div>
            ${safeSubtitle ? `<div style="font-size:12px;color:#6b7280;">${safeSubtitle}</div>` : ""}
            ${distText}
            ${safeHref ? `<a href="${safeHref}" style="display:inline-block;margin-top:8px;padding:4px 12px;background:#121212;color:white;text-decoration:none;font-size:12px;font-weight:700;text-transform:uppercase;">View</a>` : ""}
          </div>
        `;

        const m = L.marker([marker.lat, marker.lng])
          .addTo(map)
          .bindPopup(popupContent);

        if (onMarkerClickRef.current) {
          const cb = onMarkerClickRef.current;
          m.on("click", () => cb(marker));
        }

        bounds.extend([marker.lat, marker.lng]);
      }

      if (userLocation) {
        bounds.extend(userLocation);
      }

      // Fit bounds if we have markers
      if (markers.length > 0) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      } else if (userLocation) {
        map.setView(userLocation, 13);
      }
    }

    updateMarkers();
  }, [markers, userLocation, ready]);

  // Update center/zoom when they change
  useEffect(() => {
    if (!ready || !leafletMapRef.current) return;
    if (center) {
      leafletMapRef.current.setView(center, zoom || DEFAULT_ZOOM);
    }
  }, [center, zoom, ready]);

  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        crossOrigin=""
      />
      <div
        ref={mapRef}
        className={`w-full border-4 border-foreground ${className}`}
        style={{ minHeight: "400px" }}
      />
    </>
  );
}
