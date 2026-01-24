import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import api from "@/lib/api"; // use typed helper

// Ping endpoint returns plain text: "Pong!"
export function usePings(
  options?: Omit<UseQueryOptions<string, AxiosError>, "queryKey" | "queryFn">,
) {
  return useQuery<string, AxiosError>({
    queryKey: ["ping"],
    queryFn: async () => {
      const res = await api.get<string>("/healthcheck/ping/", {
        responseType: "text",
      });
      return res.data;
    },
    ...options,
  });
}
