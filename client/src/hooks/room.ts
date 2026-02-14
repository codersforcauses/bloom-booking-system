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
    enabled: !!search,
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

// copied from issue 115
type ApiError = { message?: string; detail?: string };

function useFetchRoom(roomId: number) {
  return useQuery<RoomResponse, AxiosError<ApiError>>({
    queryKey: ["room", roomId],
    enabled: roomId > 0,
    queryFn: async () => {
      const response = await api.get(`/rooms/${roomId}/`);
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
};

export { useFetchRooms, useSearchRooms, useUpdateRoomStatus };
export default RoomAPI;
