"use client";

import { useSearchParams } from "next/navigation";
import { FaDownload } from "react-icons/fa";

import { Button } from "@/components/ui/button";
import { useExportBookingsCsv } from "@/hooks/download-csv";
import { cn } from "@/lib/utils";

type DownloadCsvButtonProps = {
  path: string;
  fileName: string;
  onSuccess?: () => void;
  onError?: (err: unknown) => void;
};

export function DownloadCsvButton({
  path,
  fileName,
  onSuccess,
  onError,
}: DownloadCsvButtonProps) {
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());
  // remove pagination params
  params.delete("page");
  params.delete("nrows");
  params.delete("limit");
  params.delete("offset");

  const { mutateAsync, isPending } = useExportBookingsCsv(
    path,
    params.toString(),
  );

  const handleDownload = async () => {
    try {
      const blob = await mutateAsync();

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();

      a.remove();
      window.URL.revokeObjectURL(url);
      onSuccess?.();
    } catch (err) {
      onError?.(err);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      variant="outline"
      title="Download"
      aria-label="Download"
      disabled={isPending}
      className={cn(
        "gap-2 border-2 bg-transparent bg-white p-2 hover:bg-muted",
        !isPending
          ? "border-bloom-blue text-bloom-blue"
          : "border-gray-300 text-gray-300",
      )}
    >
      <FaDownload size={16} />
      {isPending ? "Downloading..." : "Download"}
    </Button>
  );
}
