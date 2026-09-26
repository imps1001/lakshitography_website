import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getAdminFromRequest } from "@/lib/server/auth";
import {
  cleanCategoryName, edgeOrder, findCategoryByName, listPortfolio, portfolioCollections,
} from "@/lib/server/portfolio";
import { apiError, requestJson } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { categories } = await listPortfolio(await portfolioCollections());
  return NextResponse.json(categories, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request) {
  const admin = await getAdminFromRequest(request);
  if (admin.error) return apiError(admin.error, admin.status);
  const { name, error } = cleanCategoryName((await requestJson(request))?.name);
  if (error) return apiError(error);

  const { categories } = await portfolioCollections();
  if (await findCategoryByName(categories, name)) return apiError(`A category called "${name}" already exists.`, 409);

  const category = {
    id: randomUUID(),
    name,
    order: (await edgeOrder(categories, -1)) + 1,
    hero_photo_id: null,
    created_at: new Date().toISOString(),
  };
  await categories.insertOne(category);
  delete category._id;
  return NextResponse.json(category, { status: 201 });
}
