"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useMemo } from "react";

import DetailPage from "@/app/find-my-booking/[bookingId]/detail-page";

export default function Page() {
  const params = useParams<{ bookingId: string }>();
  const bookingId = useMemo(
    () => Number(params?.bookingId),
    [params?.bookingId],
  );

  return <DetailPage bookingId={bookingId} />;
}
