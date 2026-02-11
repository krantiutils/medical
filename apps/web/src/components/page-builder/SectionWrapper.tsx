"use client";

import type { ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SectionWrapperProps {
  id: string;
  children: ReactNode;
  isSelected: boolean;
  isHidden: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onToggleVisibility: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  sectionLabel: string;
}

export function SectionWrapper({
  id,
  children,
  isSelected,
  isHidden,
  onSelect,
  onRemove,
  onDuplicate,
  onToggleVisibility,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  sectionLabel,
}: SectionWrapperProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      id={`section-${id}`}
      ref={setNodeRef}
      style={style}
      className={`relative group ${isDragging ? "opacity-50 z-50" : ""} ${isHidden ? "opacity-40" : ""}`}
    >
      {/* Selection ring */}
      <div
        className={`absolute inset-0 pointer-events-none transition-all z-10 ${
          isSelected ? "ring-4 ring-primary-blue ring-offset-2" : "ring-0"
        }`}
      />

      {/* Drag handle + label */}
      <div className="absolute left-0 top-0 z-20 flex items-center gap-1">
        <button
          type="button"
          className="flex items-center gap-1 px-2 py-1 bg-foreground text-white text-xs font-bold uppercase tracking-wider cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
          {...attributes}
          {...listeners}
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="4" cy="3" r="1.5" />
            <circle cx="4" cy="8" r="1.5" />
            <circle cx="4" cy="13" r="1.5" />
            <circle cx="10" cy="3" r="1.5" />
            <circle cx="10" cy="8" r="1.5" />
            <circle cx="10" cy="13" r="1.5" />
          </svg>
          {sectionLabel}
        </button>
      </div>

      {/* Action bar (top-right) */}
      <div className="absolute right-0 top-0 z-20 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {!isFirst && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
            className="p-1.5 bg-foreground text-white hover:bg-primary-blue transition-colors"
            title="Move up"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        )}
        {!isLast && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
            className="p-1.5 bg-foreground text-white hover:bg-primary-blue transition-colors"
            title="Move down"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleVisibility(); }}
          className="p-1.5 bg-foreground text-white hover:bg-primary-blue transition-colors"
          title={isHidden ? "Show" : "Hide"}
        >
          {isHidden ? (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
          className="p-1.5 bg-foreground text-white hover:bg-primary-blue transition-colors"
          title="Duplicate"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="p-1.5 bg-primary-red text-white hover:bg-red-700 transition-colors"
          title="Delete"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Section content - clickable to select */}
      <div
        onClick={onSelect}
        className="cursor-pointer"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onSelect(); }}
      >
        {children}
      </div>
    </div>
  );
}
