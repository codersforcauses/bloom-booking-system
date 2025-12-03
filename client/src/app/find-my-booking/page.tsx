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
    <div className="mx-auto max-w-lg space-y-6 rounded-lg border bg-[hsl(var(--card))] p-6 text-[hsl(var(--card-foreground))] shadow-sm">
      <h2 className="title mb-4">Enter your email</h2>
      <form action={callApi}>
        <InputField
          kind="text"
          label=""
          name="email"
          value={email}
          onChange={setEmail}
          placeholder="Email"
        />
        {/* captcha (need to wait for this?) */}
        {/* <ReCAPTCHA_v2 setVerified={setVerified}></ReCAPTCHA_v2> */}
        <Button variant={"default"}>Search</Button>
      </form>
    </div>
  );
}
