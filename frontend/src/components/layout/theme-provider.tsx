"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

// next-themes renders an inline <script> that applies the saved theme before first paint. That
// only matters in the server HTML. When the root layout re-renders in the browser (e.g. switching
// /en ↔ /km), React 19 warns about client-rendered scripts unless they are a non-JS data block,
// so the client copy gets a data type. It never runs on the client either way.
const scriptProps = typeof window === "undefined" ? undefined : { type: "application/json" };

export function ThemeProvider(props: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider scriptProps={scriptProps} {...props} />;
}
