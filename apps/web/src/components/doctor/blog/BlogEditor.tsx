"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { RichTextEditor } from "@/components/page-builder/RichTextEditor";

interface BlogPostData {
  id?: string;
  slug: string;
  title: string;
  title_ne: string | null;
  excerpt: string | null;
  excerpt_ne: string | null;
  content: string;
  content_ne: string | null;
  cover_image: string | null;
  meta_description: string | null;
  meta_keywords: string[];
  is_published: boolean;
  category: string | null;
  tags: string[];
}

interface BlogEditorProps {
  mode: "create" | "edit";
  lang: string;
  subdomain?: string;
  initialData?: BlogPostData;
}

const CATEGORIES = [
  "Health Tips",
  "Patient Education",
  "Research",
  "Personal",
  "News",
  "Other",
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function BlogEditor({
  mode,
  lang,
  subdomain,
  initialData,
}: BlogEditorProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"en" | "ne">("en");
  const [seoOpen, setSeoOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(
    mode === "edit"
  );

  // Form state
  const [title, setTitle] = useState(initialData?.title || "");
  const [titleNe, setTitleNe] = useState(initialData?.title_ne || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || "");
  const [excerptNe, setExcerptNe] = useState(initialData?.excerpt_ne || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [contentNe, setContentNe] = useState(initialData?.content_ne || "");
  const [coverImage, setCoverImage] = useState(initialData?.cover_image || "");
  const [category, setCategory] = useState(initialData?.category || "");
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [metaDescription, setMetaDescription] = useState(
    initialData?.meta_description || ""
  );
  const [metaKeywords, setMetaKeywords] = useState<string[]>(
    initialData?.meta_keywords || []
  );
  const [metaKeywordInput, setMetaKeywordInput] = useState("");

  // Auto-generate slug from title
  useEffect(() => {
    if (!slugManuallyEdited && title) {
      setSlug(slugify(title));
    }
  }, [title, slugManuallyEdited]);

  const handleSlugChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSlugManuallyEdited(true);
      setSlug(slugify(e.target.value));
    },
    []
  );

  const addTag = useCallback(() => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
    }
    setTagInput("");
  }, [tagInput, tags]);

  const removeTag = useCallback((tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  }, []);

  const addMetaKeyword = useCallback(() => {
    const trimmed = metaKeywordInput.trim().toLowerCase();
    if (trimmed && !metaKeywords.includes(trimmed)) {
      setMetaKeywords((prev) => [...prev, trimmed]);
    }
    setMetaKeywordInput("");
  }, [metaKeywordInput, metaKeywords]);

  const removeMetaKeyword = useCallback((keyword: string) => {
    setMetaKeywords((prev) => prev.filter((k) => k !== keyword));
  }, []);

  const handleSubmit = async (publish: boolean) => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!slug.trim()) {
      setError("Slug is required");
      return;
    }
    if (!content.trim()) {
      setError("Content is required");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    const payload = {
      title: title.trim(),
      title_ne: titleNe.trim() || null,
      slug: slug.trim(),
      excerpt: excerpt.trim() || null,
      excerpt_ne: excerptNe.trim() || null,
      content,
      content_ne: contentNe || null,
      cover_image: coverImage.trim() || null,
      category: category || null,
      tags,
      meta_description: metaDescription.trim() || null,
      meta_keywords: metaKeywords,
      is_published: publish,
    };

    try {
      const url =
        mode === "create"
          ? "/api/doctor/blog"
          : `/api/doctor/blog/${initialData?.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save blog post");
      }

      if (mode === "create") {
        router.push(`/${lang}/doctor/dashboard/blog`);
      } else {
        setSuccessMessage(
          publish
            ? "Post published successfully!"
            : "Draft saved successfully!"
        );
        router.refresh();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save blog post"
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    if (subdomain && slug) {
      window.open(
        `https://${subdomain}.doctorsewa.org/blog/${slug}`,
        "_blank"
      );
    }
  };

  return (
    <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              {mode === "create" ? "Write New Post" : "Edit Post"}
            </h1>
            <Link
              href={`/${lang}/doctor/dashboard/blog`}
              className="text-primary-blue hover:underline font-medium"
            >
              &larr; Back to Blog Posts
            </Link>
          </div>
        </div>

        {/* Error / Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-4 border-red-500 shadow-[4px_4px_0_0_#121212] font-medium text-red-800">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mb-6 p-4 bg-verified/10 border-4 border-verified shadow-[4px_4px_0_0_#121212] font-medium text-verified">
            {successMessage}
          </div>
        )}

        {/* Bilingual Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("en")}
            className={`px-4 py-2 font-bold border-2 border-black transition-all ${
              activeTab === "en"
                ? "bg-primary-blue text-white shadow-[4px_4px_0_0_#121212]"
                : "bg-white text-foreground hover:bg-foreground/5"
            }`}
          >
            English
          </button>
          <button
            onClick={() => setActiveTab("ne")}
            className={`px-4 py-2 font-bold border-2 border-black transition-all ${
              activeTab === "ne"
                ? "bg-primary-blue text-white shadow-[4px_4px_0_0_#121212]"
                : "bg-white text-foreground hover:bg-foreground/5"
            }`}
          >
            नेपाली
          </button>
        </div>

        {/* Title */}
        <Card
          decorator="blue"
          decoratorPosition="top-left"
          className="mb-6"
        >
          <CardContent>
            {activeTab === "en" ? (
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">
                  Title (English)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter your blog post title..."
                  className="w-full px-4 py-3 text-2xl font-bold border-2 border-black focus:outline-none focus:ring-2 focus:ring-primary-blue"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">
                  Title (नेपाली)
                </label>
                <input
                  type="text"
                  value={titleNe}
                  onChange={(e) => setTitleNe(e.target.value)}
                  placeholder="ब्लग पोस्टको शीर्षक लेख्नुहोस्..."
                  className="w-full px-4 py-3 text-2xl font-bold border-2 border-black focus:outline-none focus:ring-2 focus:ring-primary-blue"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Slug */}
        <Card
          decorator="none"
          className="mb-6"
        >
          <CardContent>
            <label className="block text-sm font-bold text-foreground mb-2">
              URL Slug
            </label>
            <input
              type="text"
              value={slug}
              onChange={handleSlugChange}
              placeholder="your-post-slug"
              className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-primary-blue font-mono"
            />
            <p className="mt-2 text-sm text-foreground/60 font-mono">
              {subdomain
                ? `${subdomain}.doctorsewa.org/blog/${slug || "your-slug-here"}`
                : `yoursite.doctorsewa.org/blog/${slug || "your-slug-here"}`}
            </p>
          </CardContent>
        </Card>

        {/* Excerpt */}
        <Card
          decorator="none"
          className="mb-6"
        >
          <CardContent>
            {activeTab === "en" ? (
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">
                  Excerpt (English)
                </label>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="A short description of your post (shown in blog listing)..."
                  rows={3}
                  className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-primary-blue resize-y"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">
                  Excerpt (नेपाली)
                </label>
                <textarea
                  value={excerptNe}
                  onChange={(e) => setExcerptNe(e.target.value)}
                  placeholder="पोस्टको छोटो विवरण (ब्लग सूचीमा देखिने)..."
                  rows={3}
                  className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-primary-blue resize-y"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cover Image */}
        <Card
          decorator="none"
          className="mb-6"
        >
          <CardContent>
            <label className="block text-sm font-bold text-foreground mb-2">
              Cover Image URL
            </label>
            <input
              type="url"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-primary-blue"
            />
            {coverImage && (
              <div className="mt-4 border-2 border-black/20 overflow-hidden">
                <img
                  src={coverImage}
                  alt="Cover preview"
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Content */}
        <Card
          decorator="red"
          decoratorPosition="top-right"
          className="mb-6"
        >
          <CardHeader>
            <h2 className="text-xl font-bold">
              {activeTab === "en" ? "Content (English)" : "Content (नेपाली)"}
            </h2>
          </CardHeader>
          <CardContent>
            {activeTab === "en" ? (
              <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="Write your blog post content..."
                lang="en"
              />
            ) : (
              <RichTextEditor
                value={contentNe}
                onChange={setContentNe}
                placeholder="ब्लग पोस्टको सामग्री लेख्नुहोस्..."
                lang="ne"
              />
            )}
          </CardContent>
        </Card>

        {/* Category & Tags */}
        <Card
          decorator="yellow"
          decoratorPosition="top-left"
          className="mb-6"
        >
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category */}
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-primary-blue bg-white"
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">
                  Tags
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="Type and press Enter"
                    className="flex-1 px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 border-2 border-black bg-foreground/5 hover:bg-foreground/10 font-bold transition-colors"
                  >
                    Add
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-foreground/10 border border-foreground/20"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 text-foreground/40 hover:text-foreground font-bold"
                        >
                          x
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SEO Section (Collapsible) */}
        <Card
          decorator="none"
          className="mb-8"
        >
          <CardHeader>
            <button
              type="button"
              onClick={() => setSeoOpen(!seoOpen)}
              className="flex items-center justify-between w-full text-left"
            >
              <h2 className="text-xl font-bold">SEO Settings</h2>
              <svg
                className={`w-5 h-5 transition-transform ${seoOpen ? "rotate-180" : ""}`}
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
          </CardHeader>
          {seoOpen && (
            <CardContent>
              <div className="space-y-4">
                {/* Meta Description */}
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">
                    Meta Description
                  </label>
                  <textarea
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    placeholder="A brief description for search engines (recommended: 150-160 characters)"
                    rows={3}
                    className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-primary-blue resize-y"
                  />
                  <p className="mt-1 text-xs text-foreground/50">
                    {metaDescription.length}/160 characters
                  </p>
                </div>

                {/* Meta Keywords */}
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">
                    Meta Keywords
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={metaKeywordInput}
                      onChange={(e) => setMetaKeywordInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addMetaKeyword();
                        }
                      }}
                      placeholder="Type and press Enter"
                      className="flex-1 px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    />
                    <button
                      type="button"
                      onClick={addMetaKeyword}
                      className="px-4 py-2 border-2 border-black bg-foreground/5 hover:bg-foreground/10 font-bold transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  {metaKeywords.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {metaKeywords.map((keyword) => (
                        <span
                          key={keyword}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-foreground/10 border border-foreground/20"
                        >
                          {keyword}
                          <button
                            type="button"
                            onClick={() => removeMetaKeyword(keyword)}
                            className="ml-1 text-foreground/40 hover:text-foreground font-bold"
                          >
                            x
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-4 pb-12">
          <button
            onClick={() => handleSubmit(false)}
            disabled={saving}
            className={`px-6 py-3 font-bold border-2 border-black transition-all ${
              saving
                ? "bg-foreground/10 text-foreground/50 cursor-not-allowed"
                : "bg-white text-foreground hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#121212]"
            }`}
          >
            {saving ? "Saving..." : "Save as Draft"}
          </button>
          <button
            onClick={() => handleSubmit(true)}
            disabled={saving}
            className={`px-6 py-3 font-bold border-2 border-black transition-all ${
              saving
                ? "bg-foreground/10 text-foreground/50 cursor-not-allowed"
                : "bg-primary-blue text-white hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#121212]"
            }`}
          >
            {saving ? "Publishing..." : "Publish"}
          </button>
          {subdomain && slug && (
            <button
              type="button"
              onClick={handlePreview}
              className="px-6 py-3 font-bold border-2 border-black bg-primary-yellow text-foreground hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#121212] transition-all"
            >
              Preview
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
