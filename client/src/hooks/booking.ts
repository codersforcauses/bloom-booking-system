import { useQuery } from "@tanstack/react-query";

import { PaginationSearchParams } from "@/components/pagination-bar";
import api from "@/lib/api";
import { Booking } from "@/types/booking";

type FetchBookingsResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Booking[];
};

export function useFetchBookings(params: PaginationSearchParams) {
  const { page = 1, nrows = 5, search, ...customParams } = params;

  const offset = (page - 1) * nrows;

  const { data, isLoading, isError, error, refetch } =
    useQuery<FetchBookingsResponse>({
      queryKey: ["bookings", page, nrows, search, offset, customParams],
      queryFn: async () => {
        const response = await api.get("/bookings/", {
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
