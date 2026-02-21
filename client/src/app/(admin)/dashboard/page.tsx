"use client";

import { Suspense } from "react";

import { BookingList } from "./booking-list";
import { BookingsStats } from "./statistic";

export default function BookingPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BookingsStats />
      <BookingList />
    </Suspense>
  );
}
