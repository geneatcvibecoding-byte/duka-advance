export type StoredFile = {
  /** Public URL the browser can load the image from. */
  url: string;
  /** Driver-specific key, kept so the file can be deleted later. */
  key: string;
};

export interface StorageDriver {
  readonly id: string;
  /** Human-readable reason shown in the admin panel when unavailable. */
  isEnabled(): boolean;
  upload(input: {
    bytes: Uint8Array;
    extension: string;
    contentType: string;
    folder: string;
  }): Promise<StoredFile>;
  delete(key: string): Promise<void>;
}

/** What the browser is allowed to send, checked against real file signatures. */
export const ALLOWED_IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export type AllowedImageType = keyof typeof ALLOWED_IMAGE_TYPES;

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Identifies an image from its leading bytes rather than trusting the
 * Content-Type the browser claims, which anyone can set to anything.
 * Returns null when the bytes are not one of the formats we accept.
 */
export function sniffImageType(bytes: Uint8Array): AllowedImageType | null {
  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (png.every((byte, index) => bytes[index] === byte)) {
    return "image/png";
  }

  // WebP: "RIFF" .... "WEBP"
  const riff = [0x52, 0x49, 0x46, 0x46];
  const webp = [0x57, 0x45, 0x42, 0x50];
  if (
    riff.every((byte, index) => bytes[index] === byte) &&
    webp.every((byte, index) => bytes[index + 8] === byte)
  ) {
    return "image/webp";
  }

  return null;
}
