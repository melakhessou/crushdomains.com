import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'export', // Disabled to support dynamic API routes (GoDaddy Appraisal)
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  /* config options here */
};

export default nextConfig;
