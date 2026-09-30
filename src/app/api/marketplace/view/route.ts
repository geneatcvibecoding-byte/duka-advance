import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Count one view of a listing.
 *
 * Called by ListingViewPing on the client, so the page render itself stays a
 * pure read. No session is required: views are a popularity signal, not
 * personal data, and requiring a sign-in would undercount most traffic.
 */
export async function POST(request: Request) {
  let listingId: unknown;
  try {
    const body = (await request.json()) as { listingId?: unknown };
    listingId = body.listingId;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (typeof listingId !== "string" || listingId.length === 0) {
    return NextResponse.json({ error: "listingId is required." }, { status: 400 });
  }

  // updateMany rather than update: a deleted listing must not throw here.
  const result = await prisma.listing.updateMany({
    where: { id: listingId },
    data: { viewCount: { increment: 1 } },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
