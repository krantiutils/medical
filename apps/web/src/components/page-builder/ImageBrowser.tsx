"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface ImageBrowserProps {
  onSelect: (url: string) => void;
  lang: string;
  idSuffix?: string;
}

export function ImageBrowser({ onSelect, lang, idSuffix = "" }: ImageBrowserProps) {
  const isNe = lang === "ne";
  const inputId = `pb-image-upload-inline${idSuffix ? `-${idSuffix}` : ""}`;
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadImages = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/clinic/page-builder/images");
      if (!res.ok) throw new Error("Failed to load images");
      const data = await res.json();
      setImages(data.images || []);
    } catch (err) {
      console.error("Error loading images:", err);
      setError(isNe ? "चित्रहरू लोड गर्न असफल" : "Failed to load images");
    } finally {
      setLoading(false);
    }
  }, [isNe]);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/clinic/page-builder/images", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await res.json();
      setImages((prev) => [data.url, ...prev]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setError(msg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="border-t-2 border-foreground/10 pt-3 mt-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-widest text-foreground/60">
          {isNe ? "चित्रहरू" : "Images"}
        </span>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleUpload}
            className="hidden"
            id={inputId}
          />
          <label
            htmlFor={inputId}
            className={`text-xs font-bold text-primary-blue cursor-pointer hover:underline ${uploading ? "opacity-50 pointer-events-none" : ""}`}
          >
            {uploading ? (isNe ? "अपलोड..." : "Uploading...") : (isNe ? "+ अपलोड" : "+ Upload")}
          </label>
        </div>
      </div>

      {error && <p className="text-xs text-primary-red mb-2">{error}</p>}

      {loading ? (
        <p className="text-xs text-foreground/40 py-2">{isNe ? "लोड हुँदैछ..." : "Loading..."}</p>
      ) : images.length === 0 ? (
        <p className="text-xs text-foreground/40 py-2">{isNe ? "कुनै चित्र छैन" : "No images yet. Upload one above."}</p>
      ) : (
        <div className="grid grid-cols-3 gap-1.5 max-h-40 overflow-y-auto">
          {images.map((url) => (
            <button
              key={url}
              type="button"
              onClick={() => onSelect(url)}
              className="aspect-square border-2 border-foreground/10 hover:border-primary-blue overflow-hidden transition-colors"
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
