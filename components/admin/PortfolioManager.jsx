"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Eye, EyeOff, GripVertical, ImagePlus, Pencil, Sparkles, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { PORTFOLIO_KEY, focusPosition, usePortfolio } from "@/lib/portfolio";
import { SERVICES_KEY, useServices } from "@/lib/services";
import { optimizedImage } from "@/lib/utils";
import { CategoryHeader, CategorySidebar, DeleteCategoryDialog, ServiceCardsStrip } from "./CategoryPanel";
import PhotoEditor from "./PhotoEditor";
import Uploader from "./Uploader";
import { IconButton, Toggle, errorText } from "./ui";

const VIEWS = [
  { value: "all", label: "All" },
  { value: "gallery", label: "In gallery" },
  { value: "hero", label: "In home slideshow" },
  { value: "hidden", label: "Hidden" },
];

export default function PortfolioManager() {
  const queryClient = useQueryClient();
  const { categories, photos, loading, heroOf, categoryName, coverFor } = usePortfolio();
  const { services } = useServices();
  const [selected, setSelected] = useState("all"); // "all" or a category id
  const [view, setView] = useState("all");
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [overId, setOverId] = useState(null);

  const category = categories.find((c) => c.id === selected) || null;
  const visible = useMemo(() => photos.filter((p) => {
    if (category && p.category_id !== category.id) return false;
    if (view === "gallery") return p.show_in_gallery;
    if (view === "hero") return p.show_in_hero;
    if (view === "hidden") return !p.show_in_gallery && !p.show_in_hero;
    return true;
  }), [photos, category, view]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: PORTFOLIO_KEY });

  // Applies an optimistic change to the cached portfolio, runs the request, and rolls back on failure.
  const mutate = async (optimistic, request, { refetch = false, success } = {}) => {
    const previous = queryClient.getQueryData(PORTFOLIO_KEY);
    if (optimistic && previous) queryClient.setQueryData(PORTFOLIO_KEY, optimistic(previous));
    try {
      const response = await request();
      if (success) toast.success(success);
      if (refetch) refresh();
      return response || true;
    } catch (error) {
      if (previous) queryClient.setQueryData(PORTFOLIO_KEY, previous);
      toast.error(errorText(error));
      return false;
    }
  };

  const updatePhotos = (fn) => (data) => ({ ...data, photos: fn(data.photos) });
  const updateCategory = (id, changes) => (data) => ({
    ...data,
    categories: data.categories.map((c) => (c.id === id ? { ...c, ...changes } : c)),
  });

  const patchPhoto = (photo, changes) =>
    mutate(updatePhotos((list) => list.map((p) => (p.id === photo.id ? { ...p, ...changes } : p))), () => api.patch(`/gallery/${photo.id}`, changes));

  const deletePhoto = async (photo) => {
    if (!window.confirm("Delete this photo permanently? It will be removed from the site and from Cloudinary.")) return;
    const ok = await mutate(
      (data) => ({
        photos: data.photos.filter((p) => p.id !== photo.id),
        categories: data.categories.map((c) => (c.hero_photo_id === photo.id ? { ...c, hero_photo_id: null } : c)),
      }),
      () => api.delete(`/gallery/${photo.id}`),
      { success: "Photo deleted" },
    );
    if (ok) setEditing(null);
  };

  const setHero = (cat, photoId) =>
    mutate(updateCategory(cat.id, { hero_photo_id: photoId }), () => api.patch(`/categories/${cat.id}`, { hero_photo_id: photoId }), {
      success: photoId ? `Hero of ${cat.name} updated` : undefined,
    });

  // Reorders within the filtered view, then maps the result back onto the full list so photos
  // outside the view keep their slots.
  const reorderPhotos = (fromId, toIndex) => {
    const ids = visible.map((p) => p.id);
    const fromIndex = ids.indexOf(fromId);
    if (fromIndex === -1 || toIndex < 0 || toIndex >= ids.length || fromIndex === toIndex) return;
    ids.splice(toIndex, 0, ids.splice(fromIndex, 1)[0]);
    const byId = Object.fromEntries(photos.map((p) => [p.id, p]));
    const inView = new Set(ids);
    let k = 0;
    const next = photos.map((p) => (inView.has(p.id) ? byId[ids[k++]] : p));
    mutate(updatePhotos(() => next), () => api.put("/gallery/order", { ids: next.map((p) => p.id) }));
  };

  const createCategory = async (name) => {
    const response = await mutate(null, () => api.post("/categories", { name }), { refetch: true, success: `“${name}” created` });
    if (response) setSelected(response.data.id);
    return Boolean(response);
  };

  const moveCategory = (cat, dir) => {
    const ids = categories.map((c) => c.id);
    const from = ids.indexOf(cat.id);
    const to = from + dir;
    if (to < 0 || to >= ids.length) return;
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    const byId = Object.fromEntries(categories.map((c) => [c.id, c]));
    mutate((data) => ({ ...data, categories: ids.map((id) => byId[id]) }), () => api.put("/categories/order", { ids }));
  };

  const deleteCategory = async (mode, target) => {
    const query = mode === "move" ? `?photos=move&to=${target}` : mode === "delete" ? "?photos=delete" : "";
    const ok = await mutate(null, () => api.delete(`/categories/${deleting.id}${query}`), { refetch: true, success: `“${deleting.name}” deleted` });
    if (ok) {
      setSelected(mode === "move" ? target : "all");
      queryClient.invalidateQueries({ queryKey: SERVICES_KEY }); // linked service cards may have moved
    }
    return Boolean(ok);
  };

  const onDrop = (targetId) => {
    if (dragId && dragId !== targetId) reorderPhotos(dragId, visible.findIndex((p) => p.id === targetId));
    setDragId(null);
    setOverId(null);
  };

  const heroCount = photos.filter((p) => p.show_in_hero).length;
  const editingPhoto = editing && photos.find((p) => p.id === editing);
  const editingCategory = editingPhoto && categories.find((c) => c.id === editingPhoto.category_id);

  return (
    <div data-testid="portfolio-manager" className="grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)]">
      <CategorySidebar
        categories={categories}
        photos={photos}
        heroOf={heroOf}
        selected={category ? category.id : "all"}
        onSelect={(id) => { setSelected(id); setView("all"); }}
        onCreate={createCategory}
      />

      <div className="min-w-0 space-y-6">
        {category ? (
          <CategoryHeader
            key={category.id}
            category={category}
            categories={categories}
            photos={photos}
            services={services}
            hero={heroOf(category)}
            onRename={(name) => mutate(updateCategory(category.id, { name }), () => api.patch(`/categories/${category.id}`, { name }), { success: "Category renamed" })}
            onResetHero={() => setHero(category, null)}
            onMove={(dir) => moveCategory(category, dir)}
            onDelete={() => setDeleting(category)}
          />
        ) : (
          <ServiceCardsStrip services={services} categories={categories} coverFor={coverFor} onSelect={setSelected} />
        )}

        {categories.length > 0 && <Uploader categories={categories} defaultCategoryId={category?.id} onUploaded={refresh} />}

        <section>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-bold">
                {category ? category.name : "All photos"} <span className="text-muted">({visible.length})</span>
              </h2>
              <p className="mt-1 text-sm text-muted">
                Drag to reorder · ☆ sets the category hero · Home slideshow shows {heroCount || "the first 6 gallery"} photo{heroCount === 1 ? "" : "s"}.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {VIEWS.map((v) => (
                <button key={v.value} type="button" aria-pressed={view === v.value} onClick={() => setView(v.value)} className="chip !px-3 !py-1.5 text-xs">
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-[4/5] animate-pulse rounded-3xl bg-surface" />)}
            </div>
          ) : visible.length === 0 ? (
            <div className="card mt-5 p-12 text-center">
              <ImagePlus size={32} className="mx-auto text-sun/70" />
              <p className="mt-4 font-display text-xl font-bold">{view === "all" ? "No photos here yet" : "No photos match this filter"}</p>
              <p className="mt-1 text-sm text-muted">{view === "all" ? "Upload some with the box above." : "Try another filter."}</p>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {visible.map((photo, index) => {
                const photoCategory = categories.find((c) => c.id === photo.category_id);
                return (
                  <PhotoCard
                    key={photo.id}
                    photo={photo}
                    index={index}
                    total={visible.length}
                    categoryLabel={category ? null : categoryName(photo.category_id)}
                    isHero={photoCategory?.hero_photo_id === photo.id}
                    heroLabel={photoCategory?.name}
                    dragging={dragId === photo.id}
                    over={overId === photo.id && dragId !== photo.id}
                    onDragStart={() => setDragId(photo.id)}
                    onDragEnter={() => setOverId(photo.id)}
                    onDragEnd={() => { setDragId(null); setOverId(null); }}
                    onDrop={() => onDrop(photo.id)}
                    onMove={(dir) => reorderPhotos(photo.id, index + dir)}
                    onToggle={(field) => patchPhoto(photo, { [field]: !photo[field] })}
                    onHero={() => photoCategory && setHero(photoCategory, photoCategory.hero_photo_id === photo.id ? null : photo.id)}
                    onEdit={() => setEditing(photo.id)}
                    onDelete={() => deletePhoto(photo)}
                  />
                );
              })}
            </div>
          )}
        </section>
      </div>

      {editingPhoto && (
        <PhotoEditor
          key={editingPhoto.id}
          photo={editingPhoto}
          categories={categories}
          isHero={editingCategory?.hero_photo_id === editingPhoto.id}
          onClose={() => setEditing(null)}
          onSaved={() => { refresh(); setEditing(null); }}
          onDelete={deletePhoto}
        />
      )}
      {deleting && (
        <DeleteCategoryDialog
          category={deleting}
          categories={categories}
          photoCount={photos.filter((p) => p.category_id === deleting.id).length}
          onClose={() => setDeleting(null)}
          onConfirm={deleteCategory}
        />
      )}
    </div>
  );
}

