'use client';
import { useEffect } from 'react';

export default function AnalyticsProvider() {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_POSTHOG_KEY && typeof window !== 'undefined') {
      import('posthog-js').then(({ default: posthog }) => {
        if (!posthog.__loaded) {
          posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
            api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
            capture_pageview: true,
          });
        }
      });
    }
  }, []);
  return null;
}
