import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { PaginationSearchParams } from "@/components/pagination-bar";
import api from "@/lib/api";
import {
  emptyPaginatedResponse,
  PaginatedBookingResponse,
} from "@/lib/api-types";

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
        return response.data ?? emptyPaginatedResponse();
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
