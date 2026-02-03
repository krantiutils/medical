"use client";

import { useRouter } from "next/navigation";

interface SearchFiltersProps {
  lang: string;
  query: string;
  currentType?: string;
  currentLocation?: string;
  locations: string[];
}

export function SearchFilters({
  lang,
  query,
  currentType,
  currentLocation,
  locations,
}: SearchFiltersProps) {
  const router = useRouter();

  function buildUrl(type?: string, location?: string) {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (type) params.set("type", type);
    if (location) params.set("location", location);
    const queryString = params.toString();
    return `/${lang}/search${queryString ? `?${queryString}` : ""}`;
  }

  function handleTypeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const type = e.target.value || undefined;
    router.push(buildUrl(type, currentLocation));
  }

  function handleLocationChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const location = e.target.value || undefined;
    router.push(buildUrl(currentType, location));
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Type Filter Dropdown */}
      <div className="flex items-center gap-2">
        <label htmlFor="type-filter" className="text-sm font-bold uppercase tracking-wide">
          Type:
        </label>
        <select
          id="type-filter"
          value={currentType || ""}
          onChange={handleTypeChange}
          className="px-4 py-2 bg-white border-2 border-foreground text-sm font-medium focus:outline-none focus:border-primary-blue cursor-pointer"
        >
          <option value="">All Types</option>
          <option value="DOCTOR">Doctor</option>
          <option value="DENTIST">Dentist</option>
          <option value="PHARMACIST">Pharmacist</option>
        </select>
      </div>

      {/* Location Filter Dropdown */}
      <div className="flex items-center gap-2">
        <label htmlFor="location-filter" className="text-sm font-bold uppercase tracking-wide">
          Location:
        </label>
        <select
          id="location-filter"
          value={currentLocation || ""}
          onChange={handleLocationChange}
          className="px-4 py-2 bg-white border-2 border-foreground text-sm font-medium focus:outline-none focus:border-primary-blue cursor-pointer max-w-[200px]"
        >
          <option value="">All Locations</option>
          {locations.map((loc) => (
            <option key={loc} value={loc}>
              {loc.length > 30 ? loc.slice(0, 30) + "..." : loc}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
