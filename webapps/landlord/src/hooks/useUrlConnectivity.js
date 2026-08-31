import { useEffect, useState } from 'react';

const DEFAULT_CHECK_INTERVAL_MS = 5000;
const DEFAULT_MAX_ATTEMPTS = 5;

async function _isUrlReachable(url) {
  try {
    await fetch(url, { mode: 'no-cors', cache: 'no-store' });
    return true;
  } catch {
    return false;
  }
}

function _isCurrentOrigin(url) {
  try {
    return new URL(url, window.location.href).origin === window.location.origin;
  } catch {
    return false;
  }
}

export default function useUrlConnectivity(
  url,
  {
    enabled = true,
    intervalMs = DEFAULT_CHECK_INTERVAL_MS,
    maxAttempts = DEFAULT_MAX_ATTEMPTS
  } = {}
) {
  const [status, setStatus] = useState('checking');
  const [attempt, setAttempt] = useState(0);
  const [retryToken, setRetryToken] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: retryToken is a trigger only, re-runs the check on demand
  useEffect(() => {
    if (!url || !enabled) {
      setStatus('reachable');
      return;
    }
    if (_isCurrentOrigin(url)) {
      setStatus('reachable');
      return;
    }
    setStatus('checking');
    setAttempt(0);
    let cancelled = false;
    let attempts = 0;
    let intervalId;
    const check = async () => {
      attempts += 1;
      setAttempt(attempts);
      const ok = await _isUrlReachable(url);
      if (cancelled) return;
      if (ok) {
        setStatus('reachable');
        clearInterval(intervalId);
      } else if (attempts >= maxAttempts) {
        setStatus('unreachable');
        clearInterval(intervalId);
      }
    };
    check();
    intervalId = setInterval(check, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [url, enabled, intervalMs, maxAttempts, retryToken]);

  return {
    status,
    attempt,
    maxAttempts,
    retry: () => setRetryToken((n) => n + 1)
  };
}
