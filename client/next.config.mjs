import os from "node:os";

import isInsideContainer from "is-inside-container";

const isWindowsDevContainer = () =>
  os.release().toLowerCase().includes("microsoft") && isInsideContainer();

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
  // allow images from s3 to render
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "bloom-images-dev.s3.amazonaws.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
