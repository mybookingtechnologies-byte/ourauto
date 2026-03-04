/** @type {import('next').NextConfig} */
import { withSentryConfig } from "@sentry/nextjs";

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    instrumentationHook: true,
  },
  env: {
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  disableLogger: true,
});
