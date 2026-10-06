"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Camera, Check, FolderPlus, Images, Loader2, Star, Trash2, X } from "lucide-react";
import { focusPosition } from "@/lib/portfolio";
import { optimizedImage } from "@/lib/utils";
import { Modal } from "./ui";

function Thumb({ photo, className = "" }) {
  return photo ? (
    <img src={optimizedImage(photo.url, 300)} alt="" style={{ objectPosition: focusPosition(photo) }} className={`object-cover ${className}`} />
  ) : (
    <span className={`grid place-items-center bg-surface-2 text-ink/25 ${className}`}><Camera size={16} /></span>
  );
}

// Category list: horizontal chips on small screens, a vertical sidebar on large ones.
export function CategorySidebar({ categories, photos, heroOf, selected, onSelect, onCreate }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const count = (id) => photos.filter((p) => p.category_id === id).length;

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    const ok = await onCreate(name.trim());
    setBusy(false);
    if (ok) { setName(""); setAdding(false); }
  };

  const item = (active) =>
    `flex shrink-0 items-center gap-3 rounded-2xl p-2 pr-4 text-left transition-colors lg:pr-3 ${
      active ? "bg-ink text-bg" : "hover:bg-ink/5"
    }`;

  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <p className="mb-3 px-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted">Categories</p>
      <nav className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-2 [scrollbar-width:none] lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0">
        <button type="button" onClick={() => onSelect("all")} className={item(selected === "all")} data-testid="category-all">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sun/15 text-sun"><Images size={18} /></span>
          <span className="flex-1 text-sm font-semibold">All photos</span>
          <span className="text-xs opacity-60">{photos.length}</span>
        </button>
        {categories.map((c) => (
          <button key={c.id} type="button" onClick={() => onSelect(c.id)} className={item(selected === c.id)} data-testid={`category-${c.id}`}>
            <Thumb photo={heroOf(c)} className="h-10 w-10 shrink-0 rounded-xl" />
            <span className="flex-1 truncate text-sm font-semibold">{c.name}</span>
            <span className="text-xs opacity-60">{count(c.id)}</span>
          </button>
        ))}

        {adding ? (
          <form onSubmit={submit} className="flex shrink-0 items-center gap-1 rounded-2xl border border-line p-1.5">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              placeholder="e.g. Maternity"
              className="w-36 min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-muted/60"
              data-testid="new-category-name"
            />
            <button type="submit" disabled={busy || !name.trim()} aria-label="Create category" className="grid h-8 w-8 place-items-center rounded-full bg-sun text-bg disabled:opacity-40" data-testid="new-category-save">
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            </button>
            <button type="button" onClick={() => { setAdding(false); setName(""); }} aria-label="Cancel" className="grid h-8 w-8 place-items-center rounded-full text-muted hover:text-ink">
              <X size={14} />
            </button>
          </form>
        ) : (
          <button type="button" onClick={() => setAdding(true)} className="flex shrink-0 items-center gap-3 rounded-2xl border border-dashed border-ink/20 p-2 pr-4 text-sm font-semibold text-muted transition-colors hover:border-sun hover:text-sun" data-testid="new-category">
            <span className="grid h-10 w-10 place-items-center rounded-xl"><FolderPlus size={18} /></span>
            New category
          </button>
        )}
      </nav>
    </aside>
  );
}

