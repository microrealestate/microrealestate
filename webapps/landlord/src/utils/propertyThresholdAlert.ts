export const PROPERTY_THRESHOLD_ALERT_KEY =
  'mre-property-threshold-alert-dismissed';

export function resetPropertyThresholdAlert() {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.removeItem(PROPERTY_THRESHOLD_ALERT_KEY);
    window.dispatchEvent(
      new StorageEvent('local-storage', { key: PROPERTY_THRESHOLD_ALERT_KEY })
    );
  } catch {}
}
