"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, UploadCloud } from "lucide-react";
import { Alert } from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * Uploads a file to /api/admin/upload, then calls the passed server action to
 * attach the returned URL. Two steps rather than one because a server action
 * receiving a 5MB file would have to buffer it through the action payload.
 */
export function ImageUploader({
  folder,
  onUploaded,
  hint,
}: {
  folder: "products" | "categories";
  /** Server action that stores the URL against the record. */
  onUploaded: (url: string) => Promise<void>;
  hint?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);

    try {
      // Sequential rather than parallel: a shop owner on a Tanzanian mobile
      // connection uploading five photos at once would stall all five.
      for (const file of Array.from(files)) {
        const body = new FormData();
        body.append("file", file);
        body.append("folder", folder);

        const response = await fetch("/api/admin/upload", {
          method: "POST",
          body,
        });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error ?? "Upload failed.");
        }

        await onUploaded(result.url);
      }

      startTransition(() => router.refresh());
      if (inputRef.current) inputRef.current.value = "";
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Upload failed.",
      );
    } finally {
      setUploading(false);
    }
  }

  const busy = uploading || pending;

  return (
    <div className="space-y-3">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void handleFiles(event.dataTransfer.files);
        }}
        className={cn(
          "rounded-xl border-2 border-dashed p-6 text-center transition-colors",
          dragging ? "border-brand-500 bg-brand-50" : "border-ink-300 bg-ink-50",
          busy && "opacity-60",
        )}
      >
        <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-lg bg-white text-brand-600">
          {busy ? (
            <Loader2 size={22} aria-hidden className="animate-spin" />
          ) : (
            <UploadCloud size={22} aria-hidden />
          )}
        </div>

        <p className="text-sm font-medium text-ink-900">
          {busy ? "Uploading…" : "Drag photos here, or"}{" "}
          {!busy ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-brand-700 underline hover:text-brand-800"
            >
              choose files
            </button>
          ) : null}
        </p>
        <p className="mt-1 text-xs text-ink-500">
          {hint ?? "JPEG, PNG or WebP · up to 5MB each"}
        </p>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={busy}
          onChange={(event) => void handleFiles(event.target.files)}
          className="sr-only"
        />
      </div>

      {error ? (
        <Alert tone="danger">
          <span className="flex items-start gap-2">
            <ImagePlus size={16} aria-hidden className="mt-0.5 shrink-0" />
            {error}
          </span>
        </Alert>
      ) : null}
    </div>
  );
}
