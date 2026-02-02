"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeClosed } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api, { setAccessToken } from "@/lib/api";
import { delay } from "@/lib/utils";

/**
 * - POST /users/login/ with username/password
 * - Store access + refresh tokens in localStorage via api.ts helpers cookie
 * - Redirect to home page on success
 * - Show error message on failure
 */

const loginSchema = z.object({
  username: z.string().min(1, "Username / Email is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Dynamic rendering is required to ensure fresh authentication state and prevent caching of sensitive routes.

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Suspense fallback={<div>Loading...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}

function LoginForm() {
  const [isLoading, setIsLoading] = useState(true);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [redirectTo] = useState(() => {
    const next = searchParams.get("next");
    // Must start with exactly one slash
    if (!next?.startsWith("/") || next.startsWith("//")) {
      return "/dashboard";
    }
    return next;
  });

  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = localStorage.getItem("accessToken");

      if (!accessToken) {
        setIsLoading(false);
        return;
      }

      try {
        // Call the internal API to verify the JWT token
        const res = await fetch("/api/check-auth", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ accessToken }),
        });
        if (res.ok) {
          router.push(redirectTo);
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Error while validating authentication token:", err);
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [router, redirectTo]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
    mode: "onSubmit",
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const res = await api.post("/users/login/", {
        username: values.username,
        password: values.password,
      });

      const access: string | undefined =
        res.data?.access || res.data?.access_token || res.data?.token;

      const refresh: string | undefined =
        res.data?.refresh || res.data?.refresh_token;

      if (!access || !refresh) {
        setError("root", {
          type: "server",
          message:
            "Login succeeded but tokens were not returned (expected access + refresh).",
        });
        return;
      }

      clearErrors();
      setLoginSuccess(true);
      setAccessToken(access);

      // refresh token is used by api.ts refresh flow, so we must store it too
      if (typeof window !== "undefined") {
        localStorage.setItem("refreshToken", refresh);
      }

      await delay(800);
      router.push(redirectTo);
      // router.refresh();
    } catch (err: any) {
      const message =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Invalid username or password.";
      setError("root", { type: "server", message });
    }
  };

  if (isLoading) {
    return <></>;
  }

  return (
    <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white px-10 py-12 shadow-md">
      <h1 className="mb-2 text-center text-2xl font-semibold text-slate-900">
        Login
      </h1>
      <p className="mb-8 text-center text-sm text-slate-600">
        Welcome back! Please enter your account details.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Username / Email */}
        <div className="space-y-1">
          <Label
            htmlFor="username"
            className="text-sm font-medium text-slate-800"
          >
            Username / Email
          </Label>
          <Input
            id="username"
            type="text"
            placeholder="Enter Username / Email"
            autoComplete="username"
            {...register("username")}
          />
          {errors.username && (
            <p className="text-xs text-bloom-red">{errors.username.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1">
          <Label
            htmlFor="password"
            className="text-sm font-medium text-slate-800"
          >
            Password
          </Label>

          <div className="body flex w-full items-center justify-between rounded-md border bg-background shadow-bloom-input outline-none">
            <input
              id="password"
              className="h-full w-full px-3 py-2 outline-none placeholder:text-bloom-gray"
              type={showPassword ? "text" : "password"}
              placeholder="Enter Password"
              autoComplete="current-password"
              {...register("password")}
            />

            <button
              type="button"
              className="pr-2"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              {showPassword ? <Eye /> : <EyeClosed />}
            </button>
          </div>

          {errors.password && (
            <p className="text-xs text-bloom-red">{errors.password.message}</p>
          )}

          {/* <div className="mt-1 flex justify-end">
              <button
                type="button"
                className="text-xs text-slate-500 underline-offset-2 hover:underline"
              >
                Forgot Password?
              </button>
            </div> */}
        </div>

        {/* Server error */}
        {errors.root?.message && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-bloom-red">
            {errors.root.message}
          </p>
        )}

        {loginSuccess && (
          <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
            Login successful. Redirecting…
          </p>
        )}

        {/* Submit */}
        <div className="flex justify-center pt-4">
          <Button type="submit" variant="confirm" disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : "Login"}
          </Button>
        </div>
      </form>
    </div>
  );
}
