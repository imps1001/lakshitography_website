import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/server/auth";
import { findService, parseService, priceRangeError, serviceCollections } from "@/lib/server/services";
import { apiError, requestJson } from "@/lib/server/http";

export const runtime = "nodejs";

export async function PATCH(request, { params }) {
  const admin = await getAdminFromRequest(request);
  if (admin.error) return apiError(admin.error, admin.status);

  const { serviceId } = await params;
  const { services, categories, photos } = await serviceCollections();
  const existing = await findService(services, serviceId);
  if (!existing) return apiError("Service not found", 404);

  const { service: update, error } = await parseService(await requestJson(request), categories, { partial: true, photos });
  if (error) return apiError(error);
  if (!Object.keys(update).length) return apiError("Nothing to update.");
  const rangeError = priceRangeError({ ...existing, ...update });
  if (rangeError) return apiError(rangeError);

  const service = await services.findOneAndUpdate(
    { id: serviceId },
    { $set: { ...update, updated_at: new Date().toISOString() } },
    { returnDocument: "after", projection: { _id: 0 } },
  );
  return NextResponse.json(service);
}

// Existing bookings keep their stored service name, so deleting is safe for past enquiries.
export async function DELETE(request, { params }) {
  const admin = await getAdminFromRequest(request);
  if (admin.error) return apiError(admin.error, admin.status);
  const { serviceId } = await params;
  const { services } = await serviceCollections();
  const result = await services.deleteOne({ id: serviceId });
  if (!result.deletedCount) return apiError("Service not found", 404);
  return NextResponse.json({ ok: true });
}
