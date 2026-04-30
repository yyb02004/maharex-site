/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["maharex.iptime.org"],
  typescript: {
    ignoreBuildErrors: true
  },
  images: {
    unoptimized: true
  }
};

export default nextConfig;
