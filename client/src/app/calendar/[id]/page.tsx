"use client";
import "react-big-calendar/lib/css/react-big-calendar.css";

import { TZDate } from "@date-fns/tz";
import {
  addDays,
  addWeeks,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  parse,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subWeeks,
} from "date-fns";
import { enAU } from "date-fns/locale";
import { useParams, useRouter } from "next/navigation";
import React, { useCallback,useEffect, useMemo, useState } from "react";
import {
  Calendar,
  dateFnsLocalizer,
  SlotInfo,
  View,
  Views,
} from "react-big-calendar";
import { useMediaQuery } from "react-responsive";

import { Calendar as MiniCalendar } from "@/components/calendar";
import { RoomCard } from "@/components/room-card";
import { Button } from "@/components/ui/button";
import RoomAPI from "@/hooks/room";
import { useRoomEvents } from "@/hooks/useRoomEvents";
import { getAvailableSlots,normalizeRoom } from "@/lib/room-utils";
import { cn } from "@/lib/utils";

const PERTH_TZ = "Australia/Perth";
const now = new TZDate(new Date(), PERTH_TZ);
const locales = {
  "en-AU": enAU,
};
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) =>
    startOfWeek(new TZDate(date, PERTH_TZ), { weekStartsOn: 1 }),
  getDay: (date: Date) => getDay(new TZDate(date, PERTH_TZ)),
  locales,
});

