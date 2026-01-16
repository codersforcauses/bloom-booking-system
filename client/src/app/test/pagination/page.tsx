"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { PaginationBar } from "@/components/pagination-bar";

import DemoTable from "./table";

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
      <DemoTable title="Pagination Display" data={paginatedData} />

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
