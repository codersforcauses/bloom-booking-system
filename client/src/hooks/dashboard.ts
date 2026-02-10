import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";

import api from "@/lib/api";

export interface DashboardStats {
  total_meeting_rooms: number;
  total_bookings: number;
  weekly_bookings: number;
  total_users: number;
}

export function useFetchDashboardStats() {
  return useQuery<DashboardStats, AxiosError>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const response = await api.get("/dashboard/");
      return response.data;
    },
  });
}
