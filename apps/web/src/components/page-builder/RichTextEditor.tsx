"use client";

import { useEditor, EditorContent, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import { useState, useCallback, useEffect, useRef } from "react";
import { ImageBrowser } from "./ImageBrowser";

function ImageNodeView({ node, deleteNode, selected }: NodeViewProps) {
  return (
    <NodeViewWrapper className="relative group my-2" data-drag-handle>
      <img
        src={node.attrs.src}
        alt={node.attrs.alt || ""}
        className={`max-w-full h-auto rounded ${selected ? "ring-2 ring-primary-blue" : ""}`}
      />
      <button
        type="button"
        onClick={deleteNode}
        className="absolute top-2 right-2 w-7 h-7 bg-primary-red text-white rounded-sm flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity shadow-[2px_2px_0_0_#121212] hover:bg-primary-red/80"
        title="Delete image"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </NodeViewWrapper>
  );
}

const CustomImage = Image.extend({
  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
});

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  lang?: string;
}

export function RichTextEditor({ value, onChange, placeholder, lang = "en" }: RichTextEditorProps) {
  const isUpdatingRef = useRef(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [showImageBrowser, setShowImageBrowser] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const linkInputRef = useRef<HTMLInputElement>(null);
  const linkPopoverRef = useRef<HTMLDivElement>(null);
  const imagePopoverRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary-blue underline",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      CustomImage.configure({
        inline: false,
        allowBase64: false,
      }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "min-h-[120px] px-3 py-2 prose prose-sm max-w-none focus:outline-none [&_a]:text-primary-blue [&_a]:underline [&_strong]:font-bold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_img]:max-w-full [&_img]:h-auto [&_img]:my-2 [&_img]:rounded",
      },
    },
    onUpdate: ({ editor: ed }) => {
      if (isUpdatingRef.current) return;
      onChange(ed.getHTML());
    },
  });

  // Sync external value changes without triggering onUpdate
  useEffect(() => {
    if (!editor) return;
    const currentContent = editor.getHTML();
    if (value !== currentContent) {
      isUpdatingRef.current = true;
      editor.commands.setContent(value || "", { emitUpdate: false });
      isUpdatingRef.current = false;
    }
  }, [value, editor]);

  // Focus the link input when popover opens
  useEffect(() => {
    if (showLinkInput) {
      setTimeout(() => linkInputRef.current?.focus(), 50);
    }
  }, [showLinkInput]);

  // Close link popover on outside click
  useEffect(() => {
    if (!showLinkInput) return;
    function handleClick(e: MouseEvent) {
      if (linkPopoverRef.current && !linkPopoverRef.current.contains(e.target as Node)) {
        setShowLinkInput(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showLinkInput]);

  // Close image popover on outside click
  useEffect(() => {
    if (!showImageBrowser) return;
    function handleClick(e: MouseEvent) {
      if (imagePopoverRef.current && !imagePopoverRef.current.contains(e.target as Node)) {
        setShowImageBrowser(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showImageBrowser]);

  const openLinkInput = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href || "";
    setLinkUrl(previousUrl || "https://");
    setShowLinkInput(true);
    setShowImageBrowser(false);
  }, [editor]);

  const applyLink = useCallback(() => {
    if (!editor) return;
    const url = linkUrl.trim();
    if (!url || url === "https://") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
    setShowLinkInput(false);
    setLinkUrl("");
  }, [editor, linkUrl]);

  const removeLink = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setShowLinkInput(false);
    setLinkUrl("");
  }, [editor]);

  const handleImageSelect = useCallback((url: string) => {
    if (!editor) return;
    editor.chain().focus().setImage({ src: url }).run();
    setShowImageBrowser(false);
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="border-2 border-foreground/20 focus-within:border-primary-blue transition-colors">
      {/* Toolbar */}
      <div className="relative flex flex-wrap gap-0.5 px-1.5 py-1 border-b border-foreground/10 bg-foreground/5">
        <ToolbarButton
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <span className="font-bold">B</span>
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <span className="italic">I</span>
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline"
        >
          <span className="underline">U</span>
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Strikethrough"
        >
          <span className="line-through">S</span>
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Heading 2"
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Heading 3"
        >
          H3
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet list"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="4" cy="6" r="2" />
            <rect x="9" y="5" width="12" height="2" rx="1" />
            <circle cx="4" cy="12" r="2" />
            <rect x="9" y="11" width="12" height="2" rx="1" />
            <circle cx="4" cy="18" r="2" />
            <rect x="9" y="17" width="12" height="2" rx="1" />
          </svg>
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Ordered list"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <text x="2" y="8" fontSize="7" fontWeight="bold">1</text>
            <rect x="9" y="5" width="12" height="2" rx="1" />
            <text x="2" y="14" fontSize="7" fontWeight="bold">2</text>
            <rect x="9" y="11" width="12" height="2" rx="1" />
            <text x="2" y="20" fontSize="7" fontWeight="bold">3</text>
            <rect x="9" y="17" width="12" height="2" rx="1" />
          </svg>
        </ToolbarButton>

        <ToolbarDivider />

        {/* Link button */}
        <ToolbarButton
          active={editor.isActive("link")}
          onClick={openLinkInput}
          title="Link"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </ToolbarButton>

        {/* Image button */}
        <ToolbarButton
          active={showImageBrowser}
          onClick={() => {
            setShowImageBrowser(!showImageBrowser);
            setShowLinkInput(false);
          }}
          title="Insert image"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={2} />
            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15l-5-5L5 21" />
          </svg>
        </ToolbarButton>

        {/* Link URL popover */}
        {showLinkInput && (
          <div
            ref={linkPopoverRef}
            className="absolute left-0 right-0 top-full z-50 bg-white border-2 border-foreground shadow-[3px_3px_0_0_#121212] p-2 flex items-center gap-1.5"
          >
            <svg className="w-4 h-4 text-foreground/40 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <input
              ref={linkInputRef}
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  applyLink();
                }
                if (e.key === "Escape") {
                  setShowLinkInput(false);
                }
              }}
              placeholder="https://example.com"
              className="flex-1 min-w-0 px-2 py-1 text-sm border-2 border-foreground/20 focus:border-primary-blue focus:outline-none font-mono"
            />
            <button
              type="button"
              onClick={applyLink}
              className="px-2.5 py-1 text-xs font-bold bg-primary-blue text-white border border-foreground hover:bg-primary-blue/90 transition-colors flex-shrink-0"
            >
              Apply
            </button>
            {editor.isActive("link") && (
              <button
                type="button"
                onClick={removeLink}
                className="px-2.5 py-1 text-xs font-bold text-primary-red border border-foreground/20 hover:bg-primary-red/10 transition-colors flex-shrink-0"
              >
                Remove
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowLinkInput(false)}
              className="p-1 text-foreground/40 hover:text-foreground transition-colors flex-shrink-0"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Image browser popover */}
        {showImageBrowser && (
          <div
            ref={imagePopoverRef}
            className="absolute left-0 right-0 top-full z-50 bg-white border-2 border-foreground shadow-[3px_3px_0_0_#121212] p-3"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-widest text-foreground/60">
                Insert Image
              </span>
              <button
                type="button"
                onClick={() => setShowImageBrowser(false)}
                className="p-1 text-foreground/40 hover:text-foreground transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ImageBrowser
              lang={lang}
              onSelect={handleImageSelect}
              idSuffix={`rte-${lang}`}
            />
          </div>
        )}

        <ToolbarDivider />

        <ToolbarButton
          active={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          title="Align left"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="2" /><rect x="3" y="9" width="12" height="2" /><rect x="3" y="14" width="18" height="2" /><rect x="3" y="19" width="12" height="2" />
          </svg>
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          title="Align center"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="2" /><rect x="6" y="9" width="12" height="2" /><rect x="3" y="14" width="18" height="2" /><rect x="6" y="19" width="12" height="2" />
          </svg>
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          title="Align right"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="2" /><rect x="9" y="9" width="12" height="2" /><rect x="3" y="14" width="18" height="2" /><rect x="9" y="19" width="12" height="2" />
          </svg>
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          active={false}
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a4 4 0 014 4v2M3 10l4 4M3 10l4-4" />
          </svg>
        </ToolbarButton>
        <ToolbarButton
          active={false}
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a4 4 0 00-4 4v2M21 10l-4 4M21 10l-4-4" />
          </svg>
        </ToolbarButton>
      </div>

      {/* Editor content */}
      <EditorContent editor={editor} />

      {/* Placeholder */}
      {editor.isEmpty && placeholder && (
        <div className="px-3 py-2 text-sm text-foreground/40 pointer-events-none -mt-[120px]">
          {placeholder}
        </div>
      )}
    </div>
  );
}

function ToolbarButton({
  active,
  onClick,
  disabled,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 text-xs font-bold rounded-sm transition-colors disabled:opacity-30 ${
        active
          ? "bg-primary-blue text-white"
          : "text-foreground/70 hover:bg-foreground/10"
      }`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="w-px h-5 bg-foreground/15 mx-0.5 self-center" />;
}
