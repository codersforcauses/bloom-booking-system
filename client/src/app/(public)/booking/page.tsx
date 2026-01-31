"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { AlertDialog, AlertDialogVariant } from "@/components/alert-dialog";
import { DownloadCsvButton } from "@/components/download-csv-button";
import InputField from "@/components/input";
import {
  PaginationBar,
  PaginationSearchParams,
  pickKeys,
  toQueryString,
} from "@/components/pagination-bar";
import { useFetchBookings } from "@/hooks/booking";
import { RoomShortResponse } from "@/lib/api-types";
import { resolveErrorMessage } from "@/lib/utils";

import { FilterPopover } from "./filter";
import FindMyBookingForm from "./find-my-booking-form";
import { BookingsStats } from "./statistic";
import BookingTable from "./table";

export default function BookingPageWrapper() {
  // TODO: get role dynamically
  let role = "admin";
  let isAdmin = role === "admin";

  const [verifiedEmail, setVerifiedEmail] = useState<string>("");

  if (isAdmin)
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <BookingPage isAdmin />
      </Suspense>
    );

  if (!verifiedEmail) {
    return (
      <FindMyBookingForm onVerified={(email) => setVerifiedEmail(email)} />
    );
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BookingPage email={verifiedEmail} />
    </Suspense>
  );
}

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
  room_ids?: string;
  visitor_email?: string;
  visitor_name?: string;
  _selectedRooms?: RoomShortResponse[];
};

function BookingPage({
  email = "",
  isAdmin = false,
}: {
  email?: string;
  isAdmin?: boolean;
}) {
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
  const urlVisibleParams: CustomFetchBookingParams = { search };

  /**
   * Local state for all search params
   *
   * - Includes both URL-visible params AND internal-only filters
   * - This state is what we send to the backend
   */
  const [searchParams, setSearchParams] = useState<CustomFetchBookingParams>(
    () => ({
      page,
      nrows,
      room_ids: "",
      visitor_email: email,
      visitor_name: "",
      _selectedRooms: [],
      ...urlVisibleParams,
    }),
  );

  useEffect(() => {
    // Non-admins must only use the verified email
    if (!isAdmin && email !== searchParams.visitor_email) {
      // email changed (someone modified readonly field or URL)
      router.push("/booking"); // send back to email form
    }
  }, [email, searchParams.visitor_email, isAdmin, router]);

  const { data, isLoading, totalPages } = useFetchBookings(searchParams);

  useEffect(() => {
    if (isLoading) return;

    if (searchParams.page && totalPages > 0 && totalPages < searchParams.page) {
      pushParams({ page: totalPages });
    }
  }, [isLoading, totalPages, searchParams.page]);

  /**
   * pushParams
   *
   * This function updates:
   * 1. Local state (used for backend fetching)
   * 2. URL query string (only allowed keys)
   */
  const pushParams = (params: Partial<CustomFetchBookingParams>) => {
    let updatedParams = { ...searchParams, ...params };
    if (!isAdmin) {
      updatedParams = { ...updatedParams, visitor_email: email };
    }

    setSearchParams(updatedParams);

    const urlParams = pickKeys(
      updatedParams,
      ...(Object.keys(urlVisibleParams) as (keyof typeof urlVisibleParams)[]),
    );

    router.push(`${pathname}?${toQueryString(urlParams)}`);
  };

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
    <div className="w-full rounded-xl bg-gray-100 p-6">
      {isAdmin && <BookingsStats />}

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

          {isAdmin && (
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
          )}

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
            isEmailDisabled={!isAdmin}
            className="border-bloom-blue text-bloom-blue"
          />
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
