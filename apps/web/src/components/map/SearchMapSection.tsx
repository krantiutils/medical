"use client";

import { useState, useCallback } from "react";
import { MapView, type MapMarker } from "./MapView";
import { Button } from "@/components/ui/button";
import { formatDistance } from "@/lib/geo";

interface NearbyProfessional {
  id: string;
  type: string;
  full_name: string;
  full_name_ne: string | null;
  slug: string;
  degree: string | null;
  specialties: string[];
  address: string | null;
  distance: number;
  nearestClinic: {
    id: string;
    name: string;
    slug: string;
    location_lat: number;
    location_lng: number;
    address: string | null;
  } | null;
}

interface SearchMapSectionProps {
  lang: string;
}

const RADIUS_OPTIONS = [1, 5, 10, 25];

function getProfileUrl(
  professional: { type: string; slug: string },
  lang: string
): string {
  switch (professional.type) {
    case "DOCTOR":
      return `/${lang}/doctors/${professional.slug}`;
    case "DENTIST":
      return `/${lang}/dentists/${professional.slug}`;
    case "PHARMACIST":
      return `/${lang}/pharmacists/${professional.slug}`;
    default:
      return `/${lang}/doctors/${professional.slug}`;
  }
}

function getTypeLabel(type: string): string {
  switch (type) {
    case "DOCTOR":
      return "Doctor";
    case "DENTIST":
      return "Dentist";
    case "PHARMACIST":
      return "Pharmacist";
    default:
      return type;
  }
}

export function SearchMapSection({ lang }: SearchMapSectionProps) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null
  );
  const [professionals, setProfessionals] = useState<NearbyProfessional[]>([]);
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
          `/api/professionals/nearby?lat=${lat}&lng=${lng}&radius=${r}&limit=100`
        );
        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }
        const data = await res.json();
        setProfessionals(data.professionals);
        setFetched(true);
      } catch (err) {
        setGeoError(
          err instanceof Error
            ? err.message
            : "Failed to fetch nearby professionals"
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleNearMe = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError("Your browser does not support geolocation");
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
              "Location permission denied. Please enable it in your browser settings."
            );
            break;
          case error.POSITION_UNAVAILABLE:
            setGeoError("Location information unavailable");
            break;
          default:
            setGeoError("Failed to get location");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [radius, fetchNearby]);

  const handleRadiusChange = useCallback(
    (newRadius: number) => {
      setRadius(newRadius);
      if (userLocation) {
        fetchNearby(userLocation[0], userLocation[1], newRadius);
      }
    },
    [userLocation, fetchNearby]
  );

  const markers: MapMarker[] = professionals
    .filter((p) => p.nearestClinic)
    .map((prof) => ({
      id: prof.id,
      lat: prof.nearestClinic!.location_lat,
      lng: prof.nearestClinic!.location_lng,
      title: prof.full_name,
      subtitle: prof.nearestClinic!.name,
      type: getTypeLabel(prof.type),
      href: getProfileUrl(prof, lang),
      distance: prof.distance,
    }));

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
          {loading ? "Searching..." : "Near Me"}
        </Button>

        {/* Radius filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold uppercase tracking-wide">
            Radius:
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

      {/* Error */}
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

      {/* Results */}
      {fetched && !loading && (
        <p className="text-sm font-medium">
          <span className="text-primary-blue">{professionals.length}</span>{" "}
          professional{professionals.length !== 1 ? "s" : ""} found
          {userLocation && ` within ${formatDistance(radius)}`}
        </p>
      )}

      {!fetched && !loading && (
        <p className="text-sm text-foreground/60">
          Click &apos;Near Me&apos; to find healthcare professionals near you
        </p>
      )}

      {/* Nearby professionals list */}
      {fetched && professionals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {professionals.map((prof) => (
            <a
              key={prof.id}
              href={getProfileUrl(prof, lang)}
              className="block bg-white border-4 border-foreground p-4 hover:-translate-y-1 transition-transform shadow-lg"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary-blue">
                    {getTypeLabel(prof.type)}
                  </span>
                  <h4 className="font-bold text-base leading-tight line-clamp-2 mt-1">
                    {prof.full_name}
                  </h4>
                </div>
                <span className="flex-shrink-0 px-2 py-1 bg-foreground text-white text-xs font-bold">
                  {formatDistance(prof.distance)}
                </span>
              </div>
              {prof.degree && (
                <p className="text-sm text-foreground/60 mt-1 line-clamp-1">
                  {prof.degree}
                </p>
              )}
              {prof.nearestClinic && (
                <p className="text-xs text-foreground/50 mt-1 line-clamp-1">
                  at {prof.nearestClinic.name}
                </p>
              )}
            </a>
          ))}
        </div>
      )}

      {fetched && professionals.length === 0 && !loading && (
        <p className="text-center text-foreground/60 py-8">
          No professionals found within this radius
        </p>
      )}
    </div>
  );
}
