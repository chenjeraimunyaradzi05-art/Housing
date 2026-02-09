import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
  
  // Enable React strict mode
  reactStrictMode: true,
  
  // Optimize images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.vor.com',
      },
      {
        protocol: 'https',
        hostname: 'vor-dev-storage.s3.amazonaws.com',
      },
    ],
  },
  
  // Environment variables available to the browser
  env: {
    NEXT_PUBLIC_APP_NAME: 'VÖR',
  },
};

// Sentry configuration
const sentryWebpackPluginOptions = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options
  
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT || 'vor-web',
  
  // Only upload source maps in production
  silent: process.env.NODE_ENV !== 'production',
  
  // Suppresses source map uploading logs during build
  hideSourceMaps: true,
  
  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,
};

// Only wrap with Sentry if DSN is configured
export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig;
