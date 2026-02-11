"use client";

import { useState, useCallback } from "react";
import { MapView, type MapMarker } from "./MapView";
import { Button } from "@/components/ui/button";
import { formatDistance } from "@/lib/geo";

interface NearbyClinic {
  id: string;
  name: string;
  slug: string;
  type: string;
  address: string | null;
  phone: string | null;
  logo_url: string | null;
  services: string[];
  location_lat: number;
  location_lng: number;
  distance: number;
}

interface ClinicMapSectionProps {
  lang: string;
}

const RADIUS_OPTIONS = [1, 5, 10, 25];

export function ClinicMapSection({ lang }: ClinicMapSectionProps) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [clinics, setClinics] = useState<NearbyClinic[]>([]);
  const [radius, setRadius] = useState(10);
  const [loading, setLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  const fetchNearby = useCallback(
    async (lat: number, lng: number, r: number) => {
      setLoading(true);
      setGeoError(null);
      try {
        const res = await fetch(
          `/api/clinics/nearby?lat=${lat}&lng=${lng}&radius=${r}&limit=100`
        );
        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }
        const data = await res.json();
        setClinics(data.clinics);
        setFetched(true);
      } catch (err) {
        setGeoError(
          err instanceof Error ? err.message : "Failed to fetch nearby clinics"
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleNearMe = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError(
        lang === "ne"
          ? "तपाईंको ब्राउजरले स्थान समर्थन गर्दैन"
          : "Your browser does not support geolocation"
      );
      return;
    }

    setLoading(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc: [number, number] = [
          position.coords.latitude,
          position.coords.longitude,
        ];
        setUserLocation(loc);
        fetchNearby(loc[0], loc[1], radius);
      },
      (error) => {
        setLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGeoError(
              lang === "ne"
                ? "स्थान अनुमति अस्वीकृत। कृपया ब्राउजर सेटिङमा अनुमति दिनुहोस्।"
                : "Location permission denied. Please enable it in your browser settings."
            );
            break;
          case error.POSITION_UNAVAILABLE:
            setGeoError(
              lang === "ne"
                ? "स्थान जानकारी उपलब्ध छैन"
                : "Location information unavailable"
            );
            break;
          default:
            setGeoError(
              lang === "ne"
                ? "स्थान प्राप्त गर्न असफल"
                : "Failed to get location"
            );
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [lang, radius, fetchNearby]);

  const handleRadiusChange = useCallback(
    (newRadius: number) => {
      setRadius(newRadius);
      if (userLocation) {
        fetchNearby(userLocation[0], userLocation[1], newRadius);
      }
    },
    [userLocation, fetchNearby]
  );

  const markers: MapMarker[] = clinics.map((clinic) => ({
    id: clinic.id,
    lat: clinic.location_lat,
    lng: clinic.location_lng,
    title: clinic.name,
    subtitle: clinic.address || undefined,
    type: clinic.type,
    href: `/${lang}/clinic/${clinic.slug}`,
    distance: clinic.distance,
  }));

  const t = {
    nearMe: lang === "ne" ? "मेरो नजिक" : "Near Me",
    radius: lang === "ne" ? "दायरा" : "Radius",
    loading: lang === "ne" ? "खोजिदैछ..." : "Searching...",
    noResults:
      lang === "ne"
        ? "यो दायरामा कुनै संस्था भेटिएन"
        : "No facilities found within this radius",
    found: lang === "ne" ? "संस्था भेटिए" : "facilities found",
    mapView: lang === "ne" ? "नक्सा" : "Map",
    listView: lang === "ne" ? "सूची" : "List",
    enableLocation:
      lang === "ne"
        ? "'मेरो नजिक' थिच्नुहोस् नजिकका क्लिनिक र अस्पतालहरू हेर्न"
        : "Click 'Near Me' to find clinics and hospitals near you",
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleNearMe}
          disabled={loading}
          className="gap-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          {loading ? t.loading : t.nearMe}
        </Button>

        {/* Radius filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold uppercase tracking-wide">
            {t.radius}:
          </span>
          <div className="flex gap-1">
            {RADIUS_OPTIONS.map((r) => (
              <button
                key={r}
                onClick={() => handleRadiusChange(r)}
                disabled={loading}
                className={`px-3 py-1 text-sm font-bold border-2 transition-colors ${
                  radius === r
                    ? "bg-foreground text-white border-foreground"
                    : "bg-white text-foreground border-foreground hover:bg-muted"
                }`}
              >
                {r}km
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error message */}
      {geoError && (
        <div className="px-4 py-3 bg-primary-red/10 border-2 border-primary-red text-sm font-medium text-primary-red">
          {geoError}
        </div>
      )}

      {/* Map */}
      <MapView
        markers={markers}
        userLocation={userLocation}
        className="h-[400px] lg:h-[500px]"
      />

      {/* Results summary */}
      {fetched && !loading && (
        <p className="text-sm font-medium">
          <span className="text-primary-blue">{clinics.length}</span>{" "}
          {t.found}
          {userLocation && ` (${formatDistance(radius)} ${t.radius.toLowerCase()})`}
        </p>
      )}

      {!fetched && !loading && (
        <p className="text-sm text-foreground/60">{t.enableLocation}</p>
      )}

      {/* Nearby clinics list (sorted by distance) */}
      {fetched && clinics.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clinics.map((clinic) => (
            <a
              key={clinic.id}
              href={`/${lang}/clinic/${clinic.slug}`}
              className="block bg-white border-4 border-foreground p-4 hover:-translate-y-1 transition-transform shadow-lg"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary-blue">
                    {clinic.type}
                  </span>
                  <h4 className="font-bold text-base leading-tight line-clamp-2 mt-1">
                    {clinic.name}
                  </h4>
                </div>
                <span className="flex-shrink-0 px-2 py-1 bg-foreground text-white text-xs font-bold">
                  {formatDistance(clinic.distance)}
                </span>
              </div>
              {clinic.address && (
                <p className="text-sm text-foreground/60 mt-2 line-clamp-1">
                  {clinic.address}
                </p>
              )}
            </a>
          ))}
        </div>
      )}

      {fetched && clinics.length === 0 && !loading && (
        <p className="text-center text-foreground/60 py-8">{t.noResults}</p>
      )}
    </div>
  );
}
