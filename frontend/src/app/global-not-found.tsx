// 404 for URLs that match no route at all (e.g. /en/does-not-exist). It renders without the
// [locale] root layout, so it brings its own <html>, styles and fonts.
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";

import "./globals.css";

const geistSans = Geist({ variable: "--font-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Page not found · FaceTrack AI",
  robots: { index: false, follow: false },
};

export default function GlobalNotFound() {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="grid min-h-svh place-items-center bg-background p-6 text-foreground">
        <main className="max-w-sm space-y-4 text-center">
          <p className="text-5xl font-semibold text-muted-foreground">404</p>
          <h1 className="text-xl font-semibold">Page not found</h1>
          <p className="text-sm text-muted-foreground">
            The page you asked for does not exist.{" "}
            <span lang="km">រកមិនឃើញទំព័រ។</span>
          </p>
          {/* The proxy adds the visitor's language to "/". */}
          <Link
            href="/"
            className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
          >
            Back to dashboard
          </Link>
        </main>
      </body>
    </html>
  );
}
