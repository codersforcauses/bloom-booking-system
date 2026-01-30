"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import InputField from "@/components/input";
import { PaginationSearchParams } from "@/components/pagination-bar";
import ReCAPTCHA_v2 from "@/components/recaptcha";
import { Button } from "@/components/ui/button";
import { useFetchBookings } from "@/hooks/booking";

// Define the search parameters interface
interface BookingSearchParams extends PaginationSearchParams {
  visitor_email?: string;
  visitor_name?: string;
  room_ids?: number[];
}

export default function FindMyBookingPage() {
  const router = useRouter();
  const [verified, setVerified] = useState(false);
  const [email, setEmail] = useState("");
  const [searchEmail, setSearchEmail] = useState<string | null>(null);

  // trigger search when searchEmail is set
  const {
    data: bookings,
    isLoading,
    isError,
    error,
  } = useFetchBookings({
    visitor_email: searchEmail || undefined,
    page: 1,
    nrows: 100, // get all bookings for the email
  } as BookingSearchParams);

  // redirect to results page if there are results
  useEffect(() => {
    if (!searchEmail) return;
    if (isLoading || isError) return;
    if ((bookings?.length ?? 0) > 0) {
      router.push(
        `/bookings/search?visitor_email=${encodeURIComponent(searchEmail)}`,
      );
    }
  }, [searchEmail, isLoading, isError, bookings, router]);

  useEffect(() => {
    if (!isError || !error) return;

    console.error("Error searching bookings:", error);
  }, [isError, error]);

  /**
   * Handles the form submission to search for bookings.
   */
  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidEmail(email)) {
      return;
    }
    if (!verified) {
      return;
    }
    setSearchEmail(email);
  }

  // simple email validation
  function isValidEmail(email: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return email.length > 0 && emailRegex.test(email);
  }

  return (
    <div className="min-h-layout-header bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))]">
      {/* Error/Status Messages  */}
      {searchEmail && (
        <div className="w-full bg-white px-6 py-3">
          {isError && (
            <p className="text-[--bloom-red]">
              We couldn't find booking for email: {searchEmail}
            </p>
          )}
          {!isLoading && !isError && (bookings?.length ?? 0) === 0 && (
            <p className="text-[--bloom-red]">
              We couldn't find booking for email: {searchEmail}
            </p>
          )}
        </div>
      )}

      <div className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center space-y-6 p-6">
        <form
          className="flex flex-col items-center justify-center gap-8"
          onSubmit={handleSearch}
        >
          <h2 className="title mb-2">Enter your email</h2>
          <InputField
            className="w-[90vw] md:w-[50vw]"
            kind="text"
            label=""
            name="email"
            value={email}
            onChange={setEmail}
            placeholder="Enter your email"
          />
          <ReCAPTCHA_v2 setVerified={setVerified}></ReCAPTCHA_v2>
          <Button disabled={!verified || !isValidEmail(email)}>Search</Button>
        </form>
      </div>
    </div>
  );
}