// Settings for the selected category: hero image, name, linked service, position, delete.
export function CategoryHeader({ category, categories, photos, services, hero, onRename, onResetHero, onMove, onDelete }) {
  const [name, setName] = useState(category.name);
  useEffect(() => setName(category.name), [category.id, category.name]);
  const index = categories.findIndex((c) => c.id === category.id);
  const photoCount = photos.filter((p) => p.category_id === category.id).length;
  const explicitHero = Boolean(category.hero_photo_id && hero?.id === category.hero_photo_id);
  const usedBy = services.filter((s) => s.category_id === category.id);

  const saveName = () => {
    if (name.trim() && name.trim() !== category.name) onRename(name.trim());
    else setName(category.name);
  };

  return (
    <section className="card grid gap-5 p-4 sm:grid-cols-[9rem_1fr] sm:p-5" data-testid="category-header">
      <div>
        <div className="relative aspect-[3/4] overflow-hidden rounded-2xl">
          <Thumb photo={hero} className="h-full w-full" />
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-butter px-2 py-0.5 text-[10px] font-bold text-bg">
            <Star size={10} className="fill-current" /> Hero
          </span>
        </div>
        <p className="mt-2 text-center text-[11px] text-muted">
          {!hero ? "No photos yet" : explicitHero ? "Chosen by you" : "Auto: first photo"}
        </p>
        {explicitHero && (
          <button type="button" onClick={onResetHero} className="mx-auto mt-1 block text-[11px] font-semibold text-sun hover:underline">
            Reset to auto
          </button>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted">Category name</span>
          <input
            value={name}
            maxLength={40}
            onChange={(e) => setName(e.target.value)}
            onBlur={saveName}
            onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); if (e.key === "Escape") { setName(category.name); e.currentTarget.blur(); } }}
            className="input !py-2.5 font-display text-xl font-bold"
            data-testid="category-name-input"
          />
        </label>

        <div>
          <span className="mb-1.5 block text-xs font-medium text-muted">Service cards using this hero</span>
          {usedBy.length ? (
            <div className="flex flex-wrap gap-1.5">
              {usedBy.map((s) => (
                <span key={s.id} className="rounded-full bg-butter/15 px-3 py-1 text-xs font-semibold text-butter">{s.name}</span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted">None — pick this category as a service&apos;s card image in the Services tab.</p>
          )}
          <p className="mt-2 text-xs text-muted">Tap ☆ on any photo below to choose the category hero.</p>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs text-muted">{photoCount} photo{photoCount === 1 ? "" : "s"}</span>
          <button type="button" onClick={() => onMove(-1)} disabled={index <= 0} className="chip !px-3 !py-1.5 text-xs disabled:opacity-30">
            <ArrowUp size={12} /> Move up
          </button>
          <button type="button" onClick={() => onMove(1)} disabled={index >= categories.length - 1} className="chip !px-3 !py-1.5 text-xs disabled:opacity-30">
            <ArrowDown size={12} /> Move down
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={categories.length <= 1}
            title={categories.length <= 1 ? "You need at least one category" : undefined}
            className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-30"
            data-testid="category-delete"
          >
            <Trash2 size={12} /> Delete category
          </button>
        </div>
      </div>
    </section>
  );
}

export function DeleteCategoryDialog({ category, categories, photoCount, onClose, onConfirm }) {
  const others = categories.filter((c) => c.id !== category.id);
  const [mode, setMode] = useState("move");
  const [target, setTarget] = useState(others[0]?.id || "");
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    const ok = await onConfirm(photoCount ? mode : null, target);
    setBusy(false);
    if (ok) onClose();
  };

  return (
    <Modal onClose={onClose} busy={busy} labelledBy="delete-category-title" className="max-w-md p-6">
      <h2 id="delete-category-title" className="font-display text-2xl font-bold">Delete &ldquo;{category.name}&rdquo;?</h2>
      {photoCount === 0 ? (
        <p className="mt-3 text-sm text-muted">This category is empty, so nothing else changes.</p>
      ) : (
        <div className="mt-4 space-y-2">
          <p className="text-sm text-muted">It has {photoCount} photo{photoCount === 1 ? "" : "s"}. What should happen to them?</p>
          <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3 ${mode === "move" ? "border-mint/50 bg-mint/10" : "border-line"}`}>
            <input type="radio" name="mode" checked={mode === "move"} onChange={() => setMode("move")} className="mt-1 accent-[rgb(var(--mint))]" />
            <span className="flex-1">
              <span className="block text-sm font-semibold">Move them to another category</span>
              <select value={target} onChange={(e) => setTarget(e.target.value)} onClick={() => setMode("move")} className="input mt-2 !py-2" data-testid="delete-move-target">
                {others.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </span>
          </label>
          <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3 ${mode === "delete" ? "border-red-500/50 bg-red-500/10" : "border-line"}`}>
            <input type="radio" name="mode" checked={mode === "delete"} onChange={() => setMode("delete")} className="mt-1 accent-red-500" data-testid="delete-mode-delete" />
            <span>
              <span className="block text-sm font-semibold text-red-300">Delete all {photoCount} photo{photoCount === 1 ? "" : "s"} too</span>
              <span className="block text-xs text-muted">Removed from the site and Cloudinary. This can&apos;t be undone.</span>
            </span>
          </label>
        </div>
      )}
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" onClick={onClose} disabled={busy} className="btn-ghost !py-2.5">Cancel</button>
        <button
          type="button"
          onClick={confirm}
          disabled={busy || (photoCount > 0 && mode === "move" && !target)}
          className="inline-flex items-center gap-2 rounded-full bg-red-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-400 disabled:opacity-50"
          data-testid="delete-category-confirm"
        >
          {busy && <Loader2 size={14} className="animate-spin" />} Delete category
        </button>
      </div>
    </Modal>
  );
}

// Overview of which category (and hero image) each home/Services card uses.
export function ServiceCardsStrip({ services, categories, coverFor, onSelect }) {
  if (!services.length) return null;
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="font-display text-xl font-bold">Service cards</h2>
      <p className="mt-1 text-sm text-muted">Each card shows the hero image of its category. Tap one to edit that category; change the category in the Services tab.</p>
      <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
        {services.map((s) => {
          const category = categories.find((c) => c.id === s.category_id);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => category && onSelect(category.id)}
              disabled={!category}
              className={`group relative aspect-[3/4] overflow-hidden rounded-2xl border border-line bg-surface text-left disabled:cursor-default ${s.visible ? "" : "opacity-50"}`}
            >
              <Thumb photo={coverFor(s)} className="absolute inset-0 h-full w-full" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
              <div className="absolute inset-x-2 bottom-2">
                <p className="text-xs font-semibold leading-tight text-white">{s.tag || s.name}</p>
                <p className={`mt-0.5 truncate text-[10px] ${category ? "text-butter" : "text-white/60"}`}>
                  {category ? `↳ ${category.name}` : "No category"}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
