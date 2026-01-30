"use client";

import React, { useEffect, useRef } from "react";
import ReCAPTCHA from "react-google-recaptcha";

interface ReCAPTCHAV2Props {
  setVerified: (verified: boolean) => void;
}

const ReCAPTCHAV2: React.FC<ReCAPTCHAV2Props> = ({ setVerified }) => {
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const isDev = process.env.NODE_ENV === "development";

  // ✅ DEV: if sitekey missing, auto-verify so the app is usable locally
  useEffect(() => {
    if (!siteKey && isDev) {
      console.warn(
        "RECAPTCHA_SITE_KEY is missing. Auto-verifying in development mode.",
      );
      setVerified(true);
    }
  }, [siteKey, isDev, setVerified]);

  // ✅ If sitekey missing, don't render the widget (prevents crash)
  if (!siteKey) {
    return null;
  }

  const handleCaptchaSubmission = async (token: string | null) => {
    try {
      if (!token) {
        setVerified(false);
        return;
      }

      const res = await fetch("/api/verify-recaptcha", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(`${data.message}! Status: ${res.status}`);
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
      sitekey={siteKey}
      ref={recaptchaRef}
      onChange={handleCaptchaSubmission}
    />
  );
};

export default ReCAPTCHAV2;
