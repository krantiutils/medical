"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

// --- Types ---

interface Education {
  degree: string;
  institution: string;
  year: number;
  description?: string;
}

interface Experience {
  role: string;
  organization: string;
  startYear: number;
  endYear?: number;
  description?: string;
}

interface Certification {
  name: string;
  issuer: string;
  year: number;
  expiryYear?: number;
}

interface Publication {
  title: string;
  journal?: string;
  year: number;
  link?: string;
  description?: string;
}

interface Award {
  title: string;
  issuer?: string;
  year: number;
  description?: string;
}

type Tab = "education" | "experience" | "certifications" | "publications" | "awards";

interface CredentialsEditorProps {
  doctorId: string;
  education: Education[];
  experience: Experience[];
  certifications: Certification[];
  publications: Publication[];
  awards: Award[];
  lang: string;
}

// --- Component ---

export function CredentialsEditor({
  doctorId,
  education: initialEducation,
  experience: initialExperience,
  certifications: initialCertifications,
  publications: initialPublications,
  awards: initialAwards,
  lang,
}: CredentialsEditorProps) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>("education");

  const [education, setEducation] = useState<Education[]>(initialEducation);
  const [experience, setExperience] = useState<Experience[]>(initialExperience);
  const [certifications, setCertifications] = useState<Certification[]>(initialCertifications);
  const [publications, setPublications] = useState<Publication[]>(initialPublications);
  const [awards, setAwards] = useState<Award[]>(initialAwards);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const tabs: { key: Tab; label: string }[] = [
    { key: "education", label: "Education" },
    { key: "experience", label: "Experience" },
    { key: "certifications", label: "Certifications" },
    { key: "publications", label: "Publications" },
    { key: "awards", label: "Awards" },
  ];

  // --- Save ---

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/doctor/credentials", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          education,
          experience,
          certifications,
          publications,
          awards,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update credentials");
      }

      setSuccessMessage("Credentials updated successfully!");
      router.refresh();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update credentials");
    } finally {
      setSaving(false);
    }
  };

  // --- Education handlers ---

  const addEducation = () => {
    setEducation([...education, { degree: "", institution: "", year: new Date().getFullYear(), description: "" }]);
  };

  const updateEducation = (index: number, field: keyof Education, value: string | number) => {
    const updated = [...education];
    updated[index] = { ...updated[index], [field]: value };
    setEducation(updated);
  };

  const removeEducation = (index: number) => {
    setEducation(education.filter((_, i) => i !== index));
  };

  // --- Experience handlers ---

  const addExperience = () => {
    setExperience([...experience, { role: "", organization: "", startYear: new Date().getFullYear(), description: "" }]);
  };

  const updateExperience = (index: number, field: keyof Experience, value: string | number | undefined) => {
    const updated = [...experience];
    updated[index] = { ...updated[index], [field]: value };
    setExperience(updated);
  };

  const removeExperience = (index: number) => {
    setExperience(experience.filter((_, i) => i !== index));
  };

  // --- Certification handlers ---

  const addCertification = () => {
    setCertifications([...certifications, { name: "", issuer: "", year: new Date().getFullYear() }]);
  };

  const updateCertification = (index: number, field: keyof Certification, value: string | number | undefined) => {
    const updated = [...certifications];
    updated[index] = { ...updated[index], [field]: value };
    setCertifications(updated);
  };

  const removeCertification = (index: number) => {
    setCertifications(certifications.filter((_, i) => i !== index));
  };

  // --- Publication handlers ---

  const addPublication = () => {
    setPublications([...publications, { title: "", year: new Date().getFullYear() }]);
  };

  const updatePublication = (index: number, field: keyof Publication, value: string | number | undefined) => {
    const updated = [...publications];
    updated[index] = { ...updated[index], [field]: value };
    setPublications(updated);
  };

  const removePublication = (index: number) => {
    setPublications(publications.filter((_, i) => i !== index));
  };

  // --- Award handlers ---

  const addAward = () => {
    setAwards([...awards, { title: "", year: new Date().getFullYear() }]);
  };

  const updateAward = (index: number, field: keyof Award, value: string | number | undefined) => {
    const updated = [...awards];
    updated[index] = { ...updated[index], [field]: value };
    setAwards(updated);
  };

  const removeAward = (index: number) => {
    setAwards(awards.filter((_, i) => i !== index));
  };

  // --- Delete button helper ---

  const DeleteButton = ({ onClick }: { onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-2 text-primary-red border-2 border-primary-red hover:bg-primary-red/10 transition-colors"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  );

  // --- Input class ---

  const inputClass = "w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-primary-blue";
  const labelClass = "block text-sm font-bold text-foreground mb-2";

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-20 right-4 z-50 bg-verified text-white px-6 py-4 border-4 border-black shadow-[4px_4px_0_0_#121212] flex items-center gap-3">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-bold">{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="ml-2 hover:opacity-70">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-primary-red/10 border-2 border-primary-red text-primary-red p-4">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b-2 border-black/20 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 font-bold border-2 transition-all ${
              activeTab === tab.key
                ? "bg-primary-blue text-white border-black -translate-y-1"
                : "bg-foreground/5 border-black/20 hover:border-black hover:bg-foreground/10"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Education Tab */}
      {activeTab === "education" && (
        <Card decorator="blue" decoratorPosition="top-left">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Education</h2>
              <button
                type="button"
                onClick={addEducation}
                className="px-4 py-2 bg-primary-blue text-white font-bold border-2 border-black hover:-translate-y-1 transition-transform"
              >
                + Add New
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {education.length === 0 && (
              <p className="text-foreground/50 text-center py-8">
                No education entries yet. Click &quot;Add New&quot; to get started.
              </p>
            )}
            {education.map((edu, index) => (
              <div key={index} className="p-4 border-2 border-black/20 space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Degree / Qualification</label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => updateEducation(index, "degree", e.target.value)}
                      placeholder="MBBS, MD, BDS..."
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Institution</label>
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={(e) => updateEducation(index, "institution", e.target.value)}
                      placeholder="University name..."
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Year</label>
                    <input
                      type="number"
                      value={edu.year || ""}
                      onChange={(e) => updateEducation(index, "year", parseInt(e.target.value, 10) || 0)}
                      placeholder="2020"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Description (optional)</label>
                    <input
                      type="text"
                      value={edu.description || ""}
                      onChange={(e) => updateEducation(index, "description", e.target.value)}
                      placeholder="Additional details..."
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <DeleteButton onClick={() => removeEducation(index)} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Experience Tab */}
      {activeTab === "experience" && (
        <Card decorator="yellow" decoratorPosition="top-right">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Experience</h2>
              <button
                type="button"
                onClick={addExperience}
                className="px-4 py-2 bg-primary-blue text-white font-bold border-2 border-black hover:-translate-y-1 transition-transform"
              >
                + Add New
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {experience.length === 0 && (
              <p className="text-foreground/50 text-center py-8">
                No experience entries yet. Click &quot;Add New&quot; to get started.
              </p>
            )}
            {experience.map((exp, index) => (
              <div key={index} className="p-4 border-2 border-black/20 space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Role / Position</label>
                    <input
                      type="text"
                      value={exp.role}
                      onChange={(e) => updateExperience(index, "role", e.target.value)}
                      placeholder="Senior Consultant..."
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Organization</label>
                    <input
                      type="text"
                      value={exp.organization}
                      onChange={(e) => updateExperience(index, "organization", e.target.value)}
                      placeholder="Hospital / Clinic name..."
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className={labelClass}>Start Year</label>
                    <input
                      type="number"
                      value={exp.startYear || ""}
                      onChange={(e) => updateExperience(index, "startYear", parseInt(e.target.value, 10) || 0)}
                      placeholder="2015"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>End Year (optional)</label>
                    <input
                      type="number"
                      value={exp.endYear || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateExperience(index, "endYear", val ? parseInt(val, 10) : undefined);
                      }}
                      placeholder="Present"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Description (optional)</label>
                    <input
                      type="text"
                      value={exp.description || ""}
                      onChange={(e) => updateExperience(index, "description", e.target.value)}
                      placeholder="Details..."
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <DeleteButton onClick={() => removeExperience(index)} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Certifications Tab */}
      {activeTab === "certifications" && (
        <Card decorator="red" decoratorPosition="top-left">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Certifications</h2>
              <button
                type="button"
                onClick={addCertification}
                className="px-4 py-2 bg-primary-blue text-white font-bold border-2 border-black hover:-translate-y-1 transition-transform"
              >
                + Add New
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {certifications.length === 0 && (
              <p className="text-foreground/50 text-center py-8">
                No certifications yet. Click &quot;Add New&quot; to get started.
              </p>
            )}
            {certifications.map((cert, index) => (
              <div key={index} className="p-4 border-2 border-black/20 space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Certification Name</label>
                    <input
                      type="text"
                      value={cert.name}
                      onChange={(e) => updateCertification(index, "name", e.target.value)}
                      placeholder="Board Certification..."
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Issuer</label>
                    <input
                      type="text"
                      value={cert.issuer}
                      onChange={(e) => updateCertification(index, "issuer", e.target.value)}
                      placeholder="Issuing body..."
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Year</label>
                    <input
                      type="number"
                      value={cert.year || ""}
                      onChange={(e) => updateCertification(index, "year", parseInt(e.target.value, 10) || 0)}
                      placeholder="2020"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Expiry Year (optional)</label>
                    <input
                      type="number"
                      value={cert.expiryYear || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateCertification(index, "expiryYear", val ? parseInt(val, 10) : undefined);
                      }}
                      placeholder="2025"
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <DeleteButton onClick={() => removeCertification(index)} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Publications Tab */}
      {activeTab === "publications" && (
        <Card decorator="blue" decoratorPosition="top-right">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Publications</h2>
              <button
                type="button"
                onClick={addPublication}
                className="px-4 py-2 bg-primary-blue text-white font-bold border-2 border-black hover:-translate-y-1 transition-transform"
              >
                + Add New
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {publications.length === 0 && (
              <p className="text-foreground/50 text-center py-8">
                No publications yet. Click &quot;Add New&quot; to get started.
              </p>
            )}
            {publications.map((pub, index) => (
              <div key={index} className="p-4 border-2 border-black/20 space-y-3">
                <div>
                  <label className={labelClass}>Title</label>
                  <input
                    type="text"
                    value={pub.title}
                    onChange={(e) => updatePublication(index, "title", e.target.value)}
                    placeholder="Publication title..."
                    className={inputClass}
                  />
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className={labelClass}>Journal (optional)</label>
                    <input
                      type="text"
                      value={pub.journal || ""}
                      onChange={(e) => updatePublication(index, "journal", e.target.value)}
                      placeholder="Journal name..."
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Year</label>
                    <input
                      type="number"
                      value={pub.year || ""}
                      onChange={(e) => updatePublication(index, "year", parseInt(e.target.value, 10) || 0)}
                      placeholder="2022"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Link (optional)</label>
                    <input
                      type="url"
                      value={pub.link || ""}
                      onChange={(e) => updatePublication(index, "link", e.target.value)}
                      placeholder="https://..."
                      className={inputClass}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Description (optional)</label>
                  <input
                    type="text"
                    value={pub.description || ""}
                    onChange={(e) => updatePublication(index, "description", e.target.value)}
                    placeholder="Brief description..."
                    className={inputClass}
                  />
                </div>
                <div className="flex justify-end">
                  <DeleteButton onClick={() => removePublication(index)} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Awards Tab */}
      {activeTab === "awards" && (
        <Card decorator="yellow" decoratorPosition="top-left">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Awards</h2>
              <button
                type="button"
                onClick={addAward}
                className="px-4 py-2 bg-primary-blue text-white font-bold border-2 border-black hover:-translate-y-1 transition-transform"
              >
                + Add New
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {awards.length === 0 && (
              <p className="text-foreground/50 text-center py-8">
                No awards yet. Click &quot;Add New&quot; to get started.
              </p>
            )}
            {awards.map((award, index) => (
              <div key={index} className="p-4 border-2 border-black/20 space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Title</label>
                    <input
                      type="text"
                      value={award.title}
                      onChange={(e) => updateAward(index, "title", e.target.value)}
                      placeholder="Award title..."
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Issuer (optional)</label>
                    <input
                      type="text"
                      value={award.issuer || ""}
                      onChange={(e) => updateAward(index, "issuer", e.target.value)}
                      placeholder="Awarding body..."
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Year</label>
                    <input
                      type="number"
                      value={award.year || ""}
                      onChange={(e) => updateAward(index, "year", parseInt(e.target.value, 10) || 0)}
                      placeholder="2021"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Description (optional)</label>
                    <input
                      type="text"
                      value={award.description || ""}
                      onChange={(e) => updateAward(index, "description", e.target.value)}
                      placeholder="Details..."
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <DeleteButton onClick={() => removeAward(index)} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-6 py-3 font-bold border-2 border-black transition-all ${
            saving
              ? "bg-foreground/10 text-foreground/50 cursor-not-allowed"
              : "bg-primary-blue text-white hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#121212]"
          }`}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>

        <button
          onClick={() => router.back()}
          className="px-6 py-3 font-bold border-2 border-black hover:bg-foreground/5 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
