"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

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

const loginSchema = z.object({
  username: z.string().min(1, "Username / Email is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
    mode: "onSubmit",
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      // Backend should set refresh cookie and return access token in JSON.
      const res = await api.post("/users/login/", {
        username: values.username,
        password: values.password,
      });

      const access: string | undefined =
        res.data?.access || res.data?.access_token || res.data?.token;

      if (!access) {
        setError("root", {
          type: "server",
          message: "Login succeeded but no access token was returned.",
        });
        return;
      }

      setAccessToken(access);

      router.push("/");
      router.refresh();
    } catch (err: any) {
      const message =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Invalid username or password.";

      setError("root", { type: "server", message });
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f5f7] px-4">
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
              className="h-11 border border-slate-200 shadow-[0_2px_0_rgba(148,163,184,0.5)] placeholder:text-slate-400"
              {...register("username")}
            />

            {errors.username && (
              <p className="text-xs text-[var(--bloom-red)]">
                {errors.username.message}
              </p>
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

            <Input
              id="password"
              type="password"
              placeholder="Enter Password"
              autoComplete="current-password"
              className="h-11 border border-slate-200 shadow-[0_2px_0_rgba(148,163,184,0.5)] placeholder:text-slate-400"
              {...register("password")}
            />

            {errors.password && (
              <p className="text-xs text-[var(--bloom-red)]">
                {errors.password.message}
              </p>
            )}

            <div className="mt-1 flex justify-end">
              <button
                type="button"
                className="text-xs text-slate-500 underline-offset-2 hover:underline"
              >
                Forgot Password?
              </button>
            </div>
          </div>

          {/* Server / root error */}
          {errors.root?.message && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {errors.root.message}
            </p>
          )}

          {/* Submit */}
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
