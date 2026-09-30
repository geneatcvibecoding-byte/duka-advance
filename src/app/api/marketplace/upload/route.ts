import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getStorageDriver } from "@/lib/storage/drivers";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_UPLOAD_BYTES,
  sniffImageType,
} from "@/lib/storage/types";

/**
 * Marketplace listing image upload.
 *
 * A copy of the admin upload route, but gated on *verified students* rather
 * than admins: only an account whose university mailbox was verified may host
 * a listing image. The folder is locked to "listings" so a student can never
 * write into the products or categories folders.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  // The session token does not carry verification, so trust the database.
  const full = await prisma.user.findUnique({
    where: { id: user.id },
    select: { studentVerifiedAt: true },
  });
  if (!full?.studentVerifiedAt) {
    return NextResponse.json({ error: "Verify your student email first." }, { status: 403 });
  }

  const driver = getStorageDriver();
  if (!driver) {
    return NextResponse.json(
      { error: "No image storage is configured on this server." },
      { status: 501 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file received." }, { status: 400 });
  }

  if (file.size === 0) {
    return NextResponse.json({ error: "That file is empty." }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: `Images must be ${MAX_UPLOAD_BYTES / 1024 / 1024}MB or smaller.` },
      { status: 413 },
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const detected = sniffImageType(bytes); // signature, not the claimed type
  if (!detected) {
    return NextResponse.json(
      { error: "That file is not a JPEG, PNG or WebP image." },
      { status: 415 },
    );
  }

  try {
    const stored = await driver.upload({
      bytes,
      extension: ALLOWED_IMAGE_TYPES[detected],
      contentType: detected,
      folder: "listings",
    });

    return NextResponse.json({ url: stored.url, key: stored.key });
  } catch (error) {
    console.error("Listing image upload failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Upload failed. Please try again.",
      },
      { status: 500 },
    );
  }
}