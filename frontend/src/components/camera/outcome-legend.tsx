"use client";

import { CircleCheck, CircleHelp, CircleX } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function OutcomeLegend() {
  const { t } = useI18n();

  const outcomes = [
    {
      key: "MATCH",
      label: t.scanner.match,
      description: t.scanner.matchDesc,
      icon: CircleCheck,
      className: "border-success/30 bg-success/10 text-success",
    },
    {
      key: "REVIEW",
      label: t.scanner.needsReview,
      description: t.scanner.needsReviewDesc,
      icon: CircleHelp,
      className: "border-warning/40 bg-warning/15 text-warning-foreground dark:text-warning",
    },
    {
      key: "NO_MATCH",
      label: t.scanner.noMatch,
      description: t.scanner.noMatchDesc,
      icon: CircleX,
      className: "border-destructive/30 bg-destructive/10 text-destructive",
    },
  ];

  return (
    <div className="@container">
      <ul className="grid gap-2.5 @2xl:grid-cols-3" aria-label="Scan result types">
        {outcomes.map(({ key, label, description, icon: Icon, className }) => (
          <li key={key} className={`flex items-start gap-2.5 rounded-xl border p-3 ${className}`}>
            <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
            <div className="space-y-0.5">
              <p className="text-xs font-semibold">{label}</p>
              <p className="text-[11px] leading-tight text-foreground/70">{description}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
