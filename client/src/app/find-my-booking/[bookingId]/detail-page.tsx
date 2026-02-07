"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { RRule } from "rrule";

import { RoomCard } from "@/components/room-card";
import { Button } from "@/components/ui/button";
import { useFetchBooking } from "@/hooks/booking";
import API from "@/hooks/room";
import { normaliseRoom } from "@/lib/normalise-room";
import { resolveErrorMessage } from "@/lib/utils";

import CancelBookingDialog from "./cancel-dialog";

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

type DetailPageProps = {
  bookingId: number;
  visitorEmail?: string; // visitorEmail is optional for admin
  isAdminPage?: boolean;
};

export default function DetailPage({
  bookingId,
  visitorEmail,
  isAdminPage = true,
}: DetailPageProps) {
  const router = useRouter();

  const {
    data: booking,
    isLoading: isFetchBookingLoading,
    isError: isFetchBookingError,
    error: bookingError,
  } = useFetchBooking(bookingId, isAdminPage, visitorEmail || undefined);
  const {
    data: room,
    isLoading: isFetchRoomLoading,
    isError: isFetchRoomError,
    error: roomError,
  } = API.useFetchRoom(booking?.room.id ?? 0);

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const normailisedRoom = useMemo(() => {
    if (!room) return null;
    return normaliseRoom(room);
  }, [room]);

  const cancelled = useMemo(
    () => String(booking?.status ?? "").toLowerCase() === "cancelled",
    [booking?.status],
  );

  const errorMessage = useMemo(() => {
    return (
      resolveErrorMessage(
        bookingError,
        "Something went wrong fetching booking detail. Please try again.",
      ) ||
      resolveErrorMessage(
        roomError,
        "Something went wrong fetching room detail. Please try again.",
      )
    );
  }, [bookingError, roomError]);

  if (isFetchBookingLoading || isFetchRoomLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <p className="mt-4 text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (isFetchBookingError || isFetchRoomError) {
    return (
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <p className="mt-4 text-bloom-red">{errorMessage}</p>
        <div className="mt-6">
          <Button variant="outline" onClick={() => window.history.back()}>
            Go back
          </Button>
        </div>
      </div>
    );
  }

  if (!booking || !room) {
    return (
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <p className="mt-4 text-bloom-red">
          Could not load booking or room details. Please try again.
        </p>
        <div className="mt-6">
          <Button variant="outline" onClick={() => window.history.back()}>
            Go back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mt-8 grid gap-8 lg:grid-cols-[380px_1fr] lg:items-start lg:gap-12">
        {/* Left */}
        <div className="max-lg:flex max-lg:items-center max-lg:justify-center">
          <div className="w-full max-w-[500px]">
            {normailisedRoom ? (
              <RoomCard room={normailisedRoom} />
            ) : (
              <div className="p-6 text-sm text-muted-foreground">
                Room information is not available.
              </div>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="max-lg:flex max-lg:items-center max-lg:justify-center">
          <div className="w-full max-w-[500px] rounded-lg border bg-white p-10 shadow-sm">
            <div className="grid gap-y-3">
              {[
                ["Booking ID", booking.id],
                ["Name", booking.visitor_name],
                ["Email", booking.visitor_email],
                ["Start", formatDateTime(booking.start_datetime)],
                ["End", formatDateTime(booking.end_datetime)],
                [
                  "Recurrence",
                  booking.recurrence_rule
                    ? RRule.fromString(booking.recurrence_rule).toText()
                    : "-",
                ],
                [
                  "Status",
                  <span
                    key="status"
                    className={cancelled ? "font-medium text-bloom-red" : ""}
                  >
                    {booking.status}
                  </span>,
                ],
              ].map(([label, value]) => (
                <div
                  key={label as string}
                  className="grid grid-cols-1 sm:grid-cols-2 sm:gap-x-16"
                >
                  <div className="text-muted-foreground">{label}</div>
                  <div>{value}</div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="mt-10 flex flex-wrap gap-4">
              {!cancelled ? (
                <>
                  <Button
                    variant="confirm"
                    onClick={() => {
                      // to do: fix the routing
                      const url = isAdminPage
                        ? `/bookings/edit/${booking.id}`
                        : `/book-room/edit/${booking.id}`;
                      router.push(url);
                    }}
                  >
                    Reschedule
                  </Button>
                  <Button
                    variant="warning"
                    onClick={() => setCancelDialogOpen(true)}
                  >
                    Cancel booking
                  </Button>
                </>
              ) : (
                <Button
                  variant="confirm"
                  onClick={() =>
                    router.push(`/booking-room/${booking.room.id}`)
                  }
                >
                  Book again
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Cancel Modal */}
      <CancelBookingDialog
        bookingId={booking.id}
        visitorEmail={visitorEmail || booking.visitor_email}
        isOpen={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
      ></CancelBookingDialog>
    </div>
  );
}
