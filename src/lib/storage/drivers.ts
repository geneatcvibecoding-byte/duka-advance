import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { StorageDriver, StoredFile } from "./types";

/**
 * Product image storage, chosen the same way payment providers are: an
 * interface with swappable implementations, picked from the environment.
 *
 *   Supabase Storage — used whenever its credentials are present. Required on
 *                      Vercel, whose filesystem is wiped on every deploy.
 *   Local disk       — development and any VPS with a real disk.
 */

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "product-images";

function safeName(extension: string): string {
  // A generated name means an uploaded filename can never contain a path
  // traversal sequence or overwrite an existing file.
  return `${randomUUID()}.${extension}`;
}

class SupabaseStorage implements StorageDriver {
  readonly id = "supabase";

  isEnabled() {
    return Boolean(
      process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
    );
  }

  async upload({
    bytes,
    extension,
    contentType,
    folder,
  }: {
    bytes: Uint8Array;
    extension: string;
    contentType: string;
    folder: string;
  }): Promise<StoredFile> {
    const baseUrl = process.env.SUPABASE_URL!.replace(/\/$/, "");
    const key = `${folder}/${safeName(extension)}`;

    const response = await fetch(
      `${baseUrl}/storage/v1/object/${BUCKET}/${key}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
        body: new Uint8Array(bytes),
      },
    );

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(
        `Supabase Storage rejected the upload (${response.status}). ` +
          `Check the "${BUCKET}" bucket exists and is public. ${detail}`.trim(),
      );
    }

    return {
      key,
      url: `${baseUrl}/storage/v1/object/public/${BUCKET}/${key}`,
    };
  }

  async delete(key: string): Promise<void> {
    const baseUrl = process.env.SUPABASE_URL!.replace(/\/$/, "");
    await fetch(`${baseUrl}/storage/v1/object/${BUCKET}/${key}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      },
    });
  }
}

class LocalDiskStorage implements StorageDriver {
  readonly id = "local";

  isEnabled() {
    // Vercel's filesystem is read-only apart from /tmp, and /tmp does not
    // survive between invocations — writing there would lose images silently.
    return process.env.VERCEL !== "1";
  }

  async upload({
    bytes,
    extension,
    folder,
  }: {
    bytes: Uint8Array;
    extension: string;
    contentType: string;
    folder: string;
  }): Promise<StoredFile> {
    const name = safeName(extension);
    const directory = join(process.cwd(), "public", "uploads", folder);

    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, name), bytes);

    return { key: `${folder}/${name}`, url: `/uploads/${folder}/${name}` };
  }

  async delete(key: string): Promise<void> {
    try {
      await unlink(join(process.cwd(), "public", "uploads", key));
    } catch {
      // Already gone is the desired end state either way.
    }
  }
}

const DRIVERS: StorageDriver[] = [new SupabaseStorage(), new LocalDiskStorage()];

/** First enabled driver wins, so Supabase takes precedence when configured. */
export function getStorageDriver(): StorageDriver | null {
  return DRIVERS.find((driver) => driver.isEnabled()) ?? null;
}

export function storageStatus(): {
  driver: string | null;
  message: string;
} {
  const driver = getStorageDriver();

  if (!driver) {
    return {
      driver: null,
      message:
        "No image storage configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to upload images on Vercel.",
    };
  }

  return {
    driver: driver.id,
    message:
      driver.id === "local"
        ? "Images are saved to public/uploads on this machine. This does not work on Vercel — configure Supabase Storage before deploying."
        : "Images are uploaded to Supabase Storage.",
  };
}
