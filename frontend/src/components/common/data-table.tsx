"use client";

import {
  columnFilteringFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_text,
  tableFeatures,
  useTable,
  type ColumnDef,
  type RowData,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useI18n } from "@/lib/i18n";

// Client-side sorting, global search and pagination. Module scope keeps it stable across renders.
export const dataTableFeatures = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text },
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: { includesString: filterFn_includesString },
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
});

export type DataTableFeatures = typeof dataTableFeatures;
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- columns mix value types
export type DataTableColumn<TData extends RowData> = ColumnDef<DataTableFeatures, TData, any>;

type DataTableProps<TData extends RowData> = {
  columns: DataTableColumn<TData>[];
  data: TData[];
  isLoading?: boolean;
  searchPlaceholder?: string;
  emptyState?: ReactNode;
  pageSize?: number;
  /** Accessible table name. */
  caption: string;
  toolbar?: ReactNode;
};

export function DataTable<TData extends RowData>({
  columns,
  data,
  isLoading = false,
  searchPlaceholder,
  emptyState,
  pageSize = 10,
  caption,
  toolbar,
}: DataTableProps<TData>) {
  const { isKhmer, t } = useI18n();
  const table = useTable({
    features: dataTableFeatures,
    columns,
    data,
    globalFilterFn: "includesString",
    initialState: { pagination: { pageIndex: 0, pageSize } },
  });

  const filter = (table.state.globalFilter as string | undefined) ?? "";
  const rows = table.getRowModel().rows;
  const total = table.getFilteredRowModel().rows.length;
  const { pageIndex, pageSize: size } = table.state.pagination;
  const from = total === 0 ? 0 : pageIndex * size + 1;
  const to = Math.min(total, (pageIndex + 1) * size);

  const placeholder = searchPlaceholder ?? `${t.common.search}…`;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={filter}
            onChange={(e) => table.setGlobalFilter(e.target.value)}
            placeholder={placeholder}
            aria-label={`Search ${caption}`}
            className="pl-8 h-9 text-xs sm:text-sm"
            disabled={isLoading || data.length === 0}
          />
        </div>
        {toolbar && <div className="flex flex-wrap gap-2 sm:ml-auto">{toolbar}</div>}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border/80 bg-card shadow-xs">
        <Table>
          <caption className="sr-only">{caption}</caption>
          <TableHeader className="bg-muted/40">
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id} className="hover:bg-transparent">
                {group.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  const canSort = header.column.getCanSort();
                  return (
                    <TableHead
                      key={header.id}
                      aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined}
                      className="font-semibold text-xs tracking-wider uppercase text-muted-foreground"
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="-ml-2 h-8 px-2 font-semibold text-xs uppercase"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <table.FlexRender header={header} />
                          {sorted === "asc" ? (
                            <ArrowUp className="size-3.5" aria-hidden />
                          ) : sorted === "desc" ? (
                            <ArrowDown className="size-3.5" aria-hidden />
                          ) : (
                            <ArrowUpDown className="size-3.5 opacity-40" aria-hidden />
                          )}
                        </Button>
                      ) : (
                        <table.FlexRender header={header} />
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }, (_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full max-w-32" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length > 0 ? (
              rows.map((row) => (
                <TableRow key={row.id} className="transition-colors hover:bg-muted/30">
                  {row.getAllCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2.5 text-xs sm:text-sm">
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-xs sm:text-sm text-muted-foreground">
                  {filter
                    ? isKhmer
                      ? `រកមិនឃើញលទ្ធផលសម្រាប់ “${filter}” ទេ។`
                      : `No results for “${filter}”.`
                    : (emptyState ?? t.common.noData)}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-2 text-xs sm:text-sm text-muted-foreground px-1">
        <p aria-live="polite">
          {total === 0
            ? isKhmer
              ? "គ្មានទិន្នន័យ"
              : "0 results"
            : isKhmer
            ? `បង្ហាញ ${from}–${to} នៃសរុប ${total}`
            : `${from}–${to} of ${total}`}
        </p>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            className="size-7"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label="Previous page"
          >
            <ChevronLeft className="size-3.5" aria-hidden />
          </Button>
          <span className="px-2 text-xs font-medium tabular-nums">
            {table.getPageCount() === 0 ? 0 : pageIndex + 1} / {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="size-7"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label="Next page"
          >
            <ChevronRight className="size-3.5" aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  );
}
