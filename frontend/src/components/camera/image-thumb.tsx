/* eslint-disable @next/next/no-img-element -- blob: URLs of local captures can't use next/image */
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { LocalImage } from "@/hooks/use-image-list";
import { formatBytes } from "@/lib/image-validation";

export function ImageThumb({ image, onRemove, index }: { image: LocalImage; onRemove?: () => void; index: number }) {
  return (
    <figure className="group relative overflow-hidden rounded-lg border bg-muted">
      <img src={image.url} alt={`Image ${index + 1} (${image.source})`} className="aspect-square w-full object-cover" />
      <figcaption className="flex items-center justify-between gap-1 px-2 py-1 text-[11px] text-muted-foreground">
        <span className="truncate">
          {image.width}×{image.height}
        </span>
        <span>{formatBytes(image.blob.size)}</span>
      </figcaption>
      {onRemove && (
        <Button
          variant="secondary"
          size="icon-xs"
          className="absolute top-1.5 right-1.5 opacity-90"
          onClick={onRemove}
          aria-label={`Remove image ${index + 1}`}
        >
          <X aria-hidden />
        </Button>
      )}
    </figure>
  );
}
