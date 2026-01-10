"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { PaginationBar } from "@/components/pagination-bar";

export default function PaginationDemo() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page") ?? 1);
  const nrows = Number(searchParams.get("nrows") ?? 5);

  const totalPages = 20;

  const pushParams = (params: Record<string, number>) => {
    const qs = new URLSearchParams({
      page: String(params.page ?? page),
      nrows: String(params.nrows ?? nrows),
    });

    router.push(`${pathname}?${qs.toString()}`);
  };

  return (
    <div className="w-full rounded-xl bg-gray-100 p-6">
      <h2 className="mb-4 text-xl font-semibold">Pagination Display</h2>

      <PaginationBar
        page={page}
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
