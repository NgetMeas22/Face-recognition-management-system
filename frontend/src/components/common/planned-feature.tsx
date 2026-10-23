"use client";

import type { ReactNode } from "react";

export type PlannedFeatureProps = {
  phase?: string;
  endpoints?: string[];
  children?: ReactNode;
};

export function PlannedFeature(props?: PlannedFeatureProps): null {
  void props;
  return null;
}
