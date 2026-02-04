"use client";

interface ClinicFiltersProps {
  lang: string;
  query: string;
  currentType?: string;
}

export function ClinicFilters({
  lang,
  query,
  currentType,
}: ClinicFiltersProps) {
  function buildUrl(type?: string) {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (type) params.set("type", type);
    const queryString = params.toString();
    return `/${lang}/clinics${queryString ? `?${queryString}` : ""}`;
  }

  function handleTypeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const type = e.target.value || undefined;
    window.location.href = buildUrl(type);
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <label htmlFor="clinic-type-filter" className="text-sm font-bold uppercase tracking-wide">
          {lang === "ne" ? "प्रकार:" : "Type:"}
        </label>
        <select
          id="clinic-type-filter"
          value={currentType || ""}
          onChange={handleTypeChange}
          className="px-4 py-2 bg-white border-2 border-foreground text-sm font-medium focus:outline-none focus:border-primary-blue cursor-pointer"
        >
          <option value="">{lang === "ne" ? "सबै प्रकार" : "All Types"}</option>
          <option value="CLINIC">{lang === "ne" ? "क्लिनिक" : "Clinic"}</option>
          <option value="POLYCLINIC">{lang === "ne" ? "पोलिक्लिनिक" : "Polyclinic"}</option>
          <option value="HOSPITAL">{lang === "ne" ? "अस्पताल" : "Hospital"}</option>
          <option value="PHARMACY">{lang === "ne" ? "औषधि पसल" : "Pharmacy"}</option>
        </select>
      </div>
    </div>
  );
}
