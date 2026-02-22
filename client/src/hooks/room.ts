import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { AxiosError } from "axios";

import { PaginationSearchParams } from "@/components/pagination-bar";
import api from "@/lib/api";
import {
  AmenityResponse,
  LocationResponse,
  PaginatedAmenityResponse,
  PaginatedLocationResponse,
  PaginatedRoomResponse,
  RoomResponse,
  RoomShortResponse,
} from "@/lib/api-types";
import { resolveErrorMessage } from "@/lib/utils";

export interface RoomAvailability {
  recurrence_rule: string;
  start_datetime: Date;
  end_datetime: Date;
}

/**
 * Calls the `api/room/{room_id}` api endpoint to get the room availability
 * information (start time, end time, recurrence_rule).
 * @returns The room's availability rules (NOT its available timeslots).
 */
function useFetchRoomAvailability(room_id: number) {
  return useQuery<RoomAvailability, AxiosError>({
    queryKey: ["room-availability", room_id],
    enabled: room_id > 0,
    queryFn: async () => {
      const response = await api.get(`/rooms/${room_id}/`);
      const data = response.data;
      return {
        recurrence_rule: data.recurrence_rule,
        start_datetime: new Date(data.start_datetime),
        end_datetime: new Date(data.end_datetime),
      };
    },
  });
}

// switch to use useInfiniteQuery to handle infinite scrolling
function useFetchRooms(params: PaginationSearchParams) {
  const { nrows = 10, search, ...customParams } = params;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useInfiniteQuery<PaginatedRoomResponse>({
    queryKey: ["rooms", nrows, search, customParams],
    queryFn: async ({ pageParam = 1 }) => {
      const offset = ((pageParam as number) - 1) * nrows;
      const response = await api.get("/rooms/", {
        params: {
          limit: nrows,
          offset,
          ...(search ? { search } : {}),
          ...(customParams ? { ...customParams } : {}),
        },
      });
      return response.data;
    },

    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const totalFetched = allPages.length * nrows;
      return totalFetched < lastPage.count ? allPages.length + 1 : undefined;
    },
  });

  const allRooms = data?.pages.flatMap((page) => page.results) ?? [];
  const totalCount = data?.pages[0]?.count ?? 0;

  return {
    data: allRooms,
    count: totalCount,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  };
}

function useSearchRooms(search?: string, limit = 20) {
  return useQuery<RoomShortResponse[]>({
    queryKey: ["rooms", search, limit],
    queryFn: async () => {
      const response = await api.get("/rooms/", {
        params: {
          limit,
          ...(search ? { search } : {}),
        },
      });
      return response.data.results;
    },
  });
}

/**
 * A slot of time from a start time to an end time
 */
export interface TimeSlot {
  start: Date;
  end: Date;
}

/**
 * Information about a date and its available time slots
 */
export interface DateTimeSlots {
  date: string;
  slots: TimeSlot[];
}

// Fetch available timeslots for a room in a date range
function useFetchRoomTimeSlots(roomId: number, startDate: Date, endDate: Date) {
  return useQuery<DateTimeSlots[], AxiosError>({
    queryKey: [
      "room-timeslots",
      roomId,
      startDate.toISOString(),
      endDate.toISOString(),
    ],
    enabled: roomId > 0,
    queryFn: async () => {
      const start_date = startDate.toISOString().slice(0, 10);
      const end_date = endDate.toISOString().slice(0, 10);
      const apiUrl = `/rooms/${roomId}/availability/?start_date=${start_date}&end_date=${end_date}`;
      const response = await api.get(apiUrl);
      return response.data.availability.map(
        (o: { date: string; slots: { start: string; end: string }[] }) => ({
          date: o.date,
          slots: o.slots.map((slot: { start: string; end: string }) => ({
            start: new Date(Date.parse(slot.start)),
            end: new Date(Date.parse(slot.end)),
          })),
        }),
      );
    },
  });
}

// Refetch room list after updating status (to do: optimise by using context)
function useUpdateRoomStatus(
  id: number,
  setErrorMessage: (message: string) => void,
  onSuccess: () => void,
) {
  const queryClient = useQueryClient();
  return useMutation<RoomResponse, AxiosError, { is_active: boolean }>({
    mutationFn: async (payload) => {
      const response = await api.patch(`/rooms/${id}/`, payload);
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rooms"] });
      onSuccess();
    },
    onError: (error) => {
      console.error("Cancel booking failed:", error);
      setErrorMessage(
        resolveErrorMessage(error, "Cancellation failed. Please try again."),
      );
    },
  });
}

