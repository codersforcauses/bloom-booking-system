"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { PaginationBar } from "@/components/pagination-bar";

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
  return (
    <div className="mb-4 overflow-hidden rounded-lg border border-gray-300 bg-white">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-gray-200">
          <tr>
            <th className="border-b px-4 py-2 text-left font-medium">ID</th>
            <th className="border-b px-4 py-2 text-left font-medium">Name</th>
            <th className="border-b px-4 py-2 text-left font-medium">Status</th>
          </tr>
        </thead>

        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-4 py-6 text-center text-gray-500">
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
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
