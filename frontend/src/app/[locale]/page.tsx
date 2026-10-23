import { redirect } from "next/navigation";

import { isLocale, localizePath } from "@/lib/i18n/routing";

export default async function LocaleHome({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  redirect(localizePath(isLocale(locale) ? locale : "en", "/dashboard"));
}
