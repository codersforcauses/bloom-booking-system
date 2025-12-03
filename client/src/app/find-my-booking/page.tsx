"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import InputField from "@/components/ui/input";
import ReCAPTCHA_v2 from "@/components/ui/recaptchaV2";

export default function FindMyBookingPage() {
  const [verified, setVerified] = useState(false);
  const [email, setEmail] = useState("");

  function callApi(formData: FormData) {
    const email = formData.get("email");
    alert(`Email: ${email}`);
    // TODO
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 bg-[hsl(var(--card))] p-6 text-[hsl(var(--card-foreground))]">
      <form
        className="flex flex-col flex-wrap items-center justify-center gap-8"
        action={callApi}
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
        {/* captcha (need to wait for this?) */}
        {/* <ReCAPTCHA_v2 setVerified={setVerified}></ReCAPTCHA_v2> */}
        <Button variant={"default"}>Search</Button>
      </form>
    </div>
  );
}
