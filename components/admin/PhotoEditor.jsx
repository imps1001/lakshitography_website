"use client";

import { useEffect, useRef, useState } from "react";
import { Crosshair, Eye, Loader2, RefreshCw, Sparkles, Star, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { uploadToCloudinary } from "@/lib/cloudinaryUpload";
import { DEFAULT_FOCUS } from "@/lib/portfolio";
import { optimizedImage } from "@/lib/utils";
import { Modal, errorText } from "./ui";

const PREVIEWS = [
  { label: "Service card", ratio: "2 / 3" },
  { label: "Square", ratio: "1 / 1" },
  { label: "Wide", ratio: "16 / 9" },
];

export default function PhotoEditor({ photo, categories, isHero, onClose, onSaved, onDelete }) {
  const fileRef = useRef(null);
  const imgRef = useRef(null);
  const [form, setForm] = useState(() => ({
    category_id: photo.category_id,
    alt: photo.alt || "",
    show_in_gallery: photo.show_in_gallery,
    show_in_hero: photo.show_in_hero,
    focus: photo.focus || null,
  }));
  const [hero, setHero] = useState(isHero);
  const [replacement, setReplacement] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !saving && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  useEffect(() => () => replacement && URL.revokeObjectURL(replacement.preview), [replacement]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const src = replacement?.preview || optimizedImage(photo.url, 1200);
  const focus = form.focus || DEFAULT_FOCUS;
  const position = `${focus.x}% ${focus.y}%`;
  const categoryName = categories.find((c) => c.id === form.category_id)?.name;

  const pickFocus = (e) => {
    const rect = imgRef.current.getBoundingClientRect();
    set("focus", {
      x: Math.round(((e.clientX - rect.left) / rect.width) * 100),
      y: Math.round(((e.clientY - rect.top) / rect.height) * 100),
    });
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (replacement) {
        const uploaded = await uploadToCloudinary(replacement.file);
        await api.put(`/gallery/${photo.id}`, { public_id: uploaded.public_id });
      }
      // Sent after the replace so the focal point applies to the new image.
      await api.patch(`/gallery/${photo.id}`, form);
      const categoryChanged = form.category_id !== photo.category_id;
      if (hero && (!isHero || categoryChanged)) {
        await api.patch(`/categories/${form.category_id}`, { hero_photo_id: photo.id });
      } else if (!hero && isHero && !categoryChanged) {
        await api.patch(`/categories/${photo.category_id}`, { hero_photo_id: null });
      }
      toast.success("Photo updated");
      onSaved();
    } catch (error) {
      toast.error(errorText(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} busy={saving} labelledBy="edit-photo-title" className="max-w-4xl">
      <form onSubmit={save} data-testid="photo-editor" className="grid md:grid-cols-[1.1fr_1fr]">
        {/* Focal point picker */}
        <div className="bg-surface-2 p-4 sm:p-5">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted">
            <Crosshair size={13} className="text-sun" /> Tap the face or subject — every crop on the site keeps it in view.
          </p>
          <div className="relative mx-auto w-fit cursor-crosshair select-none" onClick={pickFocus} data-testid="focus-picker">
            <img ref={imgRef} src={src} alt={form.alt || categoryName} draggable={false} className="block max-h-[42vh] w-auto max-w-full rounded-2xl" />
            <span
              className="pointer-events-none absolute h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_3px_rgb(var(--sun)),0_4px_12px_rgba(0,0,0,0.5)] transition-all"
              style={{ left: `${focus.x}%`, top: `${focus.y}%` }}
            />
          </div>
          <div className="mt-4 grid grid-cols-[2fr_3fr_5fr] items-end gap-2">
            {PREVIEWS.map((p) => (
              <div key={p.label}>
                <div className="overflow-hidden rounded-lg bg-bg" style={{ aspectRatio: p.ratio }}>
                  <img src={src} alt="" style={{ objectPosition: position }} className="h-full w-full object-cover" />
                </div>
                <p className="mt-1 text-center text-[10px] text-muted">{p.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {form.focus && (
              <button type="button" onClick={() => set("focus", null)} className="chip !px-3 !py-1.5 text-xs">Reset focus</button>
            )}
            <button type="button" onClick={() => fileRef.current?.click()} className="chip !px-3 !py-1.5 text-xs" data-testid="replace-photo">
              <RefreshCw size={12} /> {replacement ? "Choose a different file" : "Replace image"}
            </button>
          </div>
          {replacement && <p className="mt-2 text-xs text-butter">New image will be uploaded when you save.</p>}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setReplacement({ file, preview: URL.createObjectURL(file) });
                set("focus", null);
              }
              e.target.value = "";
            }}
          />
        </div>

        <div className="flex flex-col p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 id="edit-photo-title" className="font-display text-2xl font-bold">Edit photo</h2>
            <button type="button" onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full bg-ink/5 text-muted hover:text-ink">
              <X size={18} />
            </button>
          </div>

          <label className="mt-4 block">
            <span className="mb-1.5 block text-sm font-medium">Category</span>
            <select value={form.category_id} onChange={(e) => set("category_id", e.target.value)} className="input !py-2.5" data-testid="edit-category">
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>

          <label className="mt-4 block">
            <span className="mb-1.5 block text-sm font-medium">Caption / alt text</span>
            <input
              value={form.alt}
              onChange={(e) => set("alt", e.target.value)}
              maxLength={200}
              placeholder="e.g. Aarav's first birthday cake moment"
              className="input !py-2.5"
              data-testid="edit-alt"
            />
            <span className="mt-1 block text-xs text-muted">Shown in the lightbox and read by screen readers and Google.</span>
          </label>

          <p className="mb-2 mt-5 text-sm font-medium">Where it appears</p>
          <div className="space-y-2">
            <Switch checked={hero} onChange={setHero} icon={Star} title={`Hero of ${categoryName}`} hint="Cover of the category — also used on its linked service card" testid="edit-category-hero" />
            <Switch checked={form.show_in_gallery} onChange={(v) => set("show_in_gallery", v)} icon={Eye} title="Gallery page" hint="Listed under its category on /gallery" />
            <Switch checked={form.show_in_hero} onChange={(v) => set("show_in_hero", v)} icon={Sparkles} title="Home slideshow" hint="Rotates in the big photo grid at the top of the home page" />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-line pt-5">
            <button
              type="button"
              onClick={() => onDelete(photo)}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
              data-testid="editor-delete"
            >
              <Trash2 size={14} /> Delete
            </button>
            <div className="ml-auto flex gap-2">
              <button type="button" onClick={onClose} disabled={saving} className="btn-ghost !py-2.5">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary !py-2.5 disabled:opacity-60" data-testid="editor-save">
                {saving && <Loader2 size={16} className="animate-spin" />} {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}

function Switch({ checked, onChange, icon: Icon, title, hint, testid }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      data-testid={testid}
      className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors ${
        checked ? "border-mint/40 bg-mint/10" : "border-line hover:border-ink/25"
      }`}
    >
      <Icon size={16} className={checked ? "text-mint" : "text-muted"} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{title}</span>
        <span className="block text-xs text-muted">{hint}</span>
      </span>
      <span className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${checked ? "bg-mint" : "bg-ink/15"}`}>
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-bg transition-all ${checked ? "left-5" : "left-1"}`} />
      </span>
    </button>
  );
}