export default function ViewCalendarPage() {
  const { id } = useParams();
  const router = useRouter();
  const isMobile = useMediaQuery({ query: "(max-width: 767px)" }); // md breakpoint - 768px (to avoid the edge value)

  const [isMounted, setIsMounted] = useState(false);
  const [date, setDate] = useState<Date>(new TZDate(new Date(), PERTH_TZ));
  const [view, setView] = useState<View>(isMobile ? Views.DAY : Views.WEEK);
  const [selectedSlot, setSelectedSlot] = useState<Record<
    string,
    unknown
  > | null>(null);
  // to set a three-day window to pre-fetch data and prevent ui flickering
  const [dateRange, setDateRange] = useState(() => {
    if (isMobile) {
      const start = startOfDay(subDays(now, 6));
      const end = endOfDay(addDays(now, 6));
      return {
        start: format(start, "yyyy-MM-dd"),
        end: format(end, "yyyy-MM-dd"),
      };
    } else {
      const start = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
      const end = endOfWeek(addWeeks(now, 1), { weekStartsOn: 1 });
      return {
        start: format(start, "yyyy-MM-dd"),
        end: format(end, "yyyy-MM-dd"),
      };
    }
  });
  // display both real google events and user's selectedSlot
  const {
    data: room,
    isLoading,
    isError,
    error,
  } = RoomAPI.useFetchRoom(Number(id)); // fetch room data;
  const { events } = useRoomEvents(String(id), dateRange);

  const displayEvents = selectedSlot ? [...events, selectedSlot] : events;

  const availableSlots = useMemo(() => {
    // if room is not active, just skip the calculation
    if (!room || !room.is_active) return new Set<number>();
    return getAvailableSlots(room, dateRange.start, dateRange.end);
  }, [room, dateRange]);

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    // Disable when room is not active
    if (!room || !room.is_active) return;

    // Disable in Month View
    if (view === Views.MONTH) return;

    // Disable Past Selection
    const now = new TZDate(new Date(), PERTH_TZ);
    if (slotInfo.start < now) return;

    // Selection cannot cover any booked slot
    let checkPointer = slotInfo.start.getTime();
    const endTime = slotInfo.end.getTime();

    while (checkPointer < endTime) {
      if (!availableSlots || !availableSlots.has(checkPointer)) {
        console.log(
          "Blocking selection: detected disallowed slot at",
          new Date(checkPointer),
        );
        return;
      }
      checkPointer += 30 * 60000;
    }

    setSelectedSlot({
      title: "New booking",
      start: slotInfo.start,
      end: slotInfo.end,
      isDraft: true,
    });
  };

  const eventPropGetter = (event: Record<string, unknown>) => {
    const isDraft = event.isDraft;
    return {
      className: cn(
        "rounded-md !text-black !border-none",
        isDraft
          ? "!bg-[var(--bloom-blue-light)] opacity-60 !border-2 !border-dotted !border-[var(--bloom-blue)]"
          : "!bg-[var(--bloom-blue)]",
      ),
    };
  };

  const slotPropGetter = useCallback(
    (date: Date) => {
      if (view === Views.MONTH) return {};
      const time = date.getTime();

      if (time < now.getTime() || (room && !room.is_active)) {
        return {
          className: "!bg-[hsl(var(--muted))] !cursor-not-allowed",
        };
      }

      if (!availableSlots.has(time) && !isLoading) {
        return {
          className: "bg-[var(--bloom-red)] opacity-20 !cursor-not-allowed",
        };
      }

      return {};
    },
    [room, availableSlots, view],
  );

  // if there is selectedSlot, bring the data as params
  const onSubmit = () => {
    if (!room || !room.is_active) return;
    if (!selectedSlot || !selectedSlot.start || !selectedSlot.end) {
      router.push(`/admin/book-room/${id}/`);
      return;
    }

    // Format the date as YYYY-MM-DD
    const dateStr = format(selectedSlot.start as Date, "yyyy-MM-dd");

    // Format times as HH:mm (24-hour format is usually best for APIs)
    const startTime = format(selectedSlot.start as Date, "HH:mm");
    const endTime = format(selectedSlot.end as Date, "HH:mm");

    const queryParams = new URLSearchParams({
      date: dateStr,
      start_time: startTime,
      end_time: endTime,
    }).toString();

    router.push(`/admin/book-room/${id}?${queryParams}`);
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Ensure calculation in Perth timezone
    const perthDate = new TZDate(date, PERTH_TZ);
    let start: Date;
    let end: Date;
    if (view === Views.DAY) {
      // 12-day window: previous day, today, next day
      start = startOfDay(subDays(perthDate, 6));
      end = endOfDay(addDays(perthDate, 6));
    } else if (view === Views.WEEK) {
      // 3-week window: previous week, current week, next week
      start = startOfWeek(subWeeks(perthDate, 1), { weekStartsOn: 1 });
      end = endOfWeek(addWeeks(perthDate, 1), { weekStartsOn: 1 });
    } else {
      // whole month
      start = startOfMonth(perthDate);
      end = endOfMonth(perthDate);
    }
    setDateRange({
      start: format(start, "yyyy-MM-dd"),
      end: format(end, "yyyy-MM-dd"),
    });
  }, [date, view]);

  useEffect(() => {
    // only render day view when isMobile is true
    if (isMobile) {
      setView(Views.DAY);
    }
    // clear selected slots when view turns to agenda & month
    if (view === Views.AGENDA || view === Views.MONTH) {
      setSelectedSlot(null);
    }
  }, [view, isMobile]);

  if (!isMounted) return null;

  return (
    <div className="grid grid-cols-1 px-8 py-4 md:grid-cols-7 xl:grid-cols-5">
      {/* Left */}
      <div className="col-span-1 flex flex-col items-center justify-start md:col-span-2 xl:col-span-1">
        {!isLoading ? (
          <>
            {/* Room Card */}
            {!isError && (
              <div className="mx- w-full">
                <RoomCard room={normalizeRoom(room)} />
              </div>
            )}
            {/* Axios Error Message */}
            {isError && (
              <p className="text-[var(--bloom-red)]">
                {error.response?.data?.detail ||
                  error.response?.data?.message ||
                  error.message}
              </p>
            )}
            {/* Button */}
            <Button
              variant="confirm"
              className="my-3"
              onClick={onSubmit}
              disabled={isError || !room?.is_active}
            >
              Book a slot
            </Button>
            {/* MiniCalendar */}
            <div className="flex w-full items-center justify-center">
              <MiniCalendar
                fixedWeeks
                className="h-auto w-full rounded-md border border-[hsl(var(--border))]"
                classNames={{
                  day: "w-full h-auto flex items-center justify-center",
                  cell: "w-full",
                }}
                style={{ "--cell-size": "20px" } as React.CSSProperties}
                mode="single" // Only one day can be active
                selected={date} // Share state with big calendar
                onSelect={(newDate) => {
                  if (newDate) {
                    setDate(new TZDate(newDate, PERTH_TZ));
                  }
                }}
              />
            </div>
          </>
        ) : (
          <p>Loading...</p>
        )}
      </div>
      {/* Right */}
      <div
        className={cn(
          "col-span-1 rounded-lg p-4 md:col-span-5 xl:col-span-4",
          "[&_.rbc-toolbar]:max-xl:flex-col [&_.rbc-toolbar]:max-xl:gap-2",
          "[&_.rbc-toolbar_.rbc-btn-group:last-child]:max-md:hidden",
        )}
      >
        <Calendar
          className="w-full"
          localizer={localizer}
          events={displayEvents}
          date={date}
          view={view}
          onNavigate={(newDate: Date) => setDate(new TZDate(newDate, PERTH_TZ))}
          onView={(newView: View) => setView(newView)}
          step={30} // 30 minute intervals
          timeslots={1} // 1 slot per line
          min={new Date(0, 0, 0, 8, 0, 0)} // Start 8 AM
          max={new Date(0, 0, 0, 18, 0, 0)} // End 6 PM
          // Selection logic
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={(event) => {
            setSelectedSlot(null);
          }}
          // Custom Rendering
          slotPropGetter={slotPropGetter}
          eventPropGetter={eventPropGetter}
        />
      </div>
    </div>
  );
}
