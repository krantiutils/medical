"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import type { SectionType } from "@/types/page-builder";
import type { ClinicData } from "@/components/page-builder/sections/PublicSectionRenderer";
import { usePageBuilder } from "@/components/page-builder/hooks/usePageBuilder";
import { useAutoSave } from "@/components/page-builder/hooks/useAutoSave";
import { PageBuilderCanvas } from "@/components/page-builder/PageBuilderCanvas";
import { PageBuilderToolbar } from "@/components/page-builder/PageBuilderToolbar";
import { SectionAddPanel } from "@/components/page-builder/SectionAddPanel";
import { SectionSidebar } from "@/components/page-builder/SectionSidebar";
import { TemplatePicker } from "@/components/page-builder/TemplatePicker";
import { NavbarEditor } from "@/components/page-builder/NavbarEditor";
import { FooterEditor } from "@/components/page-builder/FooterEditor";
import { ensureV2, createEmptyConfig } from "@/components/page-builder/lib/migrate";

type RightPanel = "none" | "section" | "navbar" | "footer";

export default function PageBuilderPage() {
  const { lang } = useParams<{ lang: string }>();
  const isNe = lang === "ne";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clinicData, setClinicData] = useState<ClinicData | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [rightPanel, setRightPanel] = useState<RightPanel>("none");

  const pb = usePageBuilder();
  const { status: saveStatus, saveNow } = useAutoSave({
    config: pb.config,
    isDirty: pb.isDirty,
    markClean: pb.markClean,
  });

  // Load page builder config + clinic data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch page builder config
      const pbRes = await fetch("/api/clinic/page-builder");
      if (!pbRes.ok) {
        const data = await pbRes.json();
        throw new Error(data.error || "Failed to load");
      }
      const pbData = await pbRes.json();

      // Fetch full clinic data for renderers
      const dashRes = await fetch("/api/clinic/dashboard");
      if (!dashRes.ok) throw new Error("Failed to load clinic data");
      const dashData = await dashRes.json();

      // Build clinic data for renderers
      const clinic = dashData.clinic;
      // Fetch from the clinic info API (now returns all fields)
      const infoRes = await fetch(`/api/clinic/${clinic.id}/info`);
      let clinicInfo: ClinicData;

      if (infoRes.ok) {
        const infoData = await infoRes.json();
        clinicInfo = {
          id: clinic.id,
          slug: clinic.slug,
          name: clinic.name,
          logo_url: infoData.clinic?.logo_url || clinic.logo_url || null,
          phone: infoData.clinic?.phone || null,
          email: infoData.clinic?.email || null,
          address: infoData.clinic?.address || null,
          website: infoData.clinic?.website || null,
          services: infoData.clinic?.services || [],
          photos: infoData.clinic?.photos || [],
          timings: infoData.clinic?.timings || null,
          location_lat: infoData.clinic?.location_lat || null,
          location_lng: infoData.clinic?.location_lng || null,
          doctors: infoData.clinic?.doctors?.map((cd: Record<string, unknown>) => {
            const doc = cd.doctor as Record<string, unknown> | undefined;
            return {
              id: (doc?.id || cd.id || "") as string,
              full_name: (doc?.full_name || cd.full_name || "") as string,
              type: (doc?.type || cd.type || "DOCTOR") as string,
              photo_url: (doc?.photo_url || cd.photo_url || null) as string | null,
              specialties: (doc?.specialties || cd.specialties || []) as string[],
              degree: (doc?.degree || cd.degree || null) as string | null,
              role: (cd.role || null) as string | null,
            };
          }) || [],
        };
      } else {
        // Fallback with minimal data
        clinicInfo = {
          id: clinic.id,
          slug: clinic.slug,
          name: clinic.name,
          logo_url: clinic.logo_url || null,
          phone: null,
          email: null,
          address: null,
          website: null,
          services: [],
          photos: [],
          timings: null,
          location_lat: null,
          location_lng: null,
          doctors: [],
        };
      }

      setClinicData(clinicInfo);

      // Migrate v1 -> v2 on load
      const migrated = ensureV2(pbData.pageBuilder) || createEmptyConfig();
      pb.setConfig(migrated);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        pb.selectSection(null);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        pb.undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        pb.redo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        saveNow();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pb, saveNow]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-5rem)]">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 border-4 border-foreground/20 border-t-primary-blue rounded-full animate-spin" />
          <p className="text-foreground/60 font-bold">{isNe ? "लोड हुँदैछ..." : "Loading page builder..."}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-5rem)]">
        <div className="text-center">
          <p className="text-primary-red font-bold mb-2">{error}</p>
          <button
            type="button"
            onClick={loadData}
            className="px-4 py-2 text-sm font-bold bg-primary-blue text-white border-2 border-foreground"
          >
            {isNe ? "पुन: प्रयास" : "Retry"}
          </button>
        </div>
      </div>
    );
  }

  if (!pb.config || !clinicData) return null;

  const currentSections = pb.currentPage?.sections || [];

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {/* Toolbar */}
      <PageBuilderToolbar
        lang={lang}
        clinicSlug={clinicData.slug}
        enabled={pb.config.enabled}
        saveStatus={saveStatus}
        canUndo={pb.canUndo}
        canRedo={pb.canRedo}
        stylePreset={pb.config.stylePreset}
        pages={pb.config.pages}
        currentPageId={pb.currentPageId}
        onSave={saveNow}
        onUndo={pb.undo}
        onRedo={pb.redo}
        onToggleEnabled={pb.toggleEnabled}
        onOpenTemplates={() => { setShowTemplates(true); setRightPanel("none"); pb.selectSection(null); }}
        onOpenNavbar={() => { setRightPanel("navbar"); setShowTemplates(false); pb.selectSection(null); }}
        onOpenFooter={() => { setRightPanel("footer"); setShowTemplates(false); pb.selectSection(null); }}
        onSetStylePreset={pb.setStylePreset}
        onSelectPage={pb.setCurrentPageId}
        onAddPage={pb.addPage}
        onRemovePage={pb.removePage}
        onRenamePage={pb.renamePage}
        onUpdatePageSlug={pb.updatePageSlug}
        clinicLogoUrl={clinicData.logo_url}
        onLogoUploaded={(url) => setClinicData((prev) => prev ? { ...prev, logo_url: url } : prev)}
      />

      {/* Main area */}
      <div className="flex flex-1 min-h-0">
        {/* Section add panel (left) — hidden when template picker is open */}
        {!showTemplates && (
          <SectionAddPanel
            lang={lang}
            onAddSection={(type: SectionType) => pb.addSection(type)}
          />
        )}

        {/* Canvas (center) — replaced by template picker when open */}
        {showTemplates ? (
          <TemplatePicker
            lang={lang}
            onSelect={pb.applyTemplate}
            onClose={() => setShowTemplates(false)}
          />
        ) : (
          <PageBuilderCanvas
            sections={currentSections}
            selectedSectionId={pb.selectedSectionId}
            lang={lang}
            clinic={clinicData}
            stylePreset={pb.config.stylePreset}
            onSelectSection={(id) => {
              pb.selectSection(id);
              if (id) setRightPanel("section");
            }}
            onMoveSection={pb.moveSection}
            onRemoveSection={pb.removeSection}
            onDuplicateSection={pb.duplicateSection}
            onToggleVisibility={pb.toggleSectionVisibility}
          />
        )}

        {/* Right panel — navbar editor OR footer editor OR section editor */}
        {rightPanel === "navbar" ? (
          <NavbarEditor
            navbar={pb.config.navbar}
            onChange={pb.updateNavbar}
            onClose={() => setRightPanel("none")}
            lang={lang}
            clinicLogoUrl={clinicData.logo_url}
            onLogoUploaded={(url) => setClinicData((prev) => prev ? { ...prev, logo_url: url } : prev)}
          />
        ) : rightPanel === "footer" ? (
          <FooterEditor
            footer={pb.config.footer}
            onChange={pb.updateFooter}
            onClose={() => setRightPanel("none")}
            lang={lang}
          />
        ) : pb.selectedSection ? (
          <SectionSidebar
            section={pb.selectedSection}
            lang={lang}
            onUpdate={(updates) => pb.updateSection(pb.selectedSectionId!, updates)}
            onUpdateData={(dataUpdates) => pb.updateSectionData(pb.selectedSectionId!, dataUpdates)}
            onClose={() => pb.selectSection(null)}
          />
        ) : null}
      </div>
    </div>
  );
}
