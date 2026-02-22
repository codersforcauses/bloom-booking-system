"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { AlertDialog, AlertDialogVariant } from "@/components/alert-dialog";
import InputField from "@/components/input";
import {
  PaginationBar,
  PaginationSearchParams,
  pickKeys,
  toQueryString,
} from "@/components/pagination-bar";
import { Button } from "@/components/ui/button";
import { useFetchBookings } from "@/hooks/booking";
import { LocationResponse, RoomShortResponse } from "@/lib/api-types";

import { FilterPopover } from "./filter";
import FindMyBookingForm from "./find-my-booking-form";
import BookingTable from "./table";

export default function FindMyBookingPage() {
  const [verifiedEmail, setVerifiedEmail] = useState<string>("");

  // Handler to reset email
  const handleBack = () => setVerifiedEmail("");

  if (!verifiedEmail) {
    return (
      <FindMyBookingForm onVerified={(email) => setVerifiedEmail(email)} />
    );
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BookingPage email={verifiedEmail} handleBack={handleBack} />
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
  location_ids?: string;
  visitor_email?: string;
  visitor_name?: string;
  _selectedRooms?: RoomShortResponse[];
  _selectedLocations?: LocationResponse[];
};

function BookingPage({
  email = "",
  handleBack,
}: {
  email: string;
  handleBack: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const oldSearchParams = useSearchParams();

  const search = oldSearchParams.get("search") ?? "";
  const page = Number(oldSearchParams.get("page") ?? 1);
  const nrows = Number(oldSearchParams.get("nrows") ?? 10);

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
      location_ids: "",
      visitor_email: email,
      visitor_name: "",
      _selectedRooms: [],
      _selectedLocations: [],
      ...urlVisibleParams,
    }),
  );

  useEffect(() => {
    // email changed send back to email form
    if (email !== searchParams.visitor_email) {
      router.push("/find-my-booking");
    }
  }, [email, searchParams.visitor_email, router]);

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
    const updatedParams = { ...searchParams, ...params, visitor_email: email };
    setSearchParams(updatedParams);

    const urlParams = pickKeys(
      updatedParams,
      ...(Object.keys(urlVisibleParams) as (keyof typeof urlVisibleParams)[]),
    );

    router.push(`${pathname}?${toQueryString(urlParams)}`);
  };

  return (
    <div className="w-full rounded-xl p-6">
      <div className="mb-4 flex flex-col items-center justify-between md:flex-row">
        <h2 className="text-xl font-semibold">List of Bookings</h2>
        <div className="flex gap-2">
          <InputField
            kind="search"
            name="search"
            label=""
            value={searchParams.search || ""}
            placeholder="Visitor name, location, or ID"
            onSearch={(val) => pushParams({ search: val })}
            className="w-full space-y-0"
          />

          <Button
            onClick={handleBack}
            variant="outline"
            title="Back"
            aria-label="Back"
            disabled={isLoading}
          >
            Back
          </Button>
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
