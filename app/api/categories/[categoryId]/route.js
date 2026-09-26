import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/server/auth";
import { deleteGalleryImage } from "@/lib/server/cloudinary";
import { getDatabase } from "@/lib/server/database";
import {
  cleanCategoryName, findCategory, findCategoryByName, findPhoto, portfolioCollections,
} from "@/lib/server/portfolio";
import { apiError, requestJson } from "@/lib/server/http";

export const runtime = "nodejs";

// Update: name, hero_photo_id (a photo in this category, or null).
export async function PATCH(request, { params }) {
  const admin = await getAdminFromRequest(request);
  if (admin.error) return apiError(admin.error, admin.status);
  const body = await requestJson(request);
  if (!body || typeof body !== "object") return apiError("Invalid request body.");

  const { categoryId } = await params;
  const { photos, categories } = await portfolioCollections();
  if (!(await findCategory(categories, categoryId))) return apiError("Category not found", 404);

  const update = {};
  if ("name" in body) {
    const { name, error } = cleanCategoryName(body.name);
    if (error) return apiError(error);
    if (await findCategoryByName(categories, name, categoryId)) return apiError(`A category called "${name}" already exists.`, 409);
    update.name = name;
  }
  if ("hero_photo_id" in body) {
    if (body.hero_photo_id !== null) {
      const photo = await findPhoto(photos, body.hero_photo_id);
      if (!photo || photo.category_id !== categoryId) return apiError("The hero image must be a photo in this category.");
    }
    update.hero_photo_id = body.hero_photo_id;
  }
  if (!Object.keys(update).length) return apiError("Nothing to update.");

  const category = await categories.findOneAndUpdate(
    { id: categoryId }, { $set: update }, { returnDocument: "after", projection: { _id: 0 } },
  );
  return NextResponse.json(category);
}

// Photos in the category must be handled explicitly:
//   ?photos=move&to=<categoryId>  — move them into another category
//   ?photos=delete                — delete them (and their Cloudinary files)
export async function DELETE(request, { params }) {
  const admin = await getAdminFromRequest(request);
  if (admin.error) return apiError(admin.error, admin.status);
  const { categoryId } = await params;
  const { photos, categories } = await portfolioCollections();
  if (!(await findCategory(categories, categoryId))) return apiError("Category not found", 404);
  if ((await categories.countDocuments({})) <= 1) return apiError("You need at least one category.");

  const searchParams = new URL(request.url).searchParams;
  const mode = searchParams.get("photos");
  const inCategory = await photos.find({ category_id: categoryId }, { projection: { id: 1, public_id: 1 } }).toArray();

  if (inCategory.length) {
    if (mode === "move") {
      const target = searchParams.get("to");
      if (target === categoryId || !(await findCategory(categories, target))) return apiError("Choose another category to move the photos into.");
      await photos.updateMany({ category_id: categoryId }, { $set: { category_id: target } });
    } else if (mode === "delete") {
      await photos.deleteMany({ category_id: categoryId });
      for (let i = 0; i < inCategory.length; i += 10) {
        await Promise.all(inCategory.slice(i, i + 10).map((photo) => deleteGalleryImage(photo.public_id)));
      }
    } else {
      return apiError(`This category has ${inCategory.length} photo(s). Choose whether to move or delete them.`, 409);
    }
  }

  // Service cards follow their photos to the new category, or lose their image if they were deleted.
  await (await getDatabase()).collection("services").updateMany(
    { category_id: categoryId },
    { $set: { category_id: mode === "move" && inCategory.length ? searchParams.get("to") : null } },
  );
  await categories.deleteOne({ id: categoryId });
  return NextResponse.json({ ok: true, photos_affected: inCategory.length });
}
