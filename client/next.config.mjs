import os from "node:os";
import isInsideContainer from "is-inside-container";

const isWindowsDevContainer = () =>
  os.release().toLowerCase().includes("microsoft") && isInsideContainer();

export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // dumb fix for windows docker
  webpack: isWindowsDevContainer()
    ? (config) => {
        config.watchOptions = {
          poll: 1000,
          aggregateTimeout: 300,
        };
        return config;
      }
    : undefined,
  // allow images from the local backend (e.g., localhost:8000) to render
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/**",
      },
      ...(BACKEND_URL
        ? [
            {
              protocol: new URL(BACKEND_URL).protocol.replace(":", ""),
              hostname: new URL(BACKEND_URL).hostname,
              pathname: "/**",
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
