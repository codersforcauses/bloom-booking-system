"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { RoomCard } from "@/components/room-card";
import { Button } from "@/components/ui/button";
import { useFetchBooking } from "@/hooks/booking";
import { apiGet, apiPatch } from "@/lib/api";
import type { BookingResponse } from "@/lib/api-types";
import type { Room } from "@/types/card";

import DeleteBookingDialog from "./delete-dialog";

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function isCancelledStatus(status?: string) {
  const s = String(status ?? "").toLowerCase();
  return s === "cancelled" || s === "canceled";
}

export default function Page() {
  const router = useRouter();
  const params = useParams<{ bookingId: string }>();
  const searchParams = useSearchParams();

  const bookingIdRaw = params?.bookingId;
  const bookingIdNum = useMemo(() => Number(bookingIdRaw), [bookingIdRaw]);

  const visitorEmail = useMemo(
    () => searchParams.get("email") ?? "",
    [searchParams],
  );

  const { data: booking, isLoading, isError } = useFetchBooking(bookingIdNum);

  const [error, setError] = useState<string | null>(null);

  // Cancel modal state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  async function fetchBooking() {
    const url = `/bookings/${bookingIdNum}/?visitor_email=${encodeURIComponent(
      visitorEmail,
    )}`;
    return apiGet<BookingResponse>(url);
  }

  // useEffect(() => {
  //   let aborted = false;

  //   async function run() {
  //     setLoading(true);
  //     setError(null);
  //     setBooking(null);

  //     if (!visitorEmail) {
  //       setError("Missing email parameter. Please go back and search again.");
  //       setLoading(false);
  //       return;
  //     }

  //     if (!bookingIdRaw || !Number.isFinite(bookingIdNum)) {
  //       setError("Invalid booking ID.");
  //       setLoading(false);
  //       return;
  //     }

  //     try {
  //       const data = await fetchBooking();
  //       if (!aborted) setBooking(data);
  //     } catch (e) {
  //       console.error(e);
  //       if (!aborted) {
  //         setError(
  //           "Could not load booking details. Please check your email and try again.",
  //         );
  //       }
  //     } finally {
  //       if (!aborted) setLoading(false);
  //     }
  //   }

  //   void run();
  //   return () => {
  //     aborted = true;
  //   };
  // }, [bookingIdRaw, bookingIdNum, visitorEmail]);

  const cancelled = useMemo(
    () => isCancelledStatus(booking?.status),
    [booking?.status],
  );

  // Map booking.room -> RoomCard Room type (best effort)
  const roomForCard: Room | null = useMemo(() => {
    if (!booking?.room) return null;
    const r: any = booking.room;

    return {
      title: r.name ?? r.title ?? "Room",
      image: r.image ?? r.image_url ?? null,
      location: r.location ?? "-",
      seats: r.seats ?? r.capacity ?? "-",
      amenities: Array.isArray(r.amenities) ? r.amenities : [],
      // NOTE: your Room type uses "availablility" spelling
      availablility:
        r.availablility ??
        r.availability ??
        r.available_hours ??
        "8:00am - 5:00pm, Mon - Fri",
      bookings: r.bookings ?? 0,
      removed: r.removed ?? false,
    } as Room;
  }, [booking]);

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <p className="mt-4 text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <p className="mt-4 text-red-600">{error}</p>
        <div className="mt-6">
          <Button variant="outline" onClick={() => window.history.back()}>
            Go back
          </Button>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <p className="mt-4 text-muted-foreground">No booking data.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mt-8 grid gap-8 lg:grid-cols-[380px_1fr] lg:items-start">
        {/* Left */}
        <div className="rounded-lg border bg-white shadow-sm">
          {roomForCard ? (
            <RoomCard room={roomForCard} />
          ) : (
            <div className="p-6 text-sm text-muted-foreground">
              Room information is not available.
            </div>
          )}
        </div>

        {/* Right */}
        <div className="rounded-lg border bg-white p-10 shadow-sm">
          <div className="grid grid-cols-1 gap-y-3 sm:grid-cols-2 sm:gap-x-16">
            <div className="space-y-3 text-muted-foreground">
              <div>Booking ID</div>
              <div>Name</div>
              <div>Email</div>
              <div>Start</div>
              <div>End</div>
              <div>Recurrence</div>
              <div>Status</div>
            </div>

            <div className="space-y-3">
              <div>{booking.id}</div>
              <div>{booking.visitor_name}</div>
              <div>{booking.visitor_email}</div>
              <div>{formatDateTime(booking.start_datetime)}</div>
              <div>{formatDateTime(booking.end_datetime)}</div>
              <div>{booking.recurrence_rule || "-"}</div>
              <div className={cancelled ? "font-medium text-bloom-red" : ""}>
                {cancelled ? "Cancelled" : booking.status}
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            {!cancelled ? (
              <>
                <Button variant="confirm" disabled>
                  Reschedule
                </Button>
                <Button
                  variant="warning"
                  onClick={() => {
                    // setCancelError(null);
                    setCancelDialogOpen(true);
                  }}
                >
                  Cancel booking
                </Button>
              </>
            ) : (
              <Button variant="confirm" onClick={() => router.push("/")}>
                Book again
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      <DeleteBookingDialog
        bookingId={booking.id}
        visitorEmail={booking.visitor_email}
        isOpen={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
      ></DeleteBookingDialog>
    </div>
  );
}
