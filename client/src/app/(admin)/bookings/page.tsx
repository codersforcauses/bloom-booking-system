"use client";

import { Suspense } from "react";

import { BookingList } from "../dashboard/booking-list";

export default function BookingPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BookingList />
    </Suspense>
  );
}
