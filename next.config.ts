// eslint-disable-next-line @typescript-eslint/no-require-imports
const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  // Suppress hydration warnings from browser extensions
  reactStrictMode: true,
};

module.exports = withSentryConfig(nextConfig, {
  silent: true,
  org: 'gwd-sports',
  project: 'gwd-sports-academy',
  widenClientFileUpload: true,
  hideSourceMaps: true,
  // Use webpack treeshaking instead of deprecated disableLogger
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
});

