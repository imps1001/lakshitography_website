import { randomUUID } from "crypto";
import { getDatabase } from "./database";
import { DEFAULT_CATEGORIES, DEFAULT_SERVICES } from "@/data/content";


const projection = { _id: 0 };
// Case-insensitive comparison for category names.
const caseInsensitive = { locale: "en", strength: 2 };
let setupPromise;

// One-time (per process) setup: indexes, seeding categories, and migrating photos from the
// older schema (category name + per-service cover_for) to category_id + category hero photos.
async function ensurePortfolioShape(db) {
  if (!setupPromise) {
    setupPromise = (async () => {
      const photos = db.collection("gallery");
      const categories = db.collection("categories");
      await photos.createIndex({ id: 1 }, { unique: true });
      await photos.createIndex({ order: 1 });
      await categories.createIndex({ id: 1 }, { unique: true });
      await categories.createIndex({ order: 1 });

      if (!(await categories.countDocuments({}))) {
        const used = (await photos.distinct("category")).filter((name) => typeof name === "string" && name.trim());
        const names = [...new Set([...DEFAULT_CATEGORIES, ...used])];
        const now = new Date().toISOString();
        await categories.insertMany(names.map((name, order) => ({
          id: randomUUID(),
          name,
          order,
          hero_photo_id: null,
          // Temporary link read (then removed) when services are seeded — see lib/server/services.js.
          service_slug: DEFAULT_SERVICES.find((service) => service.category === name)?.slug || null,
          created_at: now,
        })));
      }

      const legacy = await photos.find({ category_id: { $exists: false } }).toArray();
      if (legacy.length) {
        const all = await categories.find({}).sort({ order: 1 }).toArray();
        const byName = new Map(all.map((c) => [c.name.toLowerCase(), c]));
        for (const photo of legacy) {
          const category = byName.get(String(photo.category || "").toLowerCase()) || all[0];
          await photos.updateOne({ id: photo.id }, { $set: { category_id: category.id }, $unset: { category: "" } });
          // Old per-service covers become the hero of the category linked to that service.
          for (const slug of photo.cover_for || []) {
            await categories.updateOne({ service_slug: slug, hero_photo_id: null }, { $set: { hero_photo_id: photo.id } });
          }
        }
      }
      await photos.updateMany({ cover_for: { $exists: true } }, { $unset: { cover_for: "" } });

      const defaults = { show_in_gallery: true, show_in_hero: false, alt: "", focus: null };
      for (const [field, value] of Object.entries(defaults)) {
        await photos.updateMany({ [field]: { $exists: false } }, { $set: { [field]: value } });
      }
      const unordered = await photos.find({ order: { $exists: false } }, { projection: { id: 1 } })
        .sort({ created_at: -1 }).toArray();
      if (unordered.length) {
        const start = (await edgeOrder(photos, -1)) + 1;
        await photos.bulkWrite(unordered.map((photo, i) => ({
          updateOne: { filter: { id: photo.id }, update: { $set: { order: start + i } } },
        })));
      }
    })().catch((error) => {
      setupPromise = undefined;
      throw error;
    });
  }
  await setupPromise;
}

export async function portfolioCollections() {
  const db = await getDatabase();
  await ensurePortfolioShape(db);
  return { photos: db.collection("gallery"), categories: db.collection("categories") };
}

export async function listPortfolio({ photos, categories }) {
  const [categoryList, photoList] = await Promise.all([
    categories.find({}, { projection }).sort({ order: 1, created_at: 1 }).toArray(),
    photos.find({}, { projection }).sort({ order: 1, created_at: -1 }).toArray(),
  ]);
  return { categories: categoryList, photos: photoList };
}

export function findPhoto(photos, id) {
  return photos.findOne({ id }, { projection });
}

export function findCategory(categories, id) {
  return typeof id === "string" ? categories.findOne({ id }, { projection }) : null;
}

export function findCategoryByName(categories, name, exceptId) {
  return categories.findOne({ name, id: { $ne: exceptId } }, { collation: caseInsensitive });
}

// Highest (direction -1) or lowest (direction 1) order value currently in use.
export async function edgeOrder(collection, direction) {
  const [edge] = await collection.find({ order: { $exists: true } }, { projection: { order: 1 } })
    .sort({ order: direction }).limit(1).toArray();
  return edge?.order ?? 0;
}

// A photo can only be the hero of the category it belongs to.
export function clearHeroReferences(categories, photoId, keepCategoryId = null) {
  return categories.updateMany(
    { hero_photo_id: photoId, id: { $ne: keepCategoryId } },
    { $set: { hero_photo_id: null } },
  );
}

export async function saveOrder(collection, ids) {
  if (!ids.length) return;
  await collection.bulkWrite(ids.map((id, order) => ({
    updateOne: { filter: { id }, update: { $set: { order } } },
  })));
}

export function isIdList(ids) {
  return Array.isArray(ids) && ids.every((id) => typeof id === "string") && new Set(ids).size === ids.length;
}

// Focal point as percentages; null means "use the default crop".
export function parseFocus(value) {
  if (value === null) return { ok: true, focus: null };
  const x = Number(value?.x);
  const y = Number(value?.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return { ok: false };
  const clamp = (n) => Math.round(Math.min(100, Math.max(0, n)));
  return { ok: true, focus: { x: clamp(x), y: clamp(y) } };
}

export function cleanAlt(value) {
  return typeof value === "string" ? value.trim().slice(0, 200) : "";
}

export function cleanCategoryName(value) {
  const name = typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
  if (!name || name.length > 40) return { error: "Category name must be between 1 and 40 characters." };
  return { name };
}
