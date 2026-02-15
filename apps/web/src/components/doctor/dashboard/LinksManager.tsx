"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

interface CustomLink {
  title: string;
  url: string;
  icon?: string;
}

interface LinksManagerProps {
  doctorId: string;
  customLinks: CustomLink[];
  lang: string;
}

export function LinksManager({ doctorId, customLinks: initialLinks, lang }: LinksManagerProps) {
  const router = useRouter();

  const [links, setLinks] = useState<CustomLink[]>(initialLinks);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const inputClass = "w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-primary-blue";
  const labelClass = "block text-sm font-bold text-foreground mb-2";

  const addLink = () => {
    setLinks([...links, { title: "", url: "", icon: "" }]);
  };

  const updateLink = (index: number, field: keyof CustomLink, value: string) => {
    const updated = [...links];
    updated[index] = { ...updated[index], [field]: value };
    setLinks(updated);
  };

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const moveLink = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= links.length) return;

    const updated = [...links];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIndex, 0, moved);
    setLinks(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    // Filter out links with empty titles or URLs
    const validLinks = links.filter((link) => link.title.trim() && link.url.trim());

    try {
      const response = await fetch("/api/doctor/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          custom_links: validLinks,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update links");
      }

      setLinks(validLinks);
      setSuccessMessage("Links updated successfully!");
      router.refresh();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update links");
    } finally {
      setSaving(false);
    }
  };

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

      {/* Links Editor */}
      <Card decorator="blue" decoratorPosition="top-left">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Your Links</h2>
            <button
              type="button"
              onClick={addLink}
              className="px-4 py-2 bg-primary-blue text-white font-bold border-2 border-black hover:-translate-y-1 transition-transform"
            >
              + Add New Link
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {links.length === 0 && (
            <p className="text-foreground/50 text-center py-8">
              No custom links yet. Click &quot;Add New Link&quot; to get started.
            </p>
          )}

          {links.map((link, index) => (
            <div key={index} className="p-4 border-2 border-black/20 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-foreground/50">
                  Link #{index + 1}
                </span>
                <div className="flex items-center gap-1">
                  {/* Move Up */}
                  <button
                    type="button"
                    onClick={() => moveLink(index, "up")}
                    disabled={index === 0}
                    className={`p-1.5 border-2 transition-colors ${
                      index === 0
                        ? "border-black/10 text-foreground/20 cursor-not-allowed"
                        : "border-black/20 text-foreground/60 hover:border-black hover:text-foreground"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>

                  {/* Move Down */}
                  <button
                    type="button"
                    onClick={() => moveLink(index, "down")}
                    disabled={index === links.length - 1}
                    className={`p-1.5 border-2 transition-colors ${
                      index === links.length - 1
                        ? "border-black/10 text-foreground/20 cursor-not-allowed"
                        : "border-black/20 text-foreground/60 hover:border-black hover:text-foreground"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => removeLink(index)}
                    className="p-1.5 border-2 border-primary-red/20 text-primary-red hover:border-primary-red hover:bg-primary-red/10 transition-colors ml-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Title</label>
                  <input
                    type="text"
                    value={link.title}
                    onChange={(e) => updateLink(index, "title", e.target.value)}
                    placeholder="My Research Paper"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>URL</label>
                  <input
                    type="url"
                    value={link.url}
                    onChange={(e) => updateLink(index, "url", e.target.value)}
                    placeholder="https://example.com/paper"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Preview */}
      <Card decorator="yellow" decoratorPosition="top-right">
        <CardHeader>
          <h2 className="text-2xl font-bold">Preview</h2>
        </CardHeader>
        <CardContent>
          {links.filter((l) => l.title.trim() && l.url.trim()).length === 0 ? (
            <p className="text-foreground/50 text-center py-6">
              Add links above to see a preview of how they will appear on your profile.
            </p>
          ) : (
            <div className="space-y-3 max-w-md mx-auto">
              {links
                .filter((l) => l.title.trim() && l.url.trim())
                .map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 border-2 border-black text-center font-bold hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#121212] transition-all bg-white"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 text-primary-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      <span>{link.title}</span>
                    </div>
                  </a>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

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
