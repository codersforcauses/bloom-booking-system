"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // const [isValidating, setIsValidating] = useState(true);
  // const router = useRouter();

  // useEffect(() => {
  //   const checkAuth = async () => {
  //     const accessToken = localStorage.getItem("accessToken");
  //     // If no token found, redirect to login
  //     if (!accessToken) {
  //       setIsValidating(true); // keep validating state while redirecting to avoid race conditions
  //       router.push("/login");
  //       return;
  //     }
  //     try {
  //       // Call the internal API to verify the JWT token
  //       const res = await fetch("/api/check-auth", {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         body: JSON.stringify({ accessToken }),
  //       });
  //       // If returned status is 200, token is valid and page can be rendered
  //       if (res.ok) {
  //         setIsValidating(false);
  //       } else {
  //         // If response is not ok (non-2xx), redirect to login
  //         setIsValidating(true); // keep validating state while redirecting to avoid race conditions
  //         router.push("/login");
  //         return;
  //       }
  //     } catch (err) {
  //       console.error("Error while validating authentication token:", err);
  //       // If any error occurs, redirect to login
  //       setIsValidating(true); // keep validating state while redirecting to avoid race conditions
  //       router.push("/login");
  //       return;
  //     }
  //   };
  //   checkAuth();
  // }, [router]);

  // // While validating, render nothing (or add a skeleton screen later)
  // if (isValidating) {
  //   return <></>;
  // }

  return <>{children}</>;
}
