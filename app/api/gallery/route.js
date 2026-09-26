import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getAdminFromRequest } from "@/lib/server/auth";
import { GALLERY_FOLDER, deleteGalleryImage, verifyGalleryUpload } from "@/lib/server/cloudinary";
import { cleanAlt, edgeOrder, findCategory, portfolioCollections } from "@/lib/server/portfolio";
import { apiError, requestJson } from "@/lib/server/http";

export const runtime = "nodejs";

// Registers a photo the admin's browser has just uploaded to Cloudinary (see /api/uploads/signature).
// Body: { public_id, category_id, show_in_gallery?, show_in_hero?, alt? }
export async function POST(request) {
  const admin = await getAdminFromRequest(request);
  if (admin.error) return apiError(admin.error, admin.status);
  const body = await requestJson(request);
  if (!body || typeof body !== "object") return apiError("Invalid request body.");

  const { photos, categories } = await portfolioCollections();
  const category = await findCategory(categories, body.category_id);
  if (!category) {
    // Don't leave an orphaned file on Cloudinary for a request we're rejecting.
    if (typeof body.public_id === "string" && body.public_id.startsWith(`${GALLERY_FOLDER}/`)) await deleteGalleryImage(body.public_id);
    return apiError("Choose a valid category.");
  }
  if (await photos.findOne({ public_id: body.public_id })) return apiError("This photo has already been added.", 409);

  const { image, error } = await verifyGalleryUpload(body.public_id);
  if (error) return apiError(error);

  const photo = {
    id: randomUUID(),
    category_id: category.id,
    alt: cleanAlt(body.alt),
    ...image,
    show_in_gallery: body.show_in_gallery !== false,
    show_in_hero: body.show_in_hero === true,
    focus: null,
    // New uploads go to the top of the portfolio.
    order: (await edgeOrder(photos, 1)) - 1,
    created_at: new Date().toISOString(),
  };
  await photos.insertOne(photo);
  delete photo._id;
  return NextResponse.json(photo, { status: 201 });
}
