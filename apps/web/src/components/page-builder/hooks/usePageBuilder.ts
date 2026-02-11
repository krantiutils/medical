"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import type {
  PageBuilderConfig,
  PageSection,
  SectionType,
  NavbarConfig,
  FooterConfig,
  BuilderPage,
  StylePreset,
} from "@/types/page-builder";
import { createSection } from "../lib/section-defaults";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface UsePageBuilderReturn {
  config: PageBuilderConfig | null;
  setConfig: (config: PageBuilderConfig) => void;
  selectedSectionId: string | null;
  selectSection: (id: string | null) => void;
  selectedSection: PageSection | null;

  // Current page
  currentPageId: string | null;
  setCurrentPageId: (id: string) => void;
  currentPage: BuilderPage | null;

  // Page CRUD
  addPage: (slug: string, title: string, titleNe: string) => void;
  removePage: (id: string) => void;
  renamePage: (id: string, title: string, titleNe: string) => void;
  updatePageSlug: (id: string, slug: string) => void;
  togglePageVisibility: (id: string) => void;

  // Section CRUD (scoped to current page)
  addSection: (type: SectionType, index?: number) => void;
  removeSection: (id: string) => void;
  duplicateSection: (id: string) => void;
  moveSection: (fromIndex: number, toIndex: number) => void;
  updateSection: (id: string, updates: Partial<PageSection>) => void;
  updateSectionData: (id: string, dataUpdates: Record<string, unknown>) => void;
  toggleSectionVisibility: (id: string) => void;

  // Navbar & Footer
  updateNavbar: (navbar: NavbarConfig) => void;
  updateFooter: (footer: FooterConfig) => void;

  // Style preset
  setStylePreset: (preset: StylePreset) => void;

  // Enable/disable
  toggleEnabled: () => void;

  // Template
  applyTemplate: (config: PageBuilderConfig) => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;

  // Save
  isDirty: boolean;
  markClean: () => void;
  markDirty: () => void;
}

const MAX_UNDO_STACK = 50;

