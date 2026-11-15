import { useFormatNumber } from '@microrealestate/commonui/providers/CurrencyProvider';
import { cn } from '@microrealestate/commonui/utils';
import { useQuery } from '@tanstack/react-query';
import { observer } from 'mobx-react-lite';
import moment from 'moment';
import { useTranslations } from 'next-intl';
import { LuBanknote } from 'react-icons/lu';
import { useRouter } from '@/i18n/navigation';
import { fetchMonthRevenues, QueryKeys } from '../../utils/restcalls';
import { DashboardCard } from '../dashboard/DashboardCard';
import NumberFormat from '../NumberFormat';

function MonthRevenuesCard() {
  const t = useTranslations('common');
  const router = useRouter();
  const formatNumber = useFormatNumber();
  const currentMonth = moment();
  const fromIso = currentMonth.clone().startOf('month').format('YYYY-MM-DD');
  const toIso = currentMonth.clone().endOf('month').format('YYYY-MM-DD');

  const { data, isLoading, error } = useQuery({
    queryKey: [
      QueryKeys.MONTH_REVENUES,
      currentMonth.year(),
      currentMonth.month() + 1
    ],
    queryFn: () =>
      fetchMonthRevenues(currentMonth.month() + 1, currentMonth.year()),
    refetchOnMount: 'always',
    retry: 3
  });

  const paid = data?.paid ?? 0;
  const notPaid = data?.notPaid ?? 0;
  const total = paid + notPaid;
  const ratio = total ? paid / total : 0;

  const goToRents = (statuses) => () =>
    router.push(
      `/rents?from=${fromIso}&to=${toIso}&filter.statuses=${statuses}`
    );
  const goToPaid = goToRents('partiallypaid,paid');
  const goToNotPaid = goToRents('notpaid');

  const counts = [
    {
      key: 'paid',
      label: t('{count, plural, one {# rent paid} other {# rents paid}}', {
        count: data?.paidCount ?? 0
      }),
      count: data?.paidCount ?? 0,
      onClick: goToRents('paid')
    },
    {
      key: 'partiallyPaid',
      label: t(
        '{count, plural, one {# partially paid} other {# partially paid}}',
        { count: data?.partiallyPaidCount ?? 0 }
      ),
      count: data?.partiallyPaidCount ?? 0,
      onClick: goToRents('partiallypaid')
    },
    {
      key: 'notPaid',
      label: t('{count, plural, one {# unpaid} other {# unpaid}}', {
        count: data?.notPaidCount ?? 0
      }),
      count: data?.notPaidCount ?? 0,
      onClick: goToNotPaid
    }
  ].filter(({ count }) => count > 0);

  return (
    <DashboardCard
      Icon={LuBanknote}
      title={t('Rents of {monthYear}', {
        monthYear: currentMonth.format('MMMM YYYY')
      })}
      description={
        counts.length ? (
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            {counts.map(({ key, label, onClick }) => (
              <li key={key}>
                <button
                  type="button"
                  onClick={onClick}
                  className="hover:underline"
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        ) : null
      }
      loading={isLoading}
      renderContent={() => {
        if (error) {
          return '-';
        }
        if (!total) {
          return (
            <div className="flex size-full items-center justify-center py-8 text-muted-foreground">
              {t('No rent due')}
            </div>
          );
        }
        return (
          <div
            className="flex flex-col justify-center gap-4 size-full"
            data-cy="monthRevenuesMeter"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <NumberFormat
                value={ratio}
                style="percent"
                minimumFractionDigits={0}
                showZero={true}
              />
              <span className="text-sm md:text-base font-normal text-muted-foreground tabular-nums">
                {t('{paid} of {total}', {
                  paid: formatNumber(paid),
                  total: formatNumber(total)
                })}
              </span>
            </div>
            <div className="flex h-4 w-full gap-0.5 overflow-hidden rounded-full">
              {paid > 0 ? (
                <button
                  type="button"
                  aria-label={t('Rent collected')}
                  onClick={goToPaid}
                  className="h-full min-w-2 bg-(--chart-success) hover:opacity-80"
                  style={{ width: `${ratio * 100}%` }}
                />
              ) : null}
              {notPaid > 0 ? (
                <button
                  type="button"
                  aria-label={t('Left to collect')}
                  onClick={goToNotPaid}
                  className="h-full min-w-2 bg-(--chart-warning) hover:opacity-80"
                  style={{ width: `${(1 - ratio) * 100}%` }}
                />
              ) : null}
            </div>
            <div className="flex flex-col gap-2">
              {[
                {
                  key: 'paid',
                  label: t('Rent collected'),
                  value: paid,
                  swatch: 'bg-(--chart-success)'
                },
                {
                  key: 'notPaid',
                  label: t('Left to collect'),
                  value: notPaid,
                  swatch: 'bg-(--chart-warning)'
                }
              ].map(({ key, label, value, swatch }) => (
                <div
                  key={key}
                  className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm md:text-base font-normal"
                >
                  <span className={cn('size-2 shrink-0', swatch)} />
                  <span className="grow min-w-0">{label}</span>
                  <NumberFormat
                    value={value}
                    creditColor={key === 'paid'}
                    debitColor={key === 'notPaid'}
                    showZero={true}
                    className="ml-auto font-semibold"
                  />
                </div>
              ))}
            </div>
          </div>
        );
      }}
    />
  );
}

export default observer(MonthRevenuesCard);
