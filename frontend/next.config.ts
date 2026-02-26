import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: '..',
  },
};

// Wrap with Sentry only if DSN is configured
let config: NextConfig = nextConfig;

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  // Dynamic import to avoid loading @sentry/nextjs when not needed
  const { withSentryConfig } = require("@sentry/nextjs");

  config = withSentryConfig(nextConfig, {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    silent: !process.env.CI,
    widenClientFileUpload: true,
    reactComponentAnnotation: { enabled: true },
    tunnelRoute: "/monitoring",
    hideSourceMaps: true,
    disableLogger: true,
    automaticVercelMonitors: true,
  });
}

export default config;
