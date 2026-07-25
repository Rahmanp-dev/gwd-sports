// eslint-disable-next-line @typescript-eslint/no-require-imports
const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    /**
     * Barrel-file tree shaking.
     *
     * `import { Users } from 'lucide-react'` resolves the package index, which
     * re-exports well over a thousand icon modules. This rewrites such imports
     * to their deep paths so only the icons actually used are ever pulled in.
     *
     * These are the barrel-heavy packages this app leans on hardest: 40 files
     * import framer-motion, and lucide-react appears in nearly every component.
     */
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      'date-fns',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-dialog',
      '@radix-ui/react-tabs',
    ],
  },

  compiler: {
    /**
     * Strip console output from production builds, KEEPING error and warn.
     *
     * Around thirty console.log calls remain in this codebase, several of them
     * in payment and messaging paths where the arguments include a parent's
     * phone number and a rendered message body — not things to leave in a
     * production log stream.
     *
     * `error` and `warn` are excluded from stripping on purpose: every catch
     * block in the payment and job code reports through them, and silencing
     * those would mean a failed settlement leaves no trace at all.
     */
    removeConsole:
      process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: 'localhost' },
    ],
    // Modern formats first; Next negotiates the fallback per client.
    formats: ['image/avif', 'image/webp'],
  },

  // Suppress hydration warnings from browser extensions
  reactStrictMode: true,

  // No reason to advertise the framework version on pages handed to parents.
  poweredByHeader: false,
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

