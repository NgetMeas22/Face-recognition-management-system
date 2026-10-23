"use client";

import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n, type Locale } from "@/lib/i18n";

const LANGUAGES: { code: Locale; label: string; nativeName: string; flag: string }[] = [
  { code: "en", label: "English", nativeName: "English", flag: "🇬🇧" },
  { code: "km", label: "Khmer", nativeName: "ភាសាខ្មែរ", flag: "🇰🇭" },
];

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  const current = LANGUAGES.find((l) => l.code === locale) || LANGUAGES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 px-2 text-xs font-medium tracking-wide transition-colors"
          aria-label={`Current language: ${current.label}. Select language.`}
        >
          <span className="text-sm leading-none" role="img" aria-hidden>
            {current.flag}
          </span>
          <span className="font-semibold uppercase">{current.code}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 min-w-[10rem]">
        {LANGUAGES.map((lang) => {
          const isActive = lang.code === locale;
          return (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => setLocale(lang.code)}
              className="flex items-center justify-between cursor-pointer py-1.5 text-xs font-medium"
            >
              <div className="flex items-center gap-2">
                <span className="text-base leading-none" role="img" aria-hidden>
                  {lang.flag}
                </span>
                <span>{lang.nativeName}</span>
              </div>
              {isActive && <Check className="size-3.5 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
