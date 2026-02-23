"use client";

import React, { useEffect } from "react";
import ReCAPTCHA from "react-google-recaptcha";

import api from "@/lib/api";

interface ReCAPTCHAV2Props {
  setVerified: (verified: boolean) => void;
}

// v2 - I'm not a robot checkbox
// Usage: By initialising [verified, setVerified] in the parent component and passing setVerified into ReCAPTCHAV2,
//        the parent component can obtain and utilise the verification status of ReCAPTCHAV2
const ReCAPTCHAV2: React.FC<ReCAPTCHAV2Props> = ({ setVerified }) => {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  useEffect(() => {
    if (!siteKey) {
      console.error("RECAPTCHA_SITE_KEY is missing in environment variables.");
    }
  }, [siteKey]);

  const handleCaptchaSubmission = async (token: string | null) => {
    try {
      if (!token) {
        setVerified(false);
        return;
      }

      const res = await api.post("/verify-recaptcha/", { token });

      if (!res.data.success) {
        throw new Error(`${res.data.message}! Status: ${res.status}`);
      }

      setVerified(true);
    } catch (e) {
      console.error("Captcha verification failed:", e);
      alert("Unable to verify Captcha. Please try again.");
      setVerified(false);
    }
  };

  return (
    <ReCAPTCHA
      sitekey={siteKey || ""}
      onChange={handleCaptchaSubmission}
      className="z-9999"
    />
  );
};

export default ReCAPTCHAV2;
