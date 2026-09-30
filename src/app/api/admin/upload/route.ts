import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getStorageDriver } from "@/lib/storage/drivers";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_UPLOAD_BYTES,
  sniffImageType,
} from "@/lib/storage/types";

/**
 * Admin image upload.
 *
 * An upload endpoint is the most attacked surface in a shop admin, so this
 * checks, in order: that the caller is an admin, that the payload is small
 * enough, and that the bytes really are an image — the declared Content-Type
 * is never trusted, because the browser sets it and anyone can lie.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not authorised." }, { status: 403 });
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

  // The real check: file signature, not the claimed MIME type.
  const detected = sniffImageType(bytes);
  if (!detected) {
    return NextResponse.json(
      { error: "That file is not a JPEG, PNG or WebP image." },
      { status: 415 },
    );
  }

  const folderRaw = String(formData.get("folder") ?? "products");
  // Whitelist rather than sanitise, so no crafted value can escape the bucket.
  const folder = ["products", "categories"].includes(folderRaw)
    ? folderRaw
    : "products";

  try {
    const stored = await driver.upload({
      bytes,
      extension: ALLOWED_IMAGE_TYPES[detected],
      contentType: detected,
      folder,
    });

    return NextResponse.json({ url: stored.url, key: stored.key });
  } catch (error) {
    console.error("Image upload failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Upload failed. Please try again.",
      },
      { status: 500 },
    );
  }
}
