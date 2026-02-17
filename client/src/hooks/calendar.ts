import { TZDate } from "@date-fns/tz";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import axios from "axios";

import api from "@/lib/api";

const PERTH_TZ = "Australia/Perth";

export type DateRange = {
  start: string;
  end: string;
};

export type GoogleCalendarEventResponse = {
  summary?: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
};

export type GoogleCalendarEvent = {
  title: string;
  description: string;
  start: TZDate | Date;
  end: TZDate | Date;
  data: GoogleCalendarEventResponse;
  resourceId: string | undefined;
  isDraft: boolean;
};

export type NewCalendarEvent = {
  title: string;
  start: TZDate | Date;
  end: TZDate | Date;
  isDraft: boolean;
};

export type CalendarEvent = GoogleCalendarEvent | NewCalendarEvent;

const fetchEvents = async ({ queryKey, signal }: any) => {
  try {
    const [_, roomId, { start, end }] = queryKey;

    if (!roomId) return [];

    const { data } = await api.get(`/calendar/`, {
      params: { roomId, timeMin: start, timeMax: end },

      signal,
    });

    if (!Array.isArray(data)) {
      console.warn("Unexpected response format from Calendar API", data);
      return [];
    }

    return data
      .filter(
        (event: GoogleCalendarEventResponse) =>
          event.start?.dateTime || event.start?.date,
      )
      .filter(
        (event: GoogleCalendarEventResponse) =>
          event.end?.dateTime || event.end?.date,
      )
      .map((event: GoogleCalendarEventResponse) => ({
        title: event.summary || "Untitled",
        description: event.description || "",
        start: new TZDate(
          event.start?.dateTime || event.start?.date || "",
          PERTH_TZ,
        ),
        end: new TZDate(event.end?.dateTime || event.end?.date || "", PERTH_TZ),
        data: event,
        resourceId: roomId,
        isDraft: false,
      }));
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log("Request cancelled:", error.message);
    } else if (axios.isAxiosError(error)) {
      console.error(
        "Axios error fetching calendar events:",
        error.response?.data?.error,
      );
    } else {
      console.error("Error fetching calendar events:", error);
    }
    return [];
  }
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

  return {
    events: queryInfo.data || [],
    isLoading: queryInfo.isLoading,
    isFetching: queryInfo.isFetching,
    error: queryInfo.error,
  };
}
