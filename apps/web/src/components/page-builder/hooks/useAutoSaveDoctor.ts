"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { PageBuilderConfig } from "@/types/page-builder";

export type AutoSaveStatus = "idle" | "saving" | "saved" | "error";

interface UseAutoSaveDoctorOptions {
  config: PageBuilderConfig | null;
  isDirty: boolean;
  markClean: () => void;
  debounceMs?: number;
}

/**
 * Auto-save hook for the doctor page builder.
 * Same as useAutoSave but saves to /api/doctor/page-builder instead of /api/clinic/page-builder.
 */
export function useAutoSaveDoctor({ config, isDirty, markClean, debounceMs = 3000 }: UseAutoSaveDoctorOptions) {
  const [status, setStatus] = useState<AutoSaveStatus>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const save = useCallback(async (configToSave: PageBuilderConfig) => {
    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setStatus("saving");

    try {
      const response = await fetch("/api/doctor/page-builder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configToSave),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Save failed: ${response.status}`);
      }

      setStatus("saved");
      markClean();

      setTimeout(() => setStatus("idle"), 2000);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      console.error("Auto-save error:", error);
      setStatus("error");
    }
  }, [markClean]);

  const saveNow = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (config) {
      save(config);
    }
  }, [config, save]);

  useEffect(() => {
    if (!isDirty || !config) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      save(config);
    }, debounceMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isDirty, config, debounceMs, save]);

  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { status, saveNow };
}
