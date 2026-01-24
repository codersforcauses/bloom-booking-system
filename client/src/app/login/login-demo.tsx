"use client";

import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useRouter } from "next/dist/client/components/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";

/**
 * TODO: REMOVE THIS COMPONENT
 * Temporary demo login used only for role-based CRUD testing.
 * Should be deleted once real authentication is merged.
 */
export type LoginResponse = {
  access: string;
  refresh: string;
  role: string;
};

export function useLogin() {
  return useMutation<
    LoginResponse,
    AxiosError,
    { username: string; password: string }
  >({
    mutationFn: async (payload) => {
      const response = await api.post("/users/login/", payload);
      return response.data;
    },
  });
}

export default function LoginDemo() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLogout, setIsLogout] = useState(true);

  const { mutate, isPending, error } = useLogin();

  useEffect(() => {
    setIsLogout(!localStorage.getItem("accessToken"));
  }, []);

  const handleLogin = () => {
    mutate(
      { username, password },
      {
        onSuccess: (data) => {
          localStorage.setItem("accessToken", data.access);
          localStorage.setItem("refreshToken", data.refresh);
          setIsLogout(false);
        },
      },
    );
  };

  return (
    <div className="w-full max-w-sm space-y-4 rounded-lg border p-6">
      <p className="text-sm text-muted-foreground">Demo login (temporary)</p>

      {!isLogout ? (
        <div className="space-y-4">
          <p>You're already logged in.</p>
          <Button
            variant={"warning"}
            onClick={() => {
              router.push("/test/settings");
            }}
            className="w-full"
          >
            Go To Logout
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <Input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className="text-sm text-red-500">Login failed</p>}

          <Button
            variant="login"
            onClick={handleLogin}
            disabled={isPending}
            className="w-full"
          >
            {isPending ? "Logging in..." : "Login"}
          </Button>
        </div>
      )}
    </div>
  );
}
