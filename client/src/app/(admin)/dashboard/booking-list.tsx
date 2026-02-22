"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

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
import { LocationResponse, RoomShortResponse } from "@/lib/api-types";
import { resolveErrorMessage } from "@/lib/utils";

export function BookingList() {
  const router = useRouter();
  const pathname = usePathname();
  const oldSearchParams = useSearchParams();

  const search = oldSearchParams.get("search") ?? "";
  const filteredRoomId = oldSearchParams.get("room_id") ?? "";
  const page = Number(oldSearchParams.get("page") ?? 1);
  const nrows = Number(oldSearchParams.get("nrows") ?? 10);

  const urlVisibleParams: CustomFetchBookingParams = { search };

  const [searchParams, setSearchParams] = useState<CustomFetchBookingParams>(
    () => ({
      page,
      nrows,
      room_ids: filteredRoomId || undefined,
      visitor_email: "",
      visitor_name: "",
      _selectedRooms: [],
      _selectedLocations: [],
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
      <div className="mb-4 flex flex-col items-center justify-between gap-4 md:flex-row">
        <h2 className="text-xl font-semibold">List of Bookings</h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          <InputField
            kind="search"
            name="search"
            label=""
            value={searchParams.search || ""}
            placeholder="Visitor name, location, or ID"
            onSearch={(val) => pushParams({ search: val })}
            className="w-full space-y-0"
          />

          <div className="flex gap-2">
            <DownloadCsvButton
              path="/bookings/download/"
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
              selectedLocations={searchParams._selectedLocations || []}
              onApply={(
                filters: CustomFetchBookingParams,
                rooms: RoomShortResponse[],
                locations: LocationResponse[],
              ) => {
                pushParams({
                  ...filters,
                  _selectedRooms: rooms,
                  _selectedLocations: locations,
                });
              }}
              EnableEmail
              scrollClassName="max-h-[50vh]"
            />
            <Button asChild variant="confirm">
              <Link href="/book-room">Book Room</Link>
            </Button>
          </div>
        </div>
      </div>

      <BookingTable
        data={data}
        isLoading={isLoading}
        showAlert={showAlert}
        isAdminPage={true}
      />

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
