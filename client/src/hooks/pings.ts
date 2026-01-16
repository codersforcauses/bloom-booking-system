import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { apiGet } from "@/lib/api"; // use typed helper
import type { PingResponse } from "@/lib/apiTypes"; // response type

export const usePings = (
  args?: Omit<
    UseQueryOptions<PingResponse, AxiosError>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery<PingResponse, AxiosError>({
    ...args,
    queryKey: ["pings"],
    queryFn: () => apiGet<PingResponse>("/healthcheck/ping/"),
  });
};
