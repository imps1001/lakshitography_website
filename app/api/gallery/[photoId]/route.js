import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/server/auth";
import { deleteGalleryImage, verifyGalleryUpload } from "@/lib/server/cloudinary";
import {
  cleanAlt, clearHeroReferences, findCategory, findPhoto, parseFocus, portfolioCollections,
} from "@/lib/server/portfolio";
import { apiError, requestJson } from "@/lib/server/http";

export const runtime = "nodejs";

// Update details: category, alt text, placements and focal point.
export async function PATCH(request, { params }) {
  const admin = await getAdminFromRequest(request);
  if (admin.error) return apiError(admin.error, admin.status);
  const body = await requestJson(request);
  if (!body || typeof body !== "object") return apiError("Invalid request body.");

  const { photoId } = await params;
  const { photos, categories } = await portfolioCollections();
  if (!(await findPhoto(photos, photoId))) return apiError("Photo not found", 404);

  const update = {};
  if ("category_id" in body) {
    if (!(await findCategory(categories, body.category_id))) return apiError("Choose a valid category.");
    update.category_id = body.category_id;
  }
  if ("alt" in body) update.alt = cleanAlt(body.alt);
  for (const field of ["show_in_gallery", "show_in_hero"]) {
    if (field in body) {
      if (typeof body[field] !== "boolean") return apiError(`${field} must be true or false.`);
      update[field] = body[field];
    }
  }
  if ("focus" in body) {
    const parsed = parseFocus(body.focus);
    if (!parsed.ok) return apiError("focus must be { x, y } percentages or null.");
    update.focus = parsed.focus;
  }
  if (!Object.keys(update).length) return apiError("Nothing to update.");

  if (update.category_id) await clearHeroReferences(categories, photoId, update.category_id);
  const photo = await photos.findOneAndUpdate(
    { id: photoId }, { $set: update }, { returnDocument: "after", projection: { _id: 0 } },
  );
  return NextResponse.json(photo);
}

// Replace the image with one the browser just uploaded to Cloudinary, keeping the photo's
// placement, category and order. Body: { public_id }
export async function PUT(request, { params }) {
  const admin = await getAdminFromRequest(request);
  if (admin.error) return apiError(admin.error, admin.status);
  const body = await requestJson(request);

  const { photoId } = await params;
  const { photos } = await portfolioCollections();
  const existing = await findPhoto(photos, photoId);
  if (!existing) return apiError("Photo not found", 404);

  const { image, error } = await verifyGalleryUpload(body?.public_id);
  if (error) return apiError(error);

  const photo = await photos.findOneAndUpdate(
    { id: photoId },
    {
      $set: {
        ...image,
        focus: null, // the old focal point doesn't apply to a different image
        updated_at: new Date().toISOString(),
      },
    },
    { returnDocument: "after", projection: { _id: 0 } },
  );
  if (existing.public_id !== image.public_id) await deleteGalleryImage(existing.public_id);
  return NextResponse.json(photo);
}

export async function DELETE(request, { params }) {
  const admin = await getAdminFromRequest(request);
  if (admin.error) return apiError(admin.error, admin.status);
  const { photoId } = await params;
  const { photos, categories } = await portfolioCollections();
  const existing = await findPhoto(photos, photoId);
  if (!existing) return apiError("Photo not found", 404);
  await photos.deleteOne({ id: photoId });
  await clearHeroReferences(categories, photoId);
  await deleteGalleryImage(existing.public_id);
  return NextResponse.json({ ok: true });
}
