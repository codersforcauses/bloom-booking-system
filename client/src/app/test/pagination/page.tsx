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

/**
 * CustomFetchBookingParams
 *
 * This type extends PaginationSearchParams using a GENERIC idea:
 * - PaginationSearchParams defines common pagination fields (page, nrows, search)
 * - We extend it with booking specific filters
 *
 * This allows reuse across FE and BE while keeping strong typing.
 */
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

  /**
   * urlVisibleParams
   *
   * This object defines which params are allowed to be shown in the URL.
   * It acts as a WHITELIST.
   *
   * Purpose:
   * - Keep URLs clean
   * - Prevent leaking filter data into query strings
   * - Still allow backend to receive full params
   */
  const urlVisibleParams: CustomFetchBookingParams = {
    search,
    page,
    nrows,
  };

  /**
   * Local state for all search params
   *
   * - Includes both URL-visible params AND internal-only filters
   * - This state is what we send to the backend
   */
  const [searchParams, setSearchParams] = useState<CustomFetchBookingParams>({
    room: "",
    visitor_email: "",
    visitor_name: "",
    ...urlVisibleParams,
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

  /**
   * pushParams
   *
   * This function updates:
   * 1. Local state (used for backend fetching)
   * 2. URL query string (only allowed keys)
   */
  const pushParams = (params: Partial<CustomFetchBookingParams>) => {
    const updatedParams = { ...searchParams, ...params };
    setSearchParams(updatedParams);

    const urlParams = pickKeys(
      updatedParams,
      ...(Object.keys(urlVisibleParams) as []),
    );

    router.push(`${pathname}?${toQueryString(urlParams)}`);
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
            onSearch={(val) => pushParams({ search: val })}
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