function PhotoCard({
  photo, index, total, categoryLabel, isHero, heroLabel, dragging, over,
  onDragStart, onDragEnter, onDragEnd, onDrop, onMove, onToggle, onHero, onEdit, onDelete,
}) {
  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; onDragStart(); }}
      onDragEnter={onDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDragEnd={onDragEnd}
      onDrop={(e) => { e.preventDefault(); onDrop(); }}
      data-testid={`photo-card-${photo.id}`}
      className={`group overflow-hidden rounded-3xl border bg-surface transition-all ${
        over ? "border-sun ring-4 ring-sun/20" : isHero ? "border-butter/60" : "border-line"
      } ${dragging ? "opacity-40" : ""}`}
    >
      <div className="relative aspect-[4/5] cursor-grab overflow-hidden active:cursor-grabbing">
        <img
          src={optimizedImage(photo.url, 500)}
          alt={photo.alt || heroLabel}
          draggable={false}
          style={{ objectPosition: focusPosition(photo) }}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-x-2 top-2 flex items-start justify-between gap-2">
          <span className="flex items-center gap-1 rounded-full bg-bg/70 px-2 py-1 text-[11px] font-semibold backdrop-blur-md">
            <GripVertical size={12} /> #{index + 1}
          </span>
          <IconButton
            label={isHero ? `Hero of ${heroLabel} — click to unset` : `Make hero of ${heroLabel}`}
            onClick={onHero}
            active={isHero}
            testid={`hero-photo-${photo.id}`}
          >
            <Star size={14} className={isHero ? "fill-current" : ""} />
          </IconButton>
        </div>
        {(categoryLabel || isHero) && (
          <div className="absolute inset-x-2 bottom-2 flex flex-wrap gap-1">
            {isHero && <span className="rounded-full bg-butter px-2 py-0.5 text-[10px] font-bold text-bg">★ Hero</span>}
            {categoryLabel && <span className="rounded-full bg-bg/70 px-2 py-0.5 text-[10px] font-semibold backdrop-blur-md">{categoryLabel}</span>}
          </div>
        )}
        <div className="absolute right-2 top-12 flex flex-col gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
          <IconButton label="Move earlier" disabled={index === 0} onClick={() => onMove(-1)}><ArrowUp size={14} /></IconButton>
          <IconButton label="Move later" disabled={index === total - 1} onClick={() => onMove(1)}><ArrowDown size={14} /></IconButton>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 p-2.5">
        <Toggle on={photo.show_in_gallery} onClick={() => onToggle("show_in_gallery")} testid={`toggle-gallery-${photo.id}`}>
          {photo.show_in_gallery ? <Eye size={12} /> : <EyeOff size={12} />} Gallery
        </Toggle>
        <Toggle on={photo.show_in_hero} onClick={() => onToggle("show_in_hero")} testid={`toggle-hero-${photo.id}`} title="Home slideshow">
          <Sparkles size={12} /> Slideshow
        </Toggle>
        <div className="ml-auto flex gap-1">
          <IconButton label="Edit photo" onClick={onEdit} testid={`edit-photo-${photo.id}`}><Pencil size={14} /></IconButton>
          <IconButton label="Delete photo" onClick={onDelete} danger testid={`delete-photo-${photo.id}`}><Trash2 size={14} /></IconButton>
        </div>
      </div>
    </div>
  );
}
