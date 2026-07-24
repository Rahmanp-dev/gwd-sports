'use client';
// PostHog analytics wrapper
// Import posthog-js lazily to avoid SSR issues

let _posthog: any = null;

function getPostHog() {
  if (typeof window === 'undefined') return null;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return null;
  if (!_posthog) {
    import('posthog-js').then(({ default: posthog }) => {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
        capture_pageview: true,
        capture_pageleave: true,
      });
      _posthog = posthog;
    });
  }
  return _posthog;
}

export function trackEvent(event: string, properties?: Record<string, any>) {
  const ph = getPostHog();
  if (ph) ph.capture(event, properties);
}

export function trackRegistration(userId: string, academySlug: string) {
  trackEvent('user_registered', { userId, academySlug });
}

export function trackPayment(userId: string, amount: number, planType: string, academySlug: string) {
  trackEvent('payment_completed', { userId, amount, planType, academySlug });
}

export function trackDropoff(step: string, metadata?: Record<string, any>) {
  trackEvent('registration_dropoff', { step, ...metadata });
}

export function identifyUser(userId: string, properties: Record<string, any>) {
  const ph = getPostHog();
  if (ph) ph.identify(userId, properties);
}
