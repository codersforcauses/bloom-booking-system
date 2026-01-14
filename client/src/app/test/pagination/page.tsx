"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { PaginationBar } from "@/components/pagination-bar";
import { cn } from "@/lib/utils";

const mockData = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  name: `Item ${i + 1}`,
  status: i % 2 === 0 ? "Active" : "Inactive",
}));

export default function PaginationDemo() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page") ?? 1);
  const nrows = Number(searchParams.get("nrows") ?? 5);

  const totalRows = mockData.length;

  const totalPages = Math.max(1, Math.ceil(totalRows / nrows));

  const safePage = Math.min(Math.max(1, page), totalPages);

  const pushParams = (params: Record<string, number>) => {
    const qs = new URLSearchParams({
      page: String(params.page ?? safePage),
      nrows: String(params.nrows ?? nrows),
    });

    router.push(`${pathname}?${qs.toString()}`);
  };

  const paginatedData = useMemo(() => {
    const start = (safePage - 1) * nrows;
    const end = start + nrows;
    return mockData.slice(start, end);
  }, [safePage, nrows]);

  return (
    <div className="w-full rounded-xl bg-gray-100 p-6">
      <h2 className="mb-4 text-xl font-semibold">Pagination Display</h2>

      <Table data={paginatedData} />

      <PaginationBar
        page={safePage}
        totalPages={totalPages}
        onPageChange={(newPage) =>
          pushParams({ page: Math.min(newPage, totalPages) })
        }
        row={nrows}
        onRowChange={(newNrows) =>
          pushParams({ nrows: Number(newNrows), page: 1 })
        }
      />
    </div>
  );
}

type TableRow = {
  id: number;
  name: string;
  status: string;
};

type TableProps = {
  data: TableRow[];
};

function Table({ data }: TableProps) {
  const commonTableHeadClasses =
    "w-auto px-4 py-2 text-left font-medium text-nowrap";

  return (
    <div className="mb-4 rounded-lg border border-gray-300 bg-white">
      {/* Horizontal scroll wrapper */}
      <div className="relative max-h-[60vh] overflow-x-auto overflow-y-auto rounded-lg border">
        <table className="w-full min-w-[800px] border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-gray-200">
            <tr>
              <th className={commonTableHeadClasses}>
                ID with Super Long Header Name To Test Sticky Behavior
              </th>
              <th className={commonTableHeadClasses}>
                Name with Super Long Header Name To Test Sticky Behavior
              </th>
              <th className={commonTableHeadClasses}>
                Status with Super Long Header Name To Test Sticky Behavior
              </th>
              <th
                className={cn(
                  commonTableHeadClasses,
                  "sticky right-0 z-20 bg-gray-200",
                )}
              >
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                  No data available
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="border-b px-4 py-2">{row.id}</td>

                  <td className="border-b px-4 py-2">{row.name}</td>

                  <td className="border-b px-4 py-2">
                    <span
                      className={
                        row.status === "Active"
                          ? "text-green-600"
                          : "text-gray-500"
                      }
                    >
                      {row.status}
                    </span>
                  </td>

                  {/* Sticky column */}
                  <td className="sticky right-0 border-b bg-white px-4 py-2">
                    <button className="text-blue-600 hover:underline">
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
