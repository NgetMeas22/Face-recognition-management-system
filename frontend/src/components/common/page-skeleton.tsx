import { Skeleton } from "@/components/ui/skeleton";

/** Placeholder for a page while the session is being restored (also the prerendered shell). */
export function PageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite" data-testid="page-skeleton">
      <span className="sr-only">Loading…</span>
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}