function useFetchRoomLocations(params: PaginationSearchParams) {
  const { page = 1, nrows = 5, search, ...customParams } = params;
  const offset = (page - 1) * nrows;

  const { data, isLoading, isError, error, refetch } =
    useQuery<PaginatedLocationResponse>({
      queryKey: ["room-locations", offset, nrows, search, customParams],
      queryFn: async () => {
        const response = await api.get("/locations/", {
          params: {
            limit: nrows,
            offset,
            ...(search ? { search } : {}), // Include search param only if defined
            ...(customParams ? { ...customParams } : {}), // Spread any additional custom params
          },
        });
        return response.data;
      },
    });

  const totalPages = data ? Math.ceil(data.count / nrows) : 1;
  return {
    data: data?.results ?? [],
    count: data?.count ?? 0,
    totalPages,
    isLoading,
    isError,
    error,
    refetch,
  };
}

function useFetchRoomLocation(id?: number) {
  return useQuery<LocationResponse, AxiosError>({
    queryKey: ["room-location", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const response = await api.get(`/locations/${id}/`);
      return response.data;
    },
  });
}

function useSearchRoomLocations(search?: string, limit = 20) {
  return useQuery<LocationResponse[]>({
    queryKey: ["locations", search, limit],
    queryFn: async () => {
      const response = await api.get("/locations/", {
        params: {
          limit,
          ...(search ? { search } : {}),
        },
      });
      return response.data.results;
    },
  });
}

function useCreateRoomLocation() {
  return useMutation<LocationResponse, AxiosError, { name: string }>({
    mutationFn: async (payload: { name: string }) => {
      const response = await api.post("/locations/", payload);
      return response.data;
    },
  });
}

function useUpdateRoomLocation(id: number) {
  return useMutation<LocationResponse, AxiosError, { name: string }>({
    mutationFn: async (payload: { name: string }) => {
      const response = await api.patch(`/locations/${id}/`, payload);
      return response.data;
    },
  });
}

function useDeleteRoomLocation() {
  return useMutation<void, AxiosError, number>({
    mutationFn: async (id: number) => {
      await api.delete(`/locations/${id}/`);
    },
  });
}

function useFetchRoomAmenities(params: PaginationSearchParams) {
  const { page = 1, nrows = 5, search, ...customParams } = params;
  const offset = (page - 1) * nrows;

  const { data, isLoading, isError, error, refetch } =
    useQuery<PaginatedAmenityResponse>({
      queryKey: ["room-amenities", offset, nrows, search, customParams],
      queryFn: async () => {
        const response = await api.get("/amenities/", {
          params: {
            limit: nrows,
            offset,
            ...(search ? { search } : {}),
            ...(customParams ? { ...customParams } : {}),
          },
        });
        return response.data;
      },
    });

  const totalPages = data ? Math.ceil(data.count / nrows) : 1;
  return {
    data: data?.results ?? [],
    count: data?.count ?? 0,
    totalPages,
    isLoading,
    isError,
    error,
    refetch,
  };
}

function useFetchRoomAmenity(id?: number) {
  return useQuery<AmenityResponse, AxiosError>({
    queryKey: ["room-amenity", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const response = await api.get(`/amenities/${id}/`);
      return response.data;
    },
  });
}

function useCreateRoomAmenity() {
  return useMutation<AmenityResponse, AxiosError, { name: string }>({
    mutationFn: async (payload: { name: string }) => {
      const response = await api.post("/amenities/", payload);
      return response.data;
    },
  });
}

function useUpdateRoomAmenity(id: number) {
  return useMutation<AmenityResponse, AxiosError, { name: string }>({
    mutationFn: async (payload: { name: string }) => {
      const response = await api.patch(`/amenities/${id}/`, payload);
      return response.data;
    },
  });
}

function useDeleteRoomAmenity() {
  return useMutation<void, AxiosError, number>({
    mutationFn: async (id: number) => {
      await api.delete(`/amenities/${id}/`);
    },
  });
}

type ApiError = { message?: string; detail?: string };

function useFetchRoom(id: number) {
  return useQuery<RoomResponse, AxiosError<ApiError>>({
    queryKey: ["room", id], // for caching
    enabled: Boolean(id),
    queryFn: async () => {
      const response = await api.get(`/rooms/${id}/`);
      return response.data;
    },
  });
}

const RoomAPI = {
  useFetchRooms,
  useSearchRooms,
  useFetchRoomLocations,
  useFetchRoomLocation,
  useCreateRoomLocation,
  useUpdateRoomLocation,
  useDeleteRoomLocation,
  useFetchRoomAmenities,
  useFetchRoomAmenity,
  useCreateRoomAmenity,
  useUpdateRoomAmenity,
  useDeleteRoomAmenity,
  useFetchRoom,
  useFetchRoomTimeSlots,
  useFetchRoomAvailability,
};

export {
  useFetchRooms,
  useSearchRoomLocations,
  useSearchRooms,
  useUpdateRoomStatus,
};
export default RoomAPI;
