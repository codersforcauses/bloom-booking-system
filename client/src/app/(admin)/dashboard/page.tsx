"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

import { FilterPopover } from "@/app/find-my-booking/filter";
import { CustomFetchBookingParams } from "@/app/find-my-booking/page";
import BookingTable from "@/app/find-my-booking/table";
import { AlertDialog, AlertDialogVariant } from "@/components/alert-dialog";
import { DownloadCsvButton } from "@/components/download-csv-button";
import InputField from "@/components/input";
import {
  PaginationBar,
  pickKeys,
  toQueryString,
} from "@/components/pagination-bar";
import { Button } from "@/components/ui/button";
import { useFetchBookings } from "@/hooks/booking";
import { RoomShortResponse } from "@/lib/api-types";
import { resolveErrorMessage } from "@/lib/utils";

import { BookingsStats } from "./statistic";

export default function BookingPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BookingPage />
    </Suspense>
  );
}

function BookingPage() {
  const router = useRouter();
  const pathname = usePathname();
  const oldSearchParams = useSearchParams();

  const search = oldSearchParams.get("search") ?? "";
  const page = Number(oldSearchParams.get("page") ?? 1);
  const nrows = Number(oldSearchParams.get("nrows") ?? 5);

  const urlVisibleParams: CustomFetchBookingParams = { search };

  const [searchParams, setSearchParams] = useState<CustomFetchBookingParams>(
    () => ({
      page,
      nrows,
      room_ids: "",
      visitor_email: "",
      visitor_name: "",
      _selectedRooms: [],
      ...urlVisibleParams,
    }),
  );

  const pushParams = useCallback(
    (params: Partial<CustomFetchBookingParams>) => {
      const updatedParams = { ...searchParams, ...params };
      setSearchParams(updatedParams);

      const urlParams = pickKeys(
        updatedParams,
        ...(Object.keys(urlVisibleParams) as (keyof typeof urlVisibleParams)[]),
      );

      router.push(`${pathname}?${toQueryString(urlParams)}`);
    },
    [searchParams, router, pathname, urlVisibleParams],
  );

  const { data, isLoading, totalPages } = useFetchBookings(searchParams);

  useEffect(() => {
    if (isLoading) return;

    if (searchParams.page && totalPages > 0 && totalPages < searchParams.page) {
      pushParams({ page: totalPages });
    }
  }, [isLoading, totalPages, searchParams.page, pushParams]);

  /**
   * Single page-wide AlertDialog
   *
   * - Only one AlertDialog is mounted for the whole page
   * - State is managed here (open, variant, title, description)
   * - `showAlert` is passed to child components (buttons, table actions, exports)
   * - Use it to show success, error, or confirm messages without creating multiple dialogs
   *
   * Example:
   * showAlert("success", "Success", "CSV exported successfully")
   */
  const [alert, setAlert] = useState<{
    open: boolean;
    variant: AlertDialogVariant;
    title?: string;
    description?: string;
  }>({ open: false, variant: "success" });

  const showAlert = (
    variant: AlertDialogVariant,
    title: string,
    desc: string,
  ) => setAlert({ open: true, variant, title, description: desc });

  const onClose = () => setAlert((prev) => ({ ...prev, open: false }));

  return (
    <div className="w-full rounded-xl p-6">
      <BookingsStats />

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">List of Bookings</h2>
        <div className="flex gap-2">
          <InputField
            kind="search"
            name="search"
            label=""
            value={searchParams.search || ""}
            placeholder="Search Name"
            onSearch={(val) => pushParams({ search: val })}
            className="w-full space-y-0"
          />

          <DownloadCsvButton
            path="/bookings/"
            fileName="bookings-export.csv"
            onSuccess={() =>
              showAlert("success", "Success", "CSV exported successfully!")
            }
            onError={(err) =>
              showAlert("error", "Error", resolveErrorMessage(err))
            }
          />

          <FilterPopover
            initialFilters={searchParams}
            selectedRooms={searchParams._selectedRooms || []}
            onApply={(
              filters: CustomFetchBookingParams,
              rooms: RoomShortResponse[],
            ) => {
              pushParams({
                ...filters,
                _selectedRooms: rooms,
              });
            }}
            EnableEmail
          />
          <Button asChild variant="confirm">
            <Link href="/book-room">Book Room</Link>
          </Button>
        </div>
      </div>

      <BookingTable data={data} isLoading={isLoading} showAlert={showAlert} />

      <PaginationBar
        page={searchParams.page ?? page}
        totalPages={totalPages}
        onPageChange={(newPage) =>
          pushParams({ page: Math.min(newPage, totalPages) })
        }
        row={searchParams.nrows}
        onRowChange={(newNrows) =>
          pushParams({ nrows: Number(newNrows), page: 1 })
        }
      />
      <AlertDialog
        open={alert.open}
        variant={alert.variant}
        title={alert.title}
        description={alert.description}
        onConfirm={onClose}
        onClose={onClose}
      />
    </div>
  );
}
