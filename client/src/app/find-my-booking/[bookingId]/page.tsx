"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { RoomCard } from "@/components/room-card";
import { Button } from "@/components/ui/button";
import { apiGet, apiPatch } from "@/lib/api";
import type { BookingResponse } from "@/lib/api-types";
import type { Room } from "@/types/card";

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

const CANCEL_REASONS = [
  "Change of plans",
  "Booked by mistake",
  "Time conflict",
  "No longer needed",
  "Other",
] as const;

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

  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cancel modal state
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] =
    useState<(typeof CANCEL_REASONS)[number]>("Change of plans");
  const [cancelMessage, setCancelMessage] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  async function fetchBooking() {
    const url = `/bookings/${bookingIdNum}/?visitor_email=${encodeURIComponent(
      visitorEmail,
    )}`;
    return apiGet<BookingResponse>(url);
  }

  useEffect(() => {
    let aborted = false;

    async function run() {
      setLoading(true);
      setError(null);
      setBooking(null);

      if (!visitorEmail) {
        setError("Missing email parameter. Please go back and search again.");
        setLoading(false);
        return;
      }

      if (!bookingIdRaw || !Number.isFinite(bookingIdNum)) {
        setError("Invalid booking ID.");
        setLoading(false);
        return;
      }

      try {
        const data = await fetchBooking();
        if (!aborted) setBooking(data);
      } catch (e) {
        console.error(e);
        if (!aborted) {
          setError(
            "Could not load booking details. Please check your email and try again.",
          );
        }
      } finally {
        if (!aborted) setLoading(false);
      }
    }

    void run();
    return () => {
      aborted = true;
    };
  }, [bookingIdRaw, bookingIdNum, visitorEmail]);

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

  async function handleCancelBooking() {
    if (!booking) return;

    setCancelling(true);
    setCancelError(null);

    try {
      // Backend cancellation is via PATCH /bookings/:id/ with visitor_email + cancel_reason.
      // Backend doesn't store cancel_message yet; we append it to cancel_reason for now.
      const reasonText =
        cancelReason === "Other" && cancelMessage.trim()
          ? cancelMessage.trim()
          : cancelReason;

      const payload = {
        visitor_email: visitorEmail,
        cancel_reason: cancelMessage.trim()
          ? `${reasonText} - ${cancelMessage.trim()}`
          : reasonText,
      };

      // PATCH response shape might differ from BookingResponse; we re-fetch after patch.
      await apiPatch<unknown, typeof payload>(
        `/bookings/${booking.id}/`,
        payload,
      );

      const refreshed = await fetchBooking();
      setBooking(refreshed);

      setCancelOpen(false);
      setCancelMessage("");
    } catch (e) {
      console.error(e);
      setCancelError("Failed to cancel booking. Please try again.");
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <p className="text-sm text-muted-foreground">Find my booking</p>
        <h1 className="mt-2 text-2xl font-semibold">
          We have found your booking
        </h1>
        <p className="mt-4 text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <p className="text-sm text-muted-foreground">Find my booking</p>
        <h1 className="mt-2 text-2xl font-semibold">
          We have found your booking
        </h1>
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
        <p className="text-sm text-muted-foreground">Find my booking</p>
        <h1 className="mt-2 text-2xl font-semibold">
          We have found your booking
        </h1>
        <p className="mt-4 text-muted-foreground">No booking data.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <p className="text-sm text-muted-foreground">Find my booking</p>
      <h1 className="mt-2 text-2xl font-semibold">
        We have found your booking
      </h1>

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
              <div>Room</div>
              <div>Name</div>
              <div>Email</div>
              <div>Start</div>
              <div>End</div>
              <div>Recurrence</div>
              <div>Status</div>
            </div>

            <div className="space-y-3">
              <div>{booking.id}</div>
              <div>{booking.room?.name ?? "-"}</div>
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
                    setCancelError(null);
                    setCancelOpen(true);
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
      {cancelOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-lg bg-white p-10 shadow-xl">
            <h2 className="text-center text-lg font-semibold">
              Reason to cancel booking
            </h2>

            <div className="mt-8 space-y-6">
              <div>
                <div className="mb-2 text-sm text-muted-foreground">Reason</div>
                <select
                  className="w-full rounded-md border px-3 py-2"
                  value={cancelReason}
                  onChange={(e) =>
                    setCancelReason(
                      e.target.value as (typeof CANCEL_REASONS)[number],
                    )
                  }
                  disabled={cancelling}
                >
                  {CANCEL_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="mb-2 text-sm text-muted-foreground">
                  Message
                </div>
                <textarea
                  className="min-h-[120px] w-full rounded-md border px-3 py-2"
                  placeholder="Message"
                  value={cancelMessage}
                  onChange={(e) => setCancelMessage(e.target.value)}
                  disabled={cancelling}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Note: message isn’t stored in backend yet; it will be appended
                  to the reason.
                </p>
              </div>

              {cancelError ? (
                <p className="text-sm text-red-600">{cancelError}</p>
              ) : null}

              <div className="mt-8 flex justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setCancelOpen(false)}
                  disabled={cancelling}
                >
                  Cancel
                </Button>
                <Button
                  variant="confirm"
                  onClick={() => void handleCancelBooking()}
                  disabled={cancelling}
                >
                  {cancelling ? "Cancelling..." : "Ok"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
