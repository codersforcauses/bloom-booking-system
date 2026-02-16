"use client";

import React, { useEffect } from "react";
import ReCAPTCHA from "react-google-recaptcha";

import { setAccessToken } from "@/lib/api";

interface ReCAPTCHAV2Props {
  setVerified: (verified: boolean) => void;
  setReCAPTCHAToken?: (token: string | null) => void;
}

// v2 - I'm not a robot checkbox
// Usage: By initialising [verified, setVerified] in the parent component and passing setVerified into ReCAPTCHAV2,
//        the parent component can obtain and utilise the verification status of ReCAPTCHAV2
const ReCAPTCHAV2: React.FC<ReCAPTCHAV2Props> = ({
  setVerified,
  setReCAPTCHAToken,
}) => {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  useEffect(() => {
    if (!siteKey) {
      console.error("RECAPTCHA_SITE_KEY is missing in environment variables.");
    }
  }, [siteKey]);

  {
    /* Asks if Captcha has been completed, not verified */
  }
  const handleCaptchaSubmission = (token: string | null) => {
    if (setReCAPTCHAToken) {
      setReCAPTCHAToken(token);
    }

    if (!token) {
      setVerified(false);
      return;
    }

    setVerified(true);
  };

  return (
    <ReCAPTCHA sitekey={siteKey || ""} onChange={handleCaptchaSubmission} />
  );
};

export default ReCAPTCHAV2;
