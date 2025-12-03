"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import InputField from "@/components/ui/input";
import ReCAPTCHA_v2 from "@/components/ui/recaptchaV2";
import api from "@/lib/api";

export default function FindMyBookingPage() {
  const [verified, setVerified] = useState(false);
  const [email, setEmail] = useState("");

  async function searchBookings(formData: FormData) {
    const email = formData.get("email");
    // TODO: sanitise input?
    const apiUrl = `/api/bookings/search?visitor_email=${email}`;
    await api({ url: apiUrl, method: "get" })
      .then((response) => {
        // TODO: handle success
        console.log(response);
      })
      .catch((error) => {
        // TODO: handle error
        console.error("Error searching bookings:", error);
      });
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 bg-[hsl(var(--card))] p-6 text-[hsl(var(--card-foreground))]">
      <form
        className="flex flex-col flex-wrap items-center justify-center gap-8"
        action={searchBookings}
      >
        <h2 className="title mb-2">Enter your email</h2>
        <InputField
          className="w-full"
          kind="text"
          label=""
          name="email"
          value={email}
          onChange={setEmail}
          placeholder="Enter your email"
        />
        {/* TODO: captcha (need to wait for this?) */}
        {/* <ReCAPTCHA_v2 setVerified={setVerified}></ReCAPTCHA_v2> */}
        <Button variant={"default"}>Search</Button>
      </form>
    </div>
  );
}
