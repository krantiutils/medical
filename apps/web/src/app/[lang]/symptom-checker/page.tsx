"use client";

import { useState, useMemo, use } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  BODY_AREAS,
  SYMPTOMS,
  matchSymptomsToSpecialties,
  type SymptomDefinition,
} from "@/lib/specialties";

interface SymptomCheckerPageProps {
  params: Promise<{
    lang: string;
  }>;
}

export default function SymptomCheckerPage({ params }: SymptomCheckerPageProps) {
  const { lang } = use(params);
  const t = useTranslations("symptomChecker");

  const [selectedSymptoms, setSelectedSymptoms] = useState<Set<string>>(
    new Set()
  );
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());

  const symptomsByArea = useMemo(() => {
    const grouped = new Map<string, SymptomDefinition[]>();
    for (const area of BODY_AREAS) {
      grouped.set(
        area.id,
        SYMPTOMS.filter((s) => s.bodyArea === area.id)
      );
    }
    return grouped;
  }, []);

  const results = useMemo(
    () => matchSymptomsToSpecialties(Array.from(selectedSymptoms)),
    [selectedSymptoms]
  );

  const toggleSymptom = (symptomId: string) => {
    setSelectedSymptoms((prev) => {
      const next = new Set(prev);
      if (next.has(symptomId)) {
        next.delete(symptomId);
      } else {
        next.add(symptomId);
      }
      return next;
    });
  };

  const toggleArea = (areaId: string) => {
    setExpandedAreas((prev) => {
      const next = new Set(prev);
      if (next.has(areaId)) {
        next.delete(areaId);
      } else {
        next.add(areaId);
      }
      return next;
    });
  };

  const clearAll = () => {
    setSelectedSymptoms(new Set());
  };

  const getSymptomName = (symptom: SymptomDefinition) =>
    lang === "ne" ? symptom.nameNe : symptom.nameEn;

  const getAreaName = (area: (typeof BODY_AREAS)[number]) =>
    lang === "ne" ? area.nameNe : area.nameEn;

  return (
    <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 bg-primary-red" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary-red">
              {t("badge")}
            </span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tight mb-2">
            {t("title")}
          </h1>
          <p className="text-foreground/60 text-lg max-w-2xl">
            {t("subtitle")}
          </p>
        </div>

        {/* Disclaimer */}
        <div className="mb-8 p-4 bg-primary-yellow/10 border-4 border-primary-yellow">
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-primary-yellow flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <p className="text-sm font-medium text-foreground/80">
              {t("disclaimer")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Symptom Selection */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold uppercase tracking-tight">
                {t("selectSymptoms")}
              </h2>
              {selectedSymptoms.size > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-sm font-bold text-primary-red hover:underline uppercase tracking-wider"
                >
                  {t("clearAll")} ({selectedSymptoms.size})
                </button>
              )}
            </div>

            {/* Selected symptoms pills */}
            {selectedSymptoms.size > 0 && (
              <div className="mb-6 flex flex-wrap gap-2">
                {Array.from(selectedSymptoms).map((symptomId) => {
                  const symptom = SYMPTOMS.find((s) => s.id === symptomId);
                  if (!symptom) return null;
                  return (
                    <button
                      key={symptomId}
                      type="button"
                      onClick={() => toggleSymptom(symptomId)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-primary-blue text-white border-2 border-foreground hover:bg-primary-blue/80 transition-colors"
                    >
                      {getSymptomName(symptom)}
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Body areas accordion */}
            <div className="space-y-2">
              {BODY_AREAS.map((area) => {
                const areaSymptoms = symptomsByArea.get(area.id) || [];
                const isExpanded = expandedAreas.has(area.id);
                const selectedCount = areaSymptoms.filter((s) =>
                  selectedSymptoms.has(s.id)
                ).length;

                return (
                  <div
                    key={area.id}
                    className="border-4 border-foreground bg-white"
                  >
                    <button
                      type="button"
                      onClick={() => toggleArea(area.id)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold uppercase tracking-wider">
                          {getAreaName(area)}
                        </span>
                        {selectedCount > 0 && (
                          <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold bg-primary-blue text-white">
                            {selectedCount}
                          </span>
                        )}
                      </div>
                      <svg
                        className={`w-5 h-5 transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t-2 border-foreground/10">
                        <div className="flex flex-wrap gap-2 pt-3">
                          {areaSymptoms.map((symptom) => {
                            const isSelected = selectedSymptoms.has(
                              symptom.id
                            );
                            return (
                              <button
                                key={symptom.id}
                                type="button"
                                onClick={() => toggleSymptom(symptom.id)}
                                className={`px-3 py-1.5 text-sm font-medium border-2 transition-colors ${
                                  isSelected
                                    ? "bg-primary-blue text-white border-foreground"
                                    : "bg-white text-foreground border-foreground/30 hover:border-foreground hover:bg-muted"
                                }`}
                              >
                                {getSymptomName(symptom)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Results */}
          <div>
            <div className="sticky top-24">
              <h2 className="text-xl font-bold uppercase tracking-tight mb-4">
                {t("matchedSpecialties")}
              </h2>

              {selectedSymptoms.size === 0 ? (
                <Card className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-foreground/40"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                  <p className="text-foreground/60 text-sm">
                    {t("emptyState")}
                  </p>
                </Card>
              ) : results.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-foreground/60 text-sm">
                    {t("noMatches")}
                  </p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {results.map(({ specialty, matchCount }) => {
                    const specialtyName =
                      lang === "ne" ? specialty.nameNe : specialty.nameEn;
                    const maxPossible = specialty.symptoms.length;
                    const percentage = Math.round(
                      (matchCount / maxPossible) * 100
                    );

                    return (
                      <Card
                        key={specialty.slug}
                        decorator="blue"
                        decoratorPosition="top-left"
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-lg font-bold leading-tight">
                              {specialtyName}
                            </h3>
                            <span className="text-xs font-bold bg-primary-blue/10 text-primary-blue px-2 py-1">
                              {matchCount}{" "}
                              {matchCount === 1
                                ? t("matchSingular")
                                : t("matchPlural")}
                            </span>
                          </div>
                          {/* Match bar */}
                          <div className="w-full h-2 bg-muted mt-2">
                            <div
                              className="h-full bg-primary-blue transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </CardHeader>
                        <CardContent className="pt-2 pb-4">
                          <Link
                            href={`/${lang}/doctors/specialty/${specialty.slug}`}
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                            >
                              {t("findDoctors")}
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    );
                  })}

                  {/* General advice */}
                  <div className="mt-4 p-4 bg-muted border-2 border-foreground/20">
                    <p className="text-xs text-foreground/60">
                      {t("advice")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
