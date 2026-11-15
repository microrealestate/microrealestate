import { Progress } from '@microrealestate/commonui/components/ui/progress';
import { useFormatNumber } from '@microrealestate/commonui/providers/CurrencyProvider';
import { cn } from '@microrealestate/commonui/utils';
import type { RentEmailName } from '@microrealestate/shared';
import moment from 'moment';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import Status, { type StatusVariant } from '../Status';
import { RENT_DOCUMENTS } from './rentDocuments';
import {
  leftToPay,
  paidPercent,
  type RentStatusValue,
  rentPropertyList,
  rentStatus
} from './rentView';
import type { MonthRent } from './types';

export function Money({
  value,
  className
}: {
  value: number;
  className?: string;
}) {
  const formatNumber = useFormatNumber();
  return (
    <span className={cn('tabular-nums whitespace-nowrap', className)}>
      {formatNumber(value)}
    </span>
  );
}

export function LeftToPay({
  rent,
  layout = 'inline',
  className
}: {
  rent: MonthRent;
  layout?: 'inline' | 'stacked';
  className?: string;
}) {
  const t = useTranslations('common');
  const formatNumber = useFormatNumber();
  const left = leftToPay(rent);
  const dataCy = { 'data-cy': 'rent-left', 'data-cy-amount': left };
  if (left < 0 && layout === 'stacked') {
    return (
      <span {...dataCy} className="inline-flex flex-col items-end">
        <span
          className={cn(
            'tabular-nums whitespace-nowrap font-medium text-success',
            className
          )}
        >
          {formatNumber(-left)}
        </span>
        <span className="text-xs text-success/80">{t('Tenant credit')}</span>
      </span>
    );
  }
  let content = formatNumber(left);
  let tone = 'font-semibold text-foreground';
  if (left < 0) {
    content = t('Credit {amount}', { amount: formatNumber(-left) });
    tone = 'font-medium text-success';
  } else if (left === 0) {
    tone = 'text-muted-foreground';
  }
  return (
    <span
      {...dataCy}
      className={cn('tabular-nums whitespace-nowrap', tone, className)}
    >
      {content}
    </span>
  );
}

export function RentEmailSummary({
  rent,
  className
}: {
  rent: MonthRent;
  className?: string;
}) {
  const t = useTranslations('common');
  if (!rent.occupant.hasContactEmails) {
    return (
      <div className={cn('mt-1 text-xs text-warning', className)}>
        {t('No email address')}
      </div>
    );
  }
  const latest = RENT_DOCUMENTS.reduce<{
    name: RentEmailName;
    sentDate: moment.Moment;
  } | null>((found, { name }) => {
    const sentDate = rent.emailStatus?.last?.[name]?.sentDate;
    if (!sentDate) {
      return found;
    }
    const date = moment(sentDate);
    return !found || date.isAfter(found.sentDate)
      ? { name, sentDate: date }
      : found;
  }, null);
  if (!latest) {
    return null;
  }
  return (
    <div
      className={cn('mt-1 truncate text-xs text-muted-foreground', className)}
      title={latest.sentDate.format('LLL')}
    >
      {t(
        '{document, select, rentnotice {Notice sent on {date}} rentnotice_reminder {Reminder sent on {date}} rentnotice_last_reminder {Final reminder sent on {date}} receipt {Receipt sent on {date}} other {Sent on {date}}}',
        { document: latest.name, date: latest.sentDate.format('D MMM') }
      )}
    </div>
  );
}

export function useRentPropertySummary() {
  const t = useTranslations('common');
  return (rent: MonthRent) => {
    const names = rentPropertyList(rent).map(({ name }) => name);
    if (names.length <= 2) {
      return names.join(', ');
    }
    return t(
      '{property} and {count, plural, one {# other property} other {# other properties}}',
      { property: names[0], count: names.length - 1 }
    );
  };
}

const VARIANTS: Record<RentStatusValue, StatusVariant> = {
  notpaid: 'default',
  partiallypaid: 'warning',
  upcoming: 'muted',
  paid: 'success'
};

const INDICATORS: Record<RentStatusValue, string> = {
  notpaid: 'bg-transparent',
  partiallypaid: 'bg-warning',
  upcoming: 'bg-transparent',
  paid: 'bg-success'
};

export function useRentStatusLabels(): Record<RentStatusValue, string> {
  const t = useTranslations('common');
  return useMemo(
    () => ({
      notpaid: t('Not paid'),
      partiallypaid: t('Partially paid'),
      upcoming: t('Not due yet'),
      paid: t('Paid')
    }),
    [t]
  );
}

export function RentStatusBadge({ rent }: { rent: MonthRent }) {
  const labels = useRentStatusLabels();
  const status = rentStatus(rent);
  return (
    <span data-cy="rent-status" data-cy-value={rent.status}>
      <Status variant={VARIANTS[status]}>{labels[status]}</Status>
    </span>
  );
}

export function RentProgress({
  rent,
  className
}: {
  rent: MonthRent;
  className?: string;
}) {
  const t = useTranslations('common');
  const percent = paidPercent(rent);
  return (
    <Progress
      value={percent}
      className={cn('h-1.5', className)}
      indicatorClassName={INDICATORS[rentStatus(rent)]}
      aria-label={t('{percent}% paid', { percent })}
    />
  );
}
