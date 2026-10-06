import { randomUUID } from "crypto";
import { DEFAULT_SERVICES } from "@/data/content";
import { getDatabase } from "./database";
import { portfolioCollections } from "./portfolio";

const projection = { _id: 0 };
const TEXT_LIMITS = { tag: 24, duration: 60, photos: 60, people: 60, add_on: 80 };
let setupPromise;

// Seeds services from DEFAULT_SERVICES once. Each service shows the hero image of a category;
// that link used to live on categories as `service_slug`, so it's carried over and then removed.
async function ensureServices(services, categories) {
  if (!setupPromise) {
    setupPromise = (async () => {
      await services.createIndex({ id: 1 }, { unique: true });
      await services.createIndex({ slug: 1 }, { unique: true });
      await services.createIndex({ order: 1 });

      if (!(await services.countDocuments({}))) {
        const allCategories = await categories.find({}).toArray();
        const now = new Date().toISOString();
        await services.insertMany(DEFAULT_SERVICES.map(({ category: categoryName, ...service }, order) => {
          const linked =
            allCategories.find((c) => c.service_slug === service.slug) ||
            allCategories.find((c) => c.name.toLowerCase() === categoryName.toLowerCase());
          return { id: randomUUID(), ...service, category_id: linked?.id || null, visible: true, order, created_at: now };
        }));
      }
      await categories.updateMany({ service_slug: { $exists: true } }, { $unset: { service_slug: "" } });
    })().catch((error) => {
      setupPromise = undefined;
      throw error;
    });
  }
  await setupPromise;
}

export async function serviceCollections() {
  const collections = await portfolioCollections();
  const services = (await getDatabase()).collection("services");
  await ensureServices(services, collections.categories);
  return { ...collections, services };
}

export function listServices(services) {
  return services.find({}, { projection }).sort({ order: 1, created_at: 1 }).toArray();
}

export function findService(services, id) {
  return services.findOne({ id }, { projection });
}

function slugify(text) {
  return text.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 60) || "service";
}

// Slugs are generated once and never change, so /services#slug links and old bookings stay valid.
export async function uniqueSlug(services, name) {
  const base = slugify(name);
  let slug = base;
  for (let n = 2; await services.findOne({ slug }); n += 1) slug = `${base}-${n}`;
  return slug;
}

// Validates a create/update body. With `partial`, only the fields present are checked.
export async function parseService(body, categories, { partial = false, photos } = {}) {
  if (!body || typeof body !== "object") return { error: "Invalid request body." };
  const has = (key) => !partial || key in body;
  const out = {};

  if (has("name")) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name || name.length > 60) return { error: "Name must be between 1 and 60 characters." };
    out.name = name;
  }
  if (has("tag")) {
    const tag = typeof body.tag === "string" ? body.tag.trim() : "";
    if (tag.length > TEXT_LIMITS.tag) return { error: `Short label must be at most ${TEXT_LIMITS.tag} characters.` };
    out.tag = tag;
  }
  for (const key of ["duration", "photos", "people", "add_on"]) {
    if (key in body) {
      if (typeof body[key] !== "string" || body[key].trim().length > TEXT_LIMITS[key]) return { error: `${key} must be text up to ${TEXT_LIMITS[key]} characters.` };
      out[key] = body[key].trim();
    } else if (!partial) out[key] = "";
  }
  if ("blurb" in body) {
    if (typeof body.blurb !== "string" || body.blurb.trim().length > 300) return { error: "Description must be up to 300 characters." };
    out.blurb = body.blurb.trim();
  } else if (!partial) out.blurb = "";

  if (has("price_min")) {
    if (!Number.isInteger(body.price_min) || body.price_min < 1 || body.price_min > 10_000_000) return { error: "Starting price must be a whole number of rupees." };
    out.price_min = body.price_min;
  }
  if ("price_max" in body) {
    if (body.price_max !== null && (!Number.isInteger(body.price_max) || body.price_max < 1 || body.price_max > 10_000_000)) return { error: "Maximum price must be a whole number of rupees, or empty." };
    out.price_max = body.price_max;
  } else if (!partial) out.price_max = null;

  if ("category_id" in body) {
    if (body.category_id !== null && !(await categories.findOne({ id: body.category_id }))) return { error: "Choose a valid category." };
    out.category_id = body.category_id;
  } else if (!partial) out.category_id = null;

  if ("image_photo_id" in body) {
    if (body.image_photo_id !== null && !(photos && await photos.findOne({ id: body.image_photo_id }))) return { error: "Choose a valid photo from the gallery." };
    out.image_photo_id = body.image_photo_id;
  } else if (!partial) out.image_photo_id = null;

  if ("visible" in body) {
    if (typeof body.visible !== "boolean") return { error: "visible must be true or false." };
    out.visible = body.visible;
  } else if (!partial) out.visible = true;

  return { service: out };
}

export function priceRangeError({ price_min, price_max }) {
  return price_max != null && price_max < price_min ? "Maximum price can't be lower than the starting price." : null;
}
