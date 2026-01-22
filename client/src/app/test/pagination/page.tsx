"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { DownloadCsvButton } from "@/components/download-csv-button";
import InputField from "@/components/input";
import {
  PaginationBar,
  PaginationSearchParams,
  pickKeys,
  toQueryString,
} from "@/components/pagination-bar";
import { useFetchBookings } from "@/hooks/booking";
import { useFetchRooms } from "@/hooks/room";
import { BookingRoom } from "@/types/booking";

import { FilterPopover } from "./filter";
import DemoTable from "./table";

export type CustomFetchBookingParams = PaginationSearchParams & {
  room?: string;
  visitor_email?: string;
  visitor_name?: string;
};

export default function PaginationDemo() {
  const router = useRouter();
  const pathname = usePathname();
  const oldSearchParams = useSearchParams();

  const search = oldSearchParams.get("search") ?? "";
  const page = Number(oldSearchParams.get("page") ?? 1);
  const nrows = Number(oldSearchParams.get("nrows") ?? 5);

  const defaultSearchParams: CustomFetchBookingParams = { search, page, nrows };

  const [searchParams, setSearchParams] = useState<CustomFetchBookingParams>({
    room: "",
    visitor_email: "",
    visitor_name: "",
    ...defaultSearchParams,
  });

  const { data, isLoading, totalPages } = useFetchBookings(searchParams);
  // fetch all rooms
  const { data: rooms = [] } = useFetchRooms<BookingRoom>({
    page: 1,
    nrows: 1000,
  });

  // Sync URL params to state
  useEffect(() => {
    if (!isLoading) {
      setSearchParams((prev) => ({
        ...prev,
        search: search || prev.search,
        nrows: nrows || prev.nrows,
        page: page || prev.page,
      }));
    }
  }, [search, nrows, page, isLoading]);

  const pushParams = (params: Partial<CustomFetchBookingParams>) => {
    const updatedParams = { ...searchParams, ...params };
    setSearchParams(updatedParams);

    const qs = pickKeys(
      updatedParams,
      ...(Object.keys(defaultSearchParams) as []),
    );

    router.push(`${pathname}?${toQueryString(qs)}`);
  };

  return (
    <div className="w-full rounded-xl bg-gray-100 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Pagination Display</h2>
        <div className="flex gap-2">
          <InputField
            kind="search"
            name="search"
            label=""
            value={searchParams.search || ""}
            placeholder="Search Name"
            onSearch={(val) =>
              setSearchParams((prev) => ({ ...prev, search: val }))
            }
            className="w-80 space-y-0"
          />

          <DownloadCsvButton path="/bookings/" fileName="bookings-export.csv" />

          <FilterPopover
            rooms={rooms}
            initialFilters={searchParams}
            onApply={(filters) => pushParams(filters)}
            className="border-bloom-blue text-bloom-blue"
          />
        </div>
      </div>

      <DemoTable data={data} isLoading={isLoading} />

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
