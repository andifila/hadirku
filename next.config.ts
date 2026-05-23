import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true, // required for static export
  },
  // basePath for GitHub Pages: /hadirku
  basePath: process.env.NODE_ENV === "production" ? "/hadirku" : "",
  assetPrefix:
    process.env.NODE_ENV === "production" ? "/hadirku/" : "",
};

export default nextConfig;
