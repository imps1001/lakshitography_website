import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getAdminFromRequest } from "@/lib/server/auth";
import { edgeOrder } from "@/lib/server/portfolio";
import { listServices, parseService, priceRangeError, serviceCollections, uniqueSlug } from "@/lib/server/services";
import { apiError, requestJson } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public: all services in admin order, including hidden ones (the site filters on `visible`).
export async function GET() {
  const { services } = await serviceCollections();
  return NextResponse.json(await listServices(services), { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request) {
  const admin = await getAdminFromRequest(request);
  if (admin.error) return apiError(admin.error, admin.status);

  const { services, categories } = await serviceCollections();
  const { service: fields, error } = await parseService(await requestJson(request), categories);
  if (error) return apiError(error);
  const rangeError = priceRangeError(fields);
  if (rangeError) return apiError(rangeError);

  const service = {
    id: randomUUID(),
    slug: await uniqueSlug(services, fields.name),
    ...fields,
    order: (await edgeOrder(services, -1)) + 1,
    created_at: new Date().toISOString(),
  };
  await services.insertOne(service);
  delete service._id;
  return NextResponse.json(service, { status: 201 });
}
