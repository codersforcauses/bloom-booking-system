import { TZDate } from "@date-fns/tz";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import axios from "axios";

const PERTH_TZ = "Australia/Perth";

interface DateRange {
  start: string;
  end: string;
}

interface CalendarEvent {
  summary?: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}

const fetchEvents = async ({ queryKey, signal }: any) => {
  const [_, roomId, { start, end }] = queryKey;

  if (!roomId) return [];

  const { data } = await axios.get(`/api/calendar/`, {
    params: { roomId, timeMin: start, timeMax: end },
    signal,
  });

  return data
    .filter(
      (event: CalendarEvent) => event.start?.dateTime || event.start?.date,
    )
    .filter((event: CalendarEvent) => event.end?.dateTime || event.end?.date)
    .map((event: CalendarEvent) => ({
      title: event.summary || "Untitled",
      description: event.description || "",
      start: new TZDate(
        event.start?.dateTime || event.start?.date || "",
        PERTH_TZ,
      ),
      end: new TZDate(event.end?.dateTime || event.end?.date || "", PERTH_TZ),
      data: event,
      resourceId: roomId,
    }));
};

export function useRoomEvents(
  roomId: string | undefined,
  dateRange: DateRange,
) {
  const queryInfo = useQuery({
    queryKey: ["room-events", roomId, dateRange],
    queryFn: fetchEvents,
    placeholderData: keepPreviousData,
    enabled: !!roomId,
    // Cache data for 5 minutes
    staleTime: 5 * 60 * 1000,
  });

  if (queryInfo.error)
    console.log("Error fetching room events: ", queryInfo.error);

  return {
    events: queryInfo.data || [],
    isLoading: queryInfo.isLoading,
    isFetching: queryInfo.isFetching,
    error: queryInfo.error,
  };
}
