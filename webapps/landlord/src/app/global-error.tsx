'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            gap: '1.5rem',
            fontFamily: 'system-ui, sans-serif'
          }}
        >
          <h1 style={{ fontSize: '1.875rem', fontWeight: 600 }}>
            Something went wrong
          </h1>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              border: '1px solid #d1d5db',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
