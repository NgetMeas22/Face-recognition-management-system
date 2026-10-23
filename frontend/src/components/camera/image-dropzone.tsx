"use client";

import { ImageUp, Loader2 } from "lucide-react";
import { useId, useRef, useState, type DragEvent } from "react";

import { ACCEPT_ATTRIBUTE, formatBytes, ImageValidationError, MAX_UPLOAD_BYTES, validateImageFile, type ValidatedImage } from "@/lib/image-validation";
import { cn } from "@/lib/utils";

/** File picker + drag-and-drop for JPG/PNG. Every file is validated before `onImage` is called. */
export function ImageDropzone({
  onImage,
  disabled = false,
  multiple = false,
}: {
  onImage: (image: ValidatedImage) => void;
  disabled?: boolean;
  multiple?: boolean;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    const problems: string[] = [];
    for (const file of Array.from(files).slice(0, multiple ? 10 : 1)) {
      try {
        onImage(await validateImageFile(file));
      } catch (err) {
        problems.push(`${file.name}: ${err instanceof ImageValidationError ? err.message : "could not be read."}`);
      }
    }
    setErrors(problems);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    if (!disabled) void handleFiles(event.dataTransfer.files);
  }

  return (
    <div className="space-y-2">
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors",
          "focus-within:ring-2 focus-within:ring-ring hover:bg-muted/50",
          dragging && "border-primary bg-primary/5",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        {busy ? <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden /> : <ImageUp className="size-8 text-muted-foreground" aria-hidden />}
        <span className="text-sm font-medium">{multiple ? "Choose or drop images" : "Choose or drop an image"}</span>
        <span className="text-xs text-muted-foreground">JPG or PNG · up to {formatBytes(MAX_UPLOAD_BYTES)} · max 4096×4096 px</span>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={ACCEPT_ATTRIBUTE}
          multiple={multiple}
          disabled={disabled || busy}
          className="sr-only"
          onChange={(e) => void handleFiles(e.target.files)}
          data-testid="image-input"
        />
      </label>
      {errors.length > 0 && (
        <ul className="space-y-1 text-sm text-destructive" role="alert">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
