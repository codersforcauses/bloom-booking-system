"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api, { setAccessToken } from "@/lib/api";

/**
 * - POST /users/login/ with username/password
 * - Backend returns access token in JSON and sets refresh token cookie
 * - Store access token in memory via setAccessToken()
 * - Redirect to home page on success
 * - Show error message on failure
 */
export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!username || !password) {
      setError("Please enter both username/email and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Uses axios instance with withCredentials: true
      // so backend can set refresh cookie on login.
      const res = await api.post("/users/login/", { username, password });

      // Expecting { access: "..." } (common JWT pattern)
      const access: string | undefined =
        res.data?.access || res.data?.access_token || res.data?.token;

      if (!access) {
        throw new Error("Login succeeded but no access token was returned.");
      }

      // Store access token in-memory for subsequent API calls
      setAccessToken(access);

      // Redirect to home page
      router.push("/");
      router.refresh();
    } catch (err: any) {
      // Axios error shape:
      // err.response?.data?.detail / message etc
      const message =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Login failed. Please check your credentials.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f5f7] px-4">
      {/* Login box */}
      <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white px-10 py-12 shadow-md">
        <h1 className="mb-2 text-center text-2xl font-semibold text-slate-900">
          Login
        </h1>
        <p className="mb-8 text-center text-sm text-slate-600">
          Welcome back! Please enter your account details.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div className="space-y-1">
            <Label
              htmlFor="email"
              className="text-sm font-medium text-slate-800"
            >
              Username / Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter Username/ Email"
              autoComplete="email"
              className="h-11 border border-slate-200 shadow-[0_2px_0_rgba(148,163,184,0.5)] placeholder:text-slate-400"
            />
          </div>

          {/* Password */}
          <div className="space-y-1">
            <Label
              htmlFor="password"
              className="text-sm font-medium text-slate-800"
            >
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter Password"
              autoComplete="current-password"
              className="h-11 border border-slate-200 shadow-[0_2px_0_rgba(148,163,184,0.5)] placeholder:text-slate-400"
            />
            <div className="mt-1 flex justify-end">
              <button
                type="button"
                className="text-xs text-slate-500 underline-offset-2 hover:underline"
              >
                Forgot Password?
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          )}

          {/* Login button */}
          <div className="flex justify-center pt-4">
            <Button
              type="submit"
              variant="confirm"
              size="lg"
              disabled={isSubmitting}
              className="rounded-full px-10"
            >
              {isSubmitting ? "Logging in..." : "Login"}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
