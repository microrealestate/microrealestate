'use client';

import { cn } from '@microrealestate/commonui/utils';
import { useTranslations } from 'next-intl';
import { useEnv } from '../../providers/EnvProvider';

export function EnvironmentBar() {
  const t = useTranslations('common');
  const demoMode = useEnv('DEMO_MODE');
  const isDemoMode = demoMode === 'true' || demoMode === '1';

  return isDemoMode || process.env.NODE_ENV === 'development' ? (
    <div
      className={cn(
        'text-xs text-center py-0.5 tracking-wider w-full',
        isDemoMode
          ? 'bg-success text-success-foreground'
          : 'bg-neutral-500 text-success-foreground/80'
      )}
    >
      {isDemoMode ? t('Demonstration mode') : t('Development mode')}
    </div>
  ) : null;
}
