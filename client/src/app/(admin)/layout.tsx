"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isValidating, setIsValidating] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = localStorage.getItem("accessToken");
      console.log("Access Token:", accessToken);
      // If no token found, redirect to login
      if (!accessToken) {
        router.push("/login");
        return;
      }
      try {
        // Call the internal API to verify the JWT token
        const res = await fetch("/api/check-auth", {
          method: "POST",
          body: JSON.stringify({ accessToken }),
        });
        // If returned status is 200, token is valid and page can be rendered
        if (res.ok) {
          setIsValidating(false);
        } else {
          // If returned status is 401, token is invalid, redirect to login
          router.push("/login");
        }
      } catch (err) {
        // If any error occurs, redirect to login
        router.push("/login");
      }
    };
    checkAuth();
  }, [router]);

  // While validating, render nothing
  if (isValidating) {
    return <></>;
  }

  return <>{children}</>;
}
