import {
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { useEffect, useId, useState } from "react";

import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  row?: number;
  onRowChange?: (row: string) => void;
  className?: string;
  pageWindow?: number;
};

export function PaginationBar({
  page,
  totalPages,
  onPageChange,
  row,
  onRowChange,
  pageWindow = 3,
  className,
}: PaginationProps) {
  const id = useId();

  const [pageInput, setPageInput] = useState(page.toString());

  useEffect(() => {
    setPageInput(page.toString());
  }, [page]);
  const baseVisible = pageWindow * 2 + 1;

  const isNearStart = page <= pageWindow + 1;
  const isNearEnd = page >= totalPages - pageWindow;

  const start = isNearStart
    ? 1
    : isNearEnd
      ? Math.max(1, totalPages - (baseVisible + 1) + 1)
      : page - pageWindow;

  const end = isNearStart
    ? Math.min(totalPages, baseVisible + 1)
    : isNearEnd
      ? totalPages
      : page + pageWindow;

  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  const showStartEllipsis = start > 1;
  const showEndEllipsis = end < totalPages;

  const commitPageChange = () => {
    const next = Math.min(totalPages, Math.max(1, Number(pageInput)));

    if (!Number.isNaN(next)) {
      onPageChange(next);
    }
  };

  return (
    <div
      className={cn("flex w-full flex-wrap justify-between gap-6", className)}
    >
      <div className="flex gap-2">
        {/* Rows per page */}
        <div className="flex shrink-0 items-center gap-3">
          <Label htmlFor={id}>Rows per page</Label>

          {row !== undefined && onRowChange && (
            <SelectRow
              id={id}
              className="h-7 w-20 justify-normal gap-3"
              selectedRow={row}
              onChange={onRowChange}
            />
          )}
        </div>

        {/* Page input */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          Page
          <input
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value.replace(/\D/g, ""))}
            onBlur={commitPageChange}
            onKeyDown={(e) => e.key === "Enter" && commitPageChange()}
            className="w-12 rounded border px-2 py-0.5 text-center text-foreground"
          />
          of <span className="text-foreground">{totalPages}</span>
        </div>
      </div>

      {/* Pagination */}
      <Pagination className="mx-0 w-fit justify-end">
        <PaginationContent>
          {/* First */}
          <PaginationItem>
            <PaginationLink
              size="icon"
              className="rounded-full"
              onClick={() => onPageChange(1)}
            >
              <ChevronFirstIcon className="size-4" />
            </PaginationLink>
          </PaginationItem>

          {/* Previous */}
          <PaginationItem>
            <PaginationLink
              size="icon"
              className="rounded-full"
              onClick={() => onPageChange(Math.max(1, page - 1))}
            >
              <ChevronLeftIcon className="size-4" />
            </PaginationLink>
          </PaginationItem>

          {/* Pages */}
          {showStartEllipsis && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}

          {pages.map((p) => (
            <PaginationItem key={p}>
              <PaginationLink
                isActive={p === page}
                className="rounded-full"
                onClick={() => onPageChange(p)}
              >
                {p}
              </PaginationLink>
            </PaginationItem>
          ))}

          {showEndEllipsis && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}

          {/* Next */}
          <PaginationItem>
            <PaginationLink
              size="icon"
              className="rounded-full"
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            >
              <ChevronRightIcon className="size-4" />
            </PaginationLink>
          </PaginationItem>

          {/* Last */}
          <PaginationItem>
            <PaginationLink
              size="icon"
              className="rounded-full"
              onClick={() => onPageChange(totalPages)}
            >
              <ChevronLastIcon className="size-4" />
            </PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

type RowProps = {
  id: string;
  selectedRow: string | number;
  options?: number[];
  onChange: (value: string) => void;
  className?: string;
};

export function SelectRow({
  id,
  selectedRow,
  options = [5, 7, 10, 15, 20, 50, 100],
  onChange,
  className,
}: RowProps) {
  const onValueChange = (value: string) => {
    onChange(value);
  };

  return (
    <Select
      defaultValue="10"
      value={selectedRow ? selectedRow.toString() : ""}
      onValueChange={onValueChange}
    >
      <SelectTrigger id={id} className={cn(className)}>
        <SelectValue placeholder="Select number of results" />
      </SelectTrigger>
      <SelectContent>
        {[...new Set([...options, Number(selectedRow)])]
          .sort((a, b) => a - b)
          .map((row) => (
            <SelectItem key={row} value={row.toString()}>
              {row}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}

export type PaginationSearchParams = {
  customParams?: Record<string, string>;
  search?: string;
  nrows?: number;
  page?: number;
};

export function toQueryString(params: PaginationSearchParams) {
  // Remove empty values and convert all to string
  const cleanParams = Object.fromEntries(
    Object.entries(params)
      .filter(([_, v]) => v !== undefined && v !== null && v !== "")
      .map(([k, v]) => [k, String(v)]), // convert numbers to strings
  );
  return new URLSearchParams(cleanParams).toString();
}

/**
 * Creates a new object by picking the specified keys from the given object.
 *
 * This function allows you to select specific properties from an object and returns a new object
 * containing only those properties. It uses the provided keys to extract the properties from the
 * original object and ensures the result is correctly typed.
 *
 * @example
 * const updatedParams = { search: 'test', ordering: 'asc', nrows: 10, page: 1 };
 * const queryParams = pickKeys(updatedParams, 'search', 'ordering');
 * // queryParams will be { search: 'test', ordering: 'asc' }
 *
 * @link Ref: https://stackoverflow.com/questions/67232195/filter-an-object-based-on-an-interface
 */
export function pickKeys<T, K extends keyof T>(
  obj: T,
  ...keys: K[]
): Pick<T, K> {
  return keys.reduce(
    (acc, key) => {
      acc[key] = obj[key];
      return acc;
    },
    {} as Pick<T, K>,
  );
}
