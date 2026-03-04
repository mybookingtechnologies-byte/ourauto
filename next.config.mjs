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
  webpack: (config, { dev }) => {
    if (!dev) {
      config.cache = false;
    }

    config.optimization = {
      ...config.optimization,
      minimize: true,
    };

    if (config.optimization?.minimizer) {
      config.optimization.minimizer.forEach((plugin) => {
        if (plugin?.options?.terserOptions) {
          plugin.options.terserOptions.compress.drop_console = true;
        }
      });
    }

    return config;
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
});
