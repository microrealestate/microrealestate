'use client';

import { useEffect } from 'react';
import { useEnv } from '../providers/EnvProvider';

export default function ServiceWorkerRegistration() {
  const basePath = useEnv('BASE_PATH') || '';

  useEffect(() => {
    if (
      process.env.NODE_ENV === 'development' ||
      !('serviceWorker' in navigator)
    ) {
      return;
    }
    navigator.serviceWorker
      .register(`${basePath}/sw.js`, { scope: `${basePath}/` })
      .catch((error) => {
        console.error('Service worker registration failed', error);
      });
  }, [basePath]);

  return null;
}
