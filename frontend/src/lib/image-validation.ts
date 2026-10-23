// Client-side checks mirror the upload rules in docs/03-recognition-workflow.md. The backend must
// re-validate everything; these checks only give fast, friendly feedback.
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGE_DIMENSION = 4096;
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png"] as const;
export const ACCEPT_ATTRIBUTE = ".jpg,.jpeg,.png,image/jpeg,image/png";

export type ImageKind = "jpeg" | "png";

/** Detects JPEG/PNG from the file's first bytes, ignoring the (spoofable) extension and MIME type. */
export function sniffImageKind(bytes: Uint8Array): ImageKind | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length >= png.length && png.every((b, i) => bytes[i] === b)) return "png";
  return null;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export type ValidatedImage = {
  file: Blob;
  name: string;
  kind: ImageKind;
  width: number;
  height: number;
  sizeBytes: number;
};

export class ImageValidationError extends Error {}

/** Checks size first (cheap), then magic bytes, then decoded dimensions. */
export async function validateImageFile(file: File): Promise<ValidatedImage> {
  if (file.size === 0) throw new ImageValidationError("The file is empty.");
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new ImageValidationError(`The file is ${formatBytes(file.size)}. The limit is ${formatBytes(MAX_UPLOAD_BYTES)}.`);
  }
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const kind = sniffImageKind(head);
  if (!kind) throw new ImageValidationError("Only JPG, JPEG and PNG images are accepted.");

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new ImageValidationError("The image could not be read. It may be corrupted.");
  }
  const { width, height } = bitmap;
  bitmap.close();
  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    throw new ImageValidationError(
      `The image is ${width}×${height}px. The maximum is ${MAX_IMAGE_DIMENSION}×${MAX_IMAGE_DIMENSION}px.`,
    );
  }
  return { file, name: file.name, kind, width, height, sizeBytes: file.size };
}
