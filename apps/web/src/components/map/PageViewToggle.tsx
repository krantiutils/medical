"use client";

import { useState, type ReactNode } from "react";
import { ViewToggle } from "./ViewToggle";

interface PageViewToggleProps {
  lang: string;
  listContent: ReactNode;
  mapContent: ReactNode;
}

export function PageViewToggle({
  lang,
  listContent,
  mapContent,
}: PageViewToggleProps) {
  const [view, setView] = useState<"list" | "map">("list");

  return (
    <div>
      <div className="mb-6 flex items-center justify-end">
        <ViewToggle
          view={view}
          onToggle={setView}
          listLabel={lang === "ne" ? "सूची" : "List"}
          mapLabel={lang === "ne" ? "नक्सा" : "Map"}
        />
      </div>
      {view === "list" ? listContent : mapContent}
    </div>
  );
}
