import { CircleCheck, CircleHelp, CircleX } from "lucide-react";

// Matches the scan outcomes in docs/03-recognition-workflow.md §3.4. Colour is never the only cue:
// every outcome also has an icon and a label.
export const OUTCOMES = [
  {
    key: "MATCH",
    label: "Match",
    description: "Above the accept threshold with a clear margin. Shows the authorised profile.",
    icon: CircleCheck,
    className: "border-success/40 bg-success/10 text-success",
  },
  {
    key: "REVIEW",
    label: "Needs review",
    description: "Uncertain. A user with scan.review confirms or rejects the candidate.",
    icon: CircleHelp,
    className: "border-warning/50 bg-warning/15 text-warning-foreground dark:text-warning",
  },
  {
    key: "NO_MATCH",
    label: "No match found",
    description: "Below threshold. Reveals nothing about anyone; offer manual check-in.",
    icon: CircleX,
    className: "border-destructive/40 bg-destructive/10 text-destructive",
  },
] as const;

export function OutcomeLegend() {
  // Sized by its container (not the viewport), so it also fits narrow side panels.
  return (
    <div className="@container">
      <ul className="grid gap-2 @2xl:grid-cols-3" aria-label="Scan result types">
        {OUTCOMES.map(({ key, label, description, icon: Icon, className }) => (
          <li key={key} className={`flex gap-2 rounded-lg border p-3 ${className}`}>
            <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
            <div>
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-foreground/70">{description}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
