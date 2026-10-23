"use client";

import type { ReactNode } from "react";

/**
 * Kept for architectural compatibility, but returns null so technical
 * endpoint listings and internal phase notes do not clutter the production UI.
 */
export function PlannedFeature({
  children,
}: {
  phase?: string;
  endpoints?: string[];
  children?: ReactNode;
}) {
  return null;
}
