'use client';

import { cn } from '@microrealestate/commonui/utils';
import { useTranslations } from 'next-intl';
import { useEnv } from '../../providers/EnvProvider';

export type EnvironmentMode = 'demo' | 'development' | null;

// Height of the strip in px (`h-6`), exposed by the Shell as `--env-bar-h`
export const ENVIRONMENT_BAR_HEIGHT = 24;

export function useEnvironmentMode(): EnvironmentMode {
  const demoMode = useEnv('DEMO_MODE');
  if (demoMode === 'true' || demoMode === '1') {
    return 'demo';
  }
  return process.env.NODE_ENV === 'development' ? 'development' : null;
}

export function EnvironmentBar() {
  const t = useTranslations('common');
  const mode = useEnvironmentMode();

  return mode ? (
    <div
      className={cn(
        'sticky top-0 z-40 flex h-6 w-full items-center justify-center text-xs tracking-wider',
        mode === 'demo'
          ? 'bg-success text-success-foreground'
          : 'bg-neutral-500 text-success-foreground/80'
      )}
    >
      {mode === 'demo' ? t('Demonstration mode') : t('Development mode')}
    </div>
  ) : null;
}
