/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["maharex.iptime.org"],
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2678400
  }
};

export default nextConfig;
