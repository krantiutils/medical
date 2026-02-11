"use client";

interface ViewToggleProps {
  view: "list" | "map";
  onToggle: (view: "list" | "map") => void;
  listLabel?: string;
  mapLabel?: string;
}

export function ViewToggle({
  view,
  onToggle,
  listLabel = "List",
  mapLabel = "Map",
}: ViewToggleProps) {
  return (
    <div className="inline-flex border-2 border-foreground">
      <button
        onClick={() => onToggle("list")}
        className={`px-4 py-2 text-sm font-bold uppercase tracking-wider transition-colors flex items-center gap-2 ${
          view === "list"
            ? "bg-foreground text-white"
            : "bg-white text-foreground hover:bg-muted"
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
        {listLabel}
      </button>
      <button
        onClick={() => onToggle("map")}
        className={`px-4 py-2 text-sm font-bold uppercase tracking-wider transition-colors flex items-center gap-2 border-l-2 border-foreground ${
          view === "map"
            ? "bg-foreground text-white"
            : "bg-white text-foreground hover:bg-muted"
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        {mapLabel}
      </button>
    </div>
  );
}
