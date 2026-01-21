import { useQuery } from "@tanstack/react-query";

import { PaginationSearchParams } from "@/components/pagination-bar";
import api from "@/lib/api";
import { Room } from "@/types/card";

// Rooms Locations API hooks
type FetchRoomResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Room[];
};

export function useFetchRooms(params: PaginationSearchParams) {
  const { page = 1, nrows = 10, search } = params;

  const offset = (page - 1) * nrows;

  const { data, isLoading, isError, error, refetch } =
    useQuery<FetchRoomResponse>({
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
