/** @type {import('next').NextConfig} */
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

const nextConfig = {
  env: {
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
};

export default nextConfig;
