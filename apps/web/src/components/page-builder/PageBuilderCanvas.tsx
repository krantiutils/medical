"use client";

import { useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { PageSection } from "@/types/page-builder";
import { SECTION_TYPE_INFO } from "@/types/page-builder";
import { SectionWrapper } from "./SectionWrapper";
import { PublicSectionRenderer, type ClinicData } from "./sections/PublicSectionRenderer";
import type { StylePreset } from "./lib/style-presets";

interface PageBuilderCanvasProps {
  sections: PageSection[];
  selectedSectionId: string | null;
  lang: string;
  clinic: ClinicData;
  stylePreset: StylePreset;
  onSelectSection: (id: string | null) => void;
  onMoveSection: (fromIndex: number, toIndex: number) => void;
  onRemoveSection: (id: string) => void;
  onDuplicateSection: (id: string) => void;
  onToggleVisibility: (id: string) => void;
}

function getSectionLabel(type: string): string {
  return SECTION_TYPE_INFO.find((i) => i.type === type)?.label || type;
}

export function PageBuilderCanvas({
  sections,
  selectedSectionId,
  lang,
  clinic,
  stylePreset,
  onSelectSection,
  onMoveSection,
  onRemoveSection,
  onDuplicateSection,
  onToggleVisibility,
}: PageBuilderCanvasProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Auto-scroll to newly selected section
  useEffect(() => {
    if (!selectedSectionId) return;
    const timer = setTimeout(() => {
      const el = document.getElementById(`section-${selectedSectionId}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
    return () => clearTimeout(timer);
  }, [selectedSectionId]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const fromIndex = sections.findIndex((s) => s.id === active.id);
    const toIndex = sections.findIndex((s) => s.id === over.id);
    if (fromIndex !== -1 && toIndex !== -1) {
      onMoveSection(fromIndex, toIndex);
    }
  }

  if (sections.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background min-h-[400px]">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-foreground/10 border-4 border-dashed border-foreground/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <p className="text-foreground/60 font-bold">
            {lang === "ne" ? "खण्डहरू थप्नुहोस् वा टेम्प्लेट छान्नुहोस्" : "Add sections or pick a template"}
          </p>
          <p className="text-foreground/40 text-sm mt-1">
            {lang === "ne" ? "बायाँबाट खण्ड थप्नुहोस्" : "Click a section type on the left to add it"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 bg-background overflow-y-auto"
      onClick={(e) => {
        // Click on empty canvas space deselects
        if (e.target === e.currentTarget) {
          onSelectSection(null);
        }
      }}
    >
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1 py-4">
            {sections.map((section, index) => (
              <SectionWrapper
                key={section.id}
                id={section.id}
                isSelected={selectedSectionId === section.id}
                isHidden={!section.visible}
                onSelect={() => onSelectSection(section.id)}
                onRemove={() => onRemoveSection(section.id)}
                onDuplicate={() => onDuplicateSection(section.id)}
                onToggleVisibility={() => onToggleVisibility(section.id)}
                onMoveUp={() => onMoveSection(index, index - 1)}
                onMoveDown={() => onMoveSection(index, index + 1)}
                isFirst={index === 0}
                isLast={index === sections.length - 1}
                sectionLabel={getSectionLabel(section.type)}
              >
                <PublicSectionRenderer
                  section={section}
                  lang={lang}
                  clinic={clinic}
                  stylePreset={stylePreset}
                  isBuilder
                />
              </SectionWrapper>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
