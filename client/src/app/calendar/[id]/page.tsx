"use client";
import "react-big-calendar/lib/css/react-big-calendar.css";

import { TZDate } from "@date-fns/tz";
import axios from "axios";
import { format, getDay,parse, startOfWeek } from "date-fns";
import { enAU } from "date-fns/locale";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Calendar, dateFnsLocalizer, View,Views } from "react-big-calendar";

import { RoomCard } from "@/components/room-card";
import { Room } from "@/types/card";

const PERTH_TZ = "Australia/Perth";
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
  const [events, setEvents] = useState([]);
  const [isMounted, setIsMounted] = useState(false);
  const [date, setDate] = useState<Date>(new TZDate(new Date(), PERTH_TZ));
  const [view, setView] = useState<View>(Views.WEEK);
  const [selectedSlot, setSelectedSlot] = useState<Record<
    string,
    unknown
  > | null>(null);
  const { id } = useParams();

  const displayEvents = selectedSlot ? [...events, selectedSlot] : events;

  const fetchCalendarEvents = async () => {
    const { data } = await axios.get(`/api/calendar/?roomId=${id}`);
    console.log(data);
    const formattedEvents = data.map((event: any) => {
      const startTime = event.start?.dateTime;
      const endTime = event.end?.dateTime;
      return {
        title: event.summary,
        // ensure the local time zone
        start: new TZDate(startTime, PERTH_TZ),
        end: new TZDate(endTime, PERTH_TZ),
        data: event,
      };
    });
    setEvents(formattedEvents);
  };

  useEffect(() => {
    setIsMounted(true);
    fetchCalendarEvents();
  }, [id]);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="h-[700px] rounded-lg bg-white p-4 shadow">
      <Calendar
        localizer={localizer}
        events={displayEvents}
        date={date}
        view={view}
        onNavigate={(newDate: Date) => setDate(new TZDate(newDate, PERTH_TZ))}
        onView={(newView: View) => setView(newView)}
        defaultView={Views.WEEK}
        step={30} // 30 minute intervals
        timeslots={1} // 1 slot per line
        min={new Date(0, 0, 0, 8, 0, 0)} // Start 8 AM
        max={new Date(0, 0, 0, 18, 0, 0)} // End 6 PM
        selectable
        onSelectEvent={(event) => {
          setSelectedSlot(null);
          alert(`Booking: ${event}`);
        }}
        onSelectSlot={(slotInfo) => {
          setSelectedSlot({
            start: slotInfo.start,
            end: slotInfo.end,
            isDraft: true,
          });
        }}
      />
    </div>
  );
}
