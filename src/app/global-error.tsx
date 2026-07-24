'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body style={{ background: '#0a0a0e', color: '#fff', fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', margin: 0 }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>Something went wrong</h2>
          <p style={{ color: '#888', marginBottom: '24px' }}>An unexpected error occurred. Our team has been notified.</p>
          <button
            onClick={reset}
            style={{ background: '#FF1744', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px 24px', cursor: 'pointer', fontSize: '14px' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
