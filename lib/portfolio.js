"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const PORTFOLIO_KEY = ["portfolio"];
const EMPTY = { categories: [], photos: [] };

// Where a photo is anchored when cropped. Faces usually sit in the upper third, so the default
// leans up rather than dead centre.
export const DEFAULT_FOCUS = { x: 50, y: 30 };

export function focusPosition(photo) {
  const { x, y } = photo?.focus || DEFAULT_FOCUS;
  return `${x}% ${y}%`;
}

// A category's hero: the photo picked in admin, otherwise its first photo (gallery photos first).
// The picked photo is honoured even if it sits in another category — covers chosen before
// categories existed were migrated that way.
export function categoryHero(category, photos) {
  if (!category) return null;
  const inCategory = photos.filter((photo) => photo.category_id === category.id);
  return (
    photos.find((photo) => photo.id === category.hero_photo_id) ||
    inCategory.find((photo) => photo.show_in_gallery) ||
    inCategory[0] ||
    null
  );
}

export function usePortfolio() {
  const query = useQuery({
    queryKey: PORTFOLIO_KEY,
    queryFn: () => api.get("/portfolio").then((response) => response.data),
  });
  const { categories, photos } = query.data || EMPTY;
  const gallery = photos.filter((photo) => photo.show_in_gallery);
  const flaggedHero = photos.filter((photo) => photo.show_in_hero);
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  return {
    categories,
    photos,
    gallery,
    // Until home-slideshow photos are picked in admin, fall back to the first gallery photos.
    hero: flaggedHero.length ? flaggedHero : gallery.slice(0, 6),
    loading: query.isLoading,
    categoryName: (id) => categoryById.get(id)?.name || "",
    heroOf: (category) => categoryHero(category, photos),
    // Each service card shows the hero image of the category chosen for it in admin.
    // A photo picked straight from the gallery wins over the category hero.
    coverFor: (service) =>
      photos.find((photo) => photo.id === service?.image_photo_id) ||
      categoryHero(categoryById.get(service?.category_id), photos),
  };
}
