'use client';

import { useEnv } from '../../providers/EnvProvider';

const PLACEHOLDERS = new Set(['latest', 'dev']);

function normalize(value?: string) {
  const trimmed = value?.trim();
  return trimmed && !PLACEHOLDERS.has(trimmed.toLowerCase())
    ? trimmed
    : undefined;
}

export default function VersionBadge() {
  const label =
    normalize(useEnv('APP_VERSION')) ??
    normalize(process.env.NEXT_PUBLIC_APP_VERSION) ??
    normalize(process.env.NEXT_PUBLIC_GIT_SHA);

  if (!label) return null;
  return (
    <p className="font-mono text-xs text-muted-foreground px-4">{label}</p>
  );
}