function generatePageId(): string {
  return `page-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
}

export function usePageBuilder(): UsePageBuilderReturn {
  const [config, setConfigRaw] = useState<PageBuilderConfig | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [currentPageId, setCurrentPageIdRaw] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const undoStack = useRef<PageBuilderConfig[]>([]);
  const redoStack = useRef<PageBuilderConfig[]>([]);

  const pushUndo = useCallback((prev: PageBuilderConfig) => {
    undoStack.current = [...undoStack.current.slice(-MAX_UNDO_STACK + 1), prev];
    redoStack.current = [];
  }, []);

  const setConfig = useCallback((newConfig: PageBuilderConfig) => {
    setConfigRaw(newConfig);
    // Auto-select the home page on initial load
    if (newConfig.pages.length > 0) {
      const home = newConfig.pages.find((p) => p.isHomePage) || newConfig.pages[0];
      setCurrentPageIdRaw(home.id);
    }
  }, []);

  const updateConfig = useCallback((updater: (prev: PageBuilderConfig) => PageBuilderConfig) => {
    setConfigRaw((prev) => {
      if (!prev) return prev;
      pushUndo(prev);
      const next = updater(prev);
      setIsDirty(true);
      return next;
    });
  }, [pushUndo]);

  const selectSection = useCallback((id: string | null) => {
    setSelectedSectionId(id);
  }, []);

  const setCurrentPageId = useCallback((id: string) => {
    setCurrentPageIdRaw(id);
    setSelectedSectionId(null); // deselect section when switching pages
  }, []);

  // Derived: current page
  const currentPage = useMemo(() => {
    if (!config || !currentPageId) return null;
    return config.pages.find((p) => p.id === currentPageId) ?? null;
  }, [config, currentPageId]);

  // Derived: selected section from current page
  const selectedSection = useMemo(() => {
    if (!currentPage || !selectedSectionId) return null;
    return currentPage.sections.find((s) => s.id === selectedSectionId) ?? null;
  }, [currentPage, selectedSectionId]);

  // Helper: update sections of the current page
  const updateCurrentPageSections = useCallback(
    (updater: (sections: PageSection[]) => PageSection[]) => {
      if (!currentPageId) return;
      updateConfig((prev) => ({
        ...prev,
        pages: prev.pages.map((p) =>
          p.id === currentPageId ? { ...p, sections: updater(p.sections) } : p
        ),
      }));
    },
    [currentPageId, updateConfig]
  );

  // --- Page CRUD ---

  const addPage = useCallback((slug: string, title: string, titleNe: string) => {
    const newPage: BuilderPage = {
      id: generatePageId(),
      slug,
      title,
      titleNe,
      sections: [],
      isHomePage: false,
      visible: true,
    };
    updateConfig((prev) => ({
      ...prev,
      pages: [...prev.pages, newPage],
    }));
    setCurrentPageIdRaw(newPage.id);
    setSelectedSectionId(null);
  }, [updateConfig]);

  const removePage = useCallback((id: string) => {
    updateConfig((prev) => {
      const page = prev.pages.find((p) => p.id === id);
      if (!page || page.isHomePage) return prev; // can't remove home page
      const newPages = prev.pages.filter((p) => p.id !== id);
      return { ...prev, pages: newPages };
    });
    setCurrentPageIdRaw((prevId) => {
      if (prevId === id) {
        // Switch to home page
        return config?.pages.find((p) => p.isHomePage)?.id ?? config?.pages[0]?.id ?? null;
      }
      return prevId;
    });
  }, [updateConfig, config]);

  const renamePage = useCallback((id: string, title: string, titleNe: string) => {
    updateConfig((prev) => ({
      ...prev,
      pages: prev.pages.map((p) =>
        p.id === id ? { ...p, title, titleNe } : p
      ),
    }));
  }, [updateConfig]);

  const updatePageSlug = useCallback((id: string, slug: string) => {
    updateConfig((prev) => ({
      ...prev,
      pages: prev.pages.map((p) =>
        p.id === id ? { ...p, slug } : p
      ),
    }));
  }, [updateConfig]);

  const togglePageVisibility = useCallback((id: string) => {
    updateConfig((prev) => ({
      ...prev,
      pages: prev.pages.map((p) =>
        p.id === id ? { ...p, visible: !p.visible } : p
      ),
    }));
  }, [updateConfig]);

  // --- Section CRUD (scoped to current page) ---

  const addSection = useCallback((type: SectionType, index?: number) => {
    const section = createSection(type);
    updateCurrentPageSections((sections) => {
      const newSections = [...sections];
      if (index !== undefined && index >= 0 && index <= newSections.length) {
        newSections.splice(index, 0, section);
      } else {
        newSections.push(section);
      }
      return newSections;
    });
    setSelectedSectionId(section.id);
  }, [updateCurrentPageSections]);

  const removeSection = useCallback((id: string) => {
    updateCurrentPageSections((sections) => sections.filter((s) => s.id !== id));
    setSelectedSectionId((prevId) => (prevId === id ? null : prevId));
  }, [updateCurrentPageSections]);

  const duplicateSection = useCallback((id: string) => {
    updateCurrentPageSections((sections) => {
      const index = sections.findIndex((s) => s.id === id);
      if (index === -1) return sections;
      const original = sections[index];
      const cloneId = `section-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const clone = JSON.parse(JSON.stringify(original)) as PageSection;
      clone.id = cloneId;
      clone.anchorId = `${clone.anchorId}-copy`;
      const newSections = [...sections];
      newSections.splice(index + 1, 0, clone);
      return newSections;
    });
  }, [updateCurrentPageSections]);

  const moveSection = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    updateCurrentPageSections((sections) => {
      const newSections = [...sections];
      const [moved] = newSections.splice(fromIndex, 1);
      newSections.splice(toIndex, 0, moved);
      return newSections;
    });
  }, [updateCurrentPageSections]);

  const updateSection = useCallback((id: string, updates: Partial<PageSection>) => {
    updateCurrentPageSections((sections) =>
      sections.map((s) =>
        s.id === id ? { ...s, ...updates } as PageSection : s
      )
    );
  }, [updateCurrentPageSections]);

  const updateSectionData = useCallback((id: string, dataUpdates: Record<string, unknown>) => {
    updateCurrentPageSections((sections) =>
      sections.map((s) => {
        if (s.id !== id) return s;
        return { ...s, data: { ...s.data, ...dataUpdates } } as PageSection;
      })
    );
  }, [updateCurrentPageSections]);

  const toggleSectionVisibility = useCallback((id: string) => {
    updateCurrentPageSections((sections) =>
      sections.map((s) =>
        s.id === id ? { ...s, visible: !s.visible } : s
      )
    );
  }, [updateCurrentPageSections]);

  // --- Navbar & Footer ---

  const updateNavbar = useCallback((navbar: NavbarConfig) => {
    updateConfig((prev) => ({ ...prev, navbar }));
  }, [updateConfig]);

  const updateFooter = useCallback((footer: FooterConfig) => {
    updateConfig((prev) => ({ ...prev, footer }));
  }, [updateConfig]);

  // --- Style preset ---

  const setStylePreset = useCallback((preset: StylePreset) => {
    updateConfig((prev) => ({ ...prev, stylePreset: preset }));
  }, [updateConfig]);

  // --- Enable/disable ---

  const toggleEnabled = useCallback(() => {
    updateConfig((prev) => ({ ...prev, enabled: !prev.enabled }));
  }, [updateConfig]);

  // --- Template ---

  const applyTemplate = useCallback((templateConfig: PageBuilderConfig) => {
    setConfigRaw((prev) => {
      if (prev) pushUndo(prev);
      setIsDirty(true);
      return templateConfig;
    });
    // Select the home page of the new template
    const home = templateConfig.pages.find((p) => p.isHomePage) || templateConfig.pages[0];
    if (home) {
      setCurrentPageIdRaw(home.id);
    }
    setSelectedSectionId(null);
  }, [pushUndo]);

  // --- Undo/Redo ---

  const undo = useCallback(() => {
    setConfigRaw((prev) => {
      if (!prev || undoStack.current.length === 0) return prev;
      redoStack.current = [...redoStack.current, prev];
      const restored = undoStack.current[undoStack.current.length - 1];
      undoStack.current = undoStack.current.slice(0, -1);
      setIsDirty(true);
      return restored;
    });
  }, []);

  const redo = useCallback(() => {
    setConfigRaw((prev) => {
      if (!prev || redoStack.current.length === 0) return prev;
      undoStack.current = [...undoStack.current, prev];
      const restored = redoStack.current[redoStack.current.length - 1];
      redoStack.current = redoStack.current.slice(0, -1);
      setIsDirty(true);
      return restored;
    });
  }, []);

  const markClean = useCallback(() => setIsDirty(false), []);
  const markDirty = useCallback(() => setIsDirty(true), []);

  return {
    config,
    setConfig,
    selectedSectionId,
    selectSection,
    selectedSection,
    currentPageId,
    setCurrentPageId,
    currentPage,
    addPage,
    removePage,
    renamePage,
    updatePageSlug,
    togglePageVisibility,
    addSection,
    removeSection,
    duplicateSection,
    moveSection,
    updateSection,
    updateSectionData,
    toggleSectionVisibility,
    updateNavbar,
    updateFooter,
    setStylePreset,
    toggleEnabled,
    applyTemplate,
    undo,
    redo,
    canUndo: undoStack.current.length > 0,
    canRedo: redoStack.current.length > 0,
    isDirty,
    markClean,
    markDirty,
  };
}
