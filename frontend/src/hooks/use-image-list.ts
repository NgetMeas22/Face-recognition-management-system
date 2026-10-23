"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type LocalImage = {
  id: string;
  blob: Blob;
  url: string;
  width: number;
  height: number;
  source: "camera" | "upload";
  name: string;
};

/**
 * Images held only in this browser tab (object URLs). They are revoked and discarded when the
 * component unmounts or the route is hidden, so captured faces don't linger in memory.
 */
export function useImageList(max: number) {
  const [items, setItems] = useState<LocalImage[]>([]);
  const urls = useRef(new Set<string>());

  const add = useCallback(
    (image: Omit<LocalImage, "id" | "url">): LocalImage | null => {
      if (urls.current.size >= max) return null;
      const url = URL.createObjectURL(image.blob);
      urls.current.add(url);
      const item = { ...image, id: crypto.randomUUID(), url };
      setItems((prev) => [...prev, item].slice(-max));
      return item;
    },
    [max],
  );

  const remove = useCallback((id: string) => {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target) {
        URL.revokeObjectURL(target.url);
        urls.current.delete(target.url);
      }
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const clear = useCallback(() => {
    urls.current.forEach((url) => URL.revokeObjectURL(url));
    urls.current.clear();
    setItems([]);
  }, []);

  useEffect(() => clear, [clear]);

  return { items, add, remove, clear, isFull: items.length >= max };
}
