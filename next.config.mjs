/** @type {import('next').NextConfig} */
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
};

export default nextConfig;
