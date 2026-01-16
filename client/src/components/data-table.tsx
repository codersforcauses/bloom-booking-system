import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: keyof T;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
};

type DataTableProps<T extends { id: number }> = {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  className?: string;
  actions?: (row: T) => React.ReactNode;
};

export function DataTable<T extends { id: number }>({
  data,
  columns,
  isLoading = false,
  className,
  actions,
}: DataTableProps<T>) {
  const showActions = Boolean(actions);

  const headClass = "w-auto px-4 py-2 text-left font-medium text-nowrap";

  return (
    <div className="mb-4 border-t-[2px] border-gray-400 bg-inherit">
      {/* Horizontal scroll wrapper */}
      <div className="relative max-h-[60vh] overflow-x-auto overflow-y-auto bg-inherit">
        <Table
          className={cn("w-full min-w-[800px] bg-inherit text-sm", className)}
        >
          <TableHeader className="sticky top-0 z-10 bg-inherit">
            <TableRow className="bg-inherit">
              {columns.map((col) => (
                <TableHead
                  key={String(col.key)}
                  className={cn(headClass, col.className)}
                >
                  {col.header}
                </TableHead>
              ))}

              {showActions && (
                <TableHead
                  className={cn(headClass, "sticky right-0 z-10 bg-inherit")}
                >
                  Actions
                </TableHead>
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {/* Loading state */}
            {isLoading && (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (showActions ? 1 : 0)}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  Loading...
                </TableCell>
              </TableRow>
            )}

            {/* Empty state */}
            {!isLoading && data.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (showActions ? 1 : 0)}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  No data available
                </TableCell>
              </TableRow>
            )}

            {/* Data rows */}
            {!isLoading &&
              data.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-0 border-b-2 border-inherit bg-white hover:bg-gray-50"
                >
                  {columns.map((col) => (
                    <TableCell
                      key={String(col.key)}
                      className={cn("px-4 py-2", col.className)}
                    >
                      {col.render ? col.render(row) : String(row[col.key])}
                    </TableCell>
                  ))}

                  {showActions && (
                    <span className="sticky right-0">
                      <TableCell className="border-l-2 border-inherit bg-white">
                        {actions?.(row)}
                      </TableCell>
                    </span>
                  )}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
