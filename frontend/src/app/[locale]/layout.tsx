import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Khmer } from "next/font/google";
import { notFound } from "next/navigation";

import { AuthProvider } from "@/components/auth/auth-provider";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/lib/i18n/context";
import { isLocale, LOCALES } from "@/lib/i18n/routing";
import "../globals.css";

const geistSans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
// Khmer names and labels render with a proper Khmer face instead of a system fallback.
const notoKhmer = Noto_Sans_Khmer({ variable: "--font-khmer", subsets: ["khmer"] });

export const metadata: Metadata = {
  title: { default: "FaceTrack AI", template: "%s · FaceTrack AI" },
  description: "Face recognition & people management dashboard",
  robots: { index: false, follow: false },
};

// Every locale is known at build time, so /en/... and /km/... prerender as static shells.
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

// Root layout: the locale is the first URL segment (/en/..., /km/...). The proxy redirects any
// locale-less URL here, so `lang` on <html> is correct in the server-rendered HTML.
export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${notoKhmer.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <I18nProvider locale={locale}>
            <TooltipProvider delayDuration={200}>
              <AuthProvider>{children}</AuthProvider>
            </TooltipProvider>
            <Toaster richColors closeButton position="top-right" />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
