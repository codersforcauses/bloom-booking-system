import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { PaginationSearchParams } from "@/components/pagination-bar";
import api from "@/lib/api";
import type { BookingResponse, UpdateBookingRequest } from "@/lib/api-types";
import { PaginatedBookingResponse } from "@/lib/api-types";

function useFetchBookings(params: PaginationSearchParams) {
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

type ApiError = { message?: string; detail?: string };

function useFetchBooking(
  bookingId: number,
  isAdminPage: boolean,
  visitorEmail?: string,
) {
  return useQuery<BookingResponse, AxiosError<ApiError>>({
    queryKey: ["bookings", bookingId, visitorEmail, isAdminPage],
    queryFn: async ({ signal }) => {
      const response = await api.get(`/bookings/${bookingId}/`, {
        params: !isAdminPage ? { visitor_email: visitorEmail } : undefined,
        signal,
      });
      return response.data;
    },
    enabled: !isAdminPage
      ? Boolean(visitorEmail) && Boolean(bookingId)
      : Boolean(bookingId),
  });
}

function useCancelBooking(
  bookingId: number,
  onSuccess: () => void,
  onError: (error: AxiosError) => void,
) {
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
      onSuccess();
    },
    onError: (error) => {
      console.error("Cancel booking failed:", error);
      onError(error);
    },
  });
}

function useUpdateBooking(id: number) {
  const queryClient = useQueryClient();
  return useMutation<BookingResponse, AxiosError, UpdateBookingRequest>({
    mutationFn: async (payload) => {
      const response = await api.patch(`/bookings/${id}/`, payload);
      return response.data;
    },
    onSuccess: (data) => {
      // Update the single booking cache
      queryClient.setQueryData(["bookings", id], data);
      // Invalidate bookings list queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

export {
  useCancelBooking,
  useFetchBooking,
  useFetchBookings,
  useUpdateBooking,
};
