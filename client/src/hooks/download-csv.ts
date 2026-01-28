import { useMutation } from "@tanstack/react-query";

import api from "@/lib/api";

export function useExportBookingsCsv(path: string) {
  return useMutation({
    mutationFn: async () => {
      const response = await api.get(path, {
        responseType: "blob",
        headers: {
          Accept: "text/csv",
        },
      });

      return response.data as Blob;
    },
  });
}
