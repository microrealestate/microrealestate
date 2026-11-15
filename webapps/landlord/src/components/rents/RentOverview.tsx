import { Card } from '@microrealestate/commonui/components/ui/card';
import { Progress } from '@microrealestate/commonui/components/ui/progress';
import { useFormatNumber } from '@microrealestate/commonui/providers/CurrencyProvider';
import { cn } from '@microrealestate/commonui/utils';
import type { API } from '@microrealestate/shared';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { isCredit, leftToPay } from './rentView';
import type { MonthRent } from './types';

function OverviewCard({
  label,
  value,
  children
}: {
  label: string;
  value: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="@container p-4 lg:p-5">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 whitespace-nowrap text-lg font-bold tabular-nums @[13rem]:text-xl @[16rem]:text-2xl">
        {value}
      </div>
      <div className="mt-3 space-y-2 text-sm text-muted-foreground">
        {children}
      </div>
    </Card>
  );
}

export function RentOverview({
  data,
  rents = []
}: {
  data?: API.Landlord.Rent.RentMonthOverview;
  rents?: MonthRent[];
}) {
  const t = useTranslations('common');
  const formatNumber = useFormatNumber();

  const paid = data?.totalPaid ?? 0;
  const notPaid = data?.totalNotPaid ?? 0;
  const total = paid + notPaid;
  const percent = total > 0 ? Math.round((paid / total) * 100) : 0;
  const notFullyPaid =
    (data?.countNotPaid ?? 0) + (data?.countPartiallyPaid ?? 0);
  const credit = useMemo(() => {
    const inCredit = rents.filter(isCredit);
    return {
      count: inCredit.length,
      amount: inCredit.reduce((sum, rent) => sum - leftToPay(rent), 0)
    };
  }, [rents]);

  return (
    <div data-cy="rentsProgress">
      <Card className="space-y-2 p-4 sm:hidden">
        {[
          { label: t('Rent collected'), value: formatNumber(paid) },
          { label: t('Left to collect'), value: formatNumber(notPaid) },
          {
            label: t('Tenant credits'),
            value: formatNumber(credit.amount),
            className: 'text-success'
          }
        ].map(({ label, value, className }) => (
          <div
            key={label}
            className="flex flex-wrap items-baseline justify-between gap-x-3"
          >
            <span className="text-sm text-muted-foreground">{label}</span>
            <span
              className={cn(
                'ml-auto whitespace-nowrap font-semibold tabular-nums',
                className
              )}
            >
              {value}
            </span>
          </div>
        ))}
      </Card>
      <div className="hidden grid-cols-3 gap-4 sm:grid">
        <OverviewCard label={t('Rent collected')} value={formatNumber(paid)}>
          <Progress
            value={percent}
            className="h-2"
            indicatorClassName="bg-success"
            aria-label={t('{paid} of {total}', {
              paid: formatNumber(paid),
              total: formatNumber(total)
            })}
          />
          <div>
            {t('{percent}% of {total}', {
              percent,
              total: formatNumber(total)
            })}
          </div>
        </OverviewCard>
        <OverviewCard
          label={t('Left to collect')}
          value={formatNumber(notPaid)}
        >
          {t(
            '{count, plural, =0 {Every rent is paid} one {# rent not fully paid} other {# rents not fully paid}}',
            { count: notFullyPaid }
          )}
        </OverviewCard>
        <OverviewCard
          label={t('Tenant credits')}
          value={
            <span className="text-success">{formatNumber(credit.amount)}</span>
          }
        >
          {t(
            '{count, plural, =0 {No tenant paid in advance} one {# tenant paid in advance} other {# tenants paid in advance}}',
            { count: credit.count }
          )}
        </OverviewCard>
      </div>
    </div>
  );
}
