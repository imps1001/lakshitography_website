import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/server/auth";
import { signGalleryUpload } from "@/lib/server/cloudinary";
import { apiError } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Admin-only: a short-lived signature the browser uses to upload one photo directly to Cloudinary.
export async function POST(request) {
  const admin = await getAdminFromRequest(request);
  if (admin.error) return apiError(admin.error, admin.status);
  return NextResponse.json(signGalleryUpload(), { headers: { "Cache-Control": "no-store" } });
}
