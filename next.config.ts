import type { NextConfig } from "next";

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
      },
    ],
  },
  productionBrowserSourceMaps: false,
  devIndicators: {
    buildActivity: false,
    appIsrStatus: false,
  },
  async rewrites() {
    return [
      {
        source: '/api/guilds/:path*',
        destination: 'http://perf-ind7.renderbyte.site:25573/api/guilds/:path*',
      },
      {
        source: '/api/health',
        destination: 'http://perf-ind7.renderbyte.site:25573/api/health',
      },
    ]
  },
  poweredByHeader: false,
};

export default nextConfig;
