import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Dynamic pages (the invoice tool) would otherwise stream <title>, description and
  // canonical into <body>; AI crawlers that do not run JavaScript would miss them.
  htmlLimitedBots: /.*/,
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/:path*.html", destination: "/:path*", permanent: true },
    ];
  },
};

export default nextConfig;