"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { checkAuth } from "@/lib/api";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isValidating, setIsValidating] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const nextPath =
    pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");
  const redirectTo = `/login?next=${encodeURIComponent(nextPath)}`;

  useEffect(() => {
    const validateAuth = async () => {
      const isValid = await checkAuth();
      if (isValid) {
        setIsValidating(false);
      } else {
        router.push(redirectTo);
      }
    };
    validateAuth();
  }, [router, redirectTo]);

  if (isValidating) {
    return <></>;
  }

  return <>{children}</>;
}
