"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useMemo } from "react";

import DetailPage from "./detail-page";

export default function Page() {
  const params = useParams<{ bookingId: string }>();
  const searchParams = useSearchParams();

  const bookingId = useMemo(
    () => Number(params?.bookingId),
    [params?.bookingId],
  );
  const visitorEmail = useMemo(
    () => searchParams.get("email") ?? "",
    [searchParams],
  );

  return (
    <DetailPage
      bookingId={bookingId}
      visitorEmail={visitorEmail}
      isAdminPage={false}
    />
  );
}
