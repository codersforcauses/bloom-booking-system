"use client";

import React, { useRef } from "react";
import ReCAPTCHA from "react-google-recaptcha";

interface ReCAPTCHAV2Props {
  setVerified: (verified: boolean) => void;
}

// v2 - I'm not a robot checkbox
// NEXT_PUBLIC_RECAPTCHA_SITE_KEY in .env (not syncronized in git) obtained from https://www.google.com/recaptcha/admin/create
// Usage: By initialising [verified, setVerified] in the parent component and passing setVerified into ReCAPTCHAV2,
//        the parent component can obtain and utilise the verification status of ReCAPTCHAV2
const ReCAPTCHAV2: React.FC<ReCAPTCHAV2Props> = ({ setVerified }) => {
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const handleCaptchaSubmission = async (token: string | null) => {
    try {
      if (token) {
        const res = await fetch("/api/verify-recaptcha", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        // if status code is not 200, show the error in an alert form
        if (!res.ok) {
          const data = await res.json();
          throw new Error(`${data.message}! Status: ${res.status}`);
        }

        setVerified(res.ok);
      }
    } catch (e) {
      console.error(e);
      alert("Unable to verify Captcha. Please try again.");
      setVerified(false);
    }
  };

  const handleChange = async (token: string | null) => {
    // console.log("Captcha token:", token);
    if (!token) {
      return setVerified(false);
    }
    await handleCaptchaSubmission(token);
  };

  return (
    <ReCAPTCHA
      sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""}
      ref={recaptchaRef}
      onChange={handleChange}
    />
  );
};

export default ReCAPTCHAV2;
