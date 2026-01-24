import { useMutation, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { PaginationSearchParams } from "@/components/pagination-bar";
import api from "@/lib/api";
import { RoomAmenity, RoomLocation } from "@/types/room";

// Rooms Locations API hooks
type FetchRoomLocationsResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: RoomLocation[];
};

type PaginationResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

function useFetchRooms<T>(params: PaginationSearchParams) {
  const { page = 1, nrows = 10, search } = params;

  const offset = (page - 1) * nrows;

  const { data, isLoading, isError, error, refetch } = useQuery<
    PaginationResponse<T>
  >({
    queryKey: ["rooms", page, nrows, search, offset],
    queryFn: async () => {
      const response = await api.get("/rooms/", {
        params: {
          limit: nrows,
          offset,
          ...(search ? { search } : {}),
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

function useFetchRoomLocations(params: PaginationSearchParams) {
  const { page = 1, nrows = 5, search, ...customParams } = params;
  const offset = (page - 1) * nrows;

  const { data, isLoading, isError, error, refetch } =
    useQuery<FetchRoomLocationsResponse>({
      queryKey: ["room-locations", offset, nrows, search, customParams],
      queryFn: async () => {
        const response = await api.get("/locations/", {
          params: {
            limit: nrows,
            offset,
            ...(search ? { search } : {}), // Include only if exists,
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

function useFetchRoomLocation(id?: number) {
  return useQuery<RoomLocation, AxiosError>({
    queryKey: ["room-location", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const response = await api.get(`/locations/${id}/`);
      return response.data;
    },
  });
}

function useCreateRoomLocation() {
  return useMutation<RoomLocation, AxiosError, { name: string }>({
    mutationFn: async (payload) => {
      const response = await api.post("/locations/", payload);
      return response.data;
    },
  });
}

function useUpdateRoomLocation(id: number) {
  return useMutation<RoomLocation, AxiosError, { name: string }>({
    mutationFn: async (payload) => {
      const response = await api.patch(`/locations/${id}/`, payload);
      return response.data;
    },
  });
}

function useDeleteRoomLocation() {
  return useMutation<void, AxiosError, number>({
    mutationFn: async (id) => {
      await api.delete(`/locations/${id}/`);
    },
  });
}

// Amenities Locations API hooks
type FetchRoomAmenitiesResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: RoomAmenity[];
};

function useFetchRoomAmenities(params: PaginationSearchParams) {
  const { page = 1, nrows = 5, search, ...customParams } = params;
  const offset = (page - 1) * nrows;

  const { data, isLoading, isError, error, refetch } =
    useQuery<FetchRoomAmenitiesResponse>({
      queryKey: ["room-amenities", offset, nrows, search, customParams],
      queryFn: async () => {
        const response = await api.get("/amenities/", {
          params: {
            limit: nrows,
            offset,
            ...(search ? { search } : {}), // Include only if exists,
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
  return useQuery<RoomAmenity, AxiosError>({
    queryKey: ["room-amenity", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const response = await api.get(`/amenities/${id}/`);
      return response.data;
    },
  });
}

function useCreateRoomAmenity() {
  return useMutation<RoomAmenity, AxiosError, { name: string }>({
    mutationFn: async (payload) => {
      const response = await api.post("/amenities/", payload);
      return response.data;
    },
  });
}

function useUpdateRoomAmenity(id: number) {
  return useMutation<RoomAmenity, AxiosError, { name: string }>({
    mutationFn: async (payload) => {
      const response = await api.patch(`/amenities/${id}/`, payload);
      return response.data;
    },
  });
}

function useDeleteRoomAmenity() {
  return useMutation<void, AxiosError, number>({
    mutationFn: async (id) => {
      await api.delete(`/amenities/${id}/`);
    },
  });
}

const RoomAPI = {
  useFetchRooms,
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
};

export { useFetchRooms };
export default RoomAPI;
