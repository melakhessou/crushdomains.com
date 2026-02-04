import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'export', // Disabled to support dynamic API routes (GoDaddy Appraisal)
  // trailingSlash: true, // Disabled - causes 308 redirects on API routes which breaks /api/check-domain
  images: {
    unoptimized: true,
  },
  /* config options here */
};

export default nextConfig;
