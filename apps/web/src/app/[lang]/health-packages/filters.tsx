"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface HealthPackageFiltersProps {
  lang: string;
  categories: string[];
  currentQuery: string;
  currentCategory: string;
}

const filterTranslations = {
  en: {
    searchPlaceholder: "Search packages...",
    filterCategory: "All Categories",
  },
  ne: {
    searchPlaceholder: "प्याकेजहरू खोज्नुहोस्...",
    filterCategory: "सबै श्रेणीहरू",
  },
};

export function HealthPackageFilters({
  lang,
  categories,
  currentQuery,
  currentCategory,
}: HealthPackageFiltersProps) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(currentQuery);
  const t = filterTranslations[lang as keyof typeof filterTranslations] || filterTranslations.en;

  const buildUrl = (query: string, category: string) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (category) params.set("category", category);
    const qs = params.toString();
    return `/${lang}/health-packages${qs ? `?${qs}` : ""}`;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(buildUrl(searchInput.trim(), currentCategory));
  };

  const handleCategoryChange = (category: string) => {
    router.push(buildUrl(currentQuery, category));
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-8">
      <form onSubmit={handleSearch} className="flex-1 flex">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="flex-1 p-3 border-4 border-foreground bg-white text-foreground font-medium focus:outline-none focus:border-primary-blue transition-colors"
        />
        <button
          type="submit"
          className="px-4 py-3 bg-foreground text-white border-4 border-foreground border-l-0 hover:bg-primary-blue hover:border-primary-blue transition-colors"
          aria-label="Search"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </form>
      <select
        value={currentCategory}
        onChange={(e) => handleCategoryChange(e.target.value)}
        className="p-3 border-4 border-foreground bg-white text-foreground font-medium focus:outline-none focus:border-primary-blue transition-colors min-w-[180px]"
      >
        <option value="">{t.filterCategory}</option>
        {categories.map((cat) => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>
    </div>
  );
}
