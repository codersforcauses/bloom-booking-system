import { useMutation, useQuery , useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { PaginationSearchParams } from "@/components/pagination-bar";
import api from "@/lib/api";
import type { BookingResponse } from "@/lib/api-types";
import { PaginatedBookingResponse } from "@/lib/api-types";

export function useFetchBookings(params: PaginationSearchParams) {
  const { page = 1, nrows = 5, search, ...customParams } = params;

  const offset = (page - 1) * nrows;

  // Exclude keys that start with "_"
  const filteredParams = Object.fromEntries(
    Object.entries(customParams).filter(([key]) => !key.startsWith("_")),
  );

  const { data, isLoading, isError, error, refetch } =
    useQuery<PaginatedBookingResponse>({
      queryKey: ["bookings", page, nrows, search, offset, filteredParams],
      queryFn: async () => {
        const response = await api.get("/bookings/", {
          params: {
            limit: nrows,
            offset,
            ...(search ? { search } : {}),
            ...(filteredParams ? { ...filteredParams } : {}),
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

export function useFetchBooking(bookingId: number, visitorEmail?: string) {
  return useQuery<BookingResponse, AxiosError>({
    queryKey: ["bookings", bookingId, visitorEmail],
    queryFn: async ({ signal }) => {
      const response = await api.get(`/bookings/${bookingId}/`, {
        params: { email: visitorEmail },
        signal,
      });
      return response.data;
    },
    enabled: !!bookingId,
  });
}

export function useCancelBooking(bookingId: number) {
  const queryClient = useQueryClient();
  return useMutation<
    BookingResponse,
    AxiosError,
    { visitor_email: string; cancel_reason: string }
  >({
    mutationFn: async (payload) => {
      const response = await api.patch(`/bookings/${bookingId}/`, payload);
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["bookings", bookingId],
      });
    },
  });
}
