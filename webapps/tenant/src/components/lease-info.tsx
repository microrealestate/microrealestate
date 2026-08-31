'use client';

import { cn } from '@microrealestate/commonui/utils';
import type { LeaseStatus } from '@microrealestate/shared';
import { useLocale, useTranslations } from 'next-intl';

interface LeaseInfoProps {
  lease: {
    tenant: { name: string };
    properties: { name: string }[];
    status: LeaseStatus;
    beginDate?: Date | string | null;
    endDate?: Date | string | null;
    terminationDate?: Date | string | null;
  };
}

export function LeaseInfo({ lease }: LeaseInfoProps) {
  const t = useTranslations('common');
  const locale = useLocale();

  const name = lease.tenant.name;
  const properties = lease.properties;
  const begin = lease.beginDate ? new Date(lease.beginDate) : null;
  const end = lease.endDate ? new Date(lease.endDate) : null;

  const ended = lease.status === 'ended' || lease.status === 'terminated';
  const statusLabel = ended ? t('Terminated') : t('In progress');

  const propertiesText = properties.map((p) => p.name).join(', ');

  return (
    <div
      className="flex flex-col sm:flex-row gap-1 text-muted-foreground wrap-break-words"
      data-cy="lease-info"
    >
      <div className="flex items-center gap-1.5 text-foreground font-medium">
        <span
          className={cn(
            'size-2 rounded-full shrink-0',
            ended ? 'bg-muted-foreground' : 'bg-success'
          )}
          title={statusLabel}
          role="img"
          aria-label={statusLabel}
        />
        {name}
      </div>
      {properties.length > 0 && <div>{propertiesText}</div>}
      {begin && (
        <div>
          {end
            ? t('{startDate} – {endDate}', {
                startDate: begin.toLocaleDateString(locale),
                endDate: end.toLocaleDateString(locale)
              })
            : begin.toLocaleDateString(locale)}
        </div>
      )}
    </div>
  );
}
