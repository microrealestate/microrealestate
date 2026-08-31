import { ChartContainer } from '@microrealestate/commonui/components/ui/chart';
import { useFormatNumber } from '@microrealestate/commonui/providers/CurrencyProvider';
import { useQuery } from '@tanstack/react-query';
import { observer } from 'mobx-react-lite';
import moment from 'moment';
import { useTranslations } from 'next-intl';
import { LuBanknote, LuTrendingDown, LuTrendingUp } from 'react-icons/lu';
import { Cell, Legend, Pie, PieChart } from 'recharts';
import { useRouter } from '@/i18n/navigation';
import { fetchMonthRevenues, QueryKeys } from '../../utils/restcalls';
import { DashboardCard } from '../dashboard/DashboardCard';
import NumberFormat from '../NumberFormat';

function MonthRevenuesCard({ variant = 'chart', month, year, className }) {
  const t = useTranslations('common');
  const router = useRouter();
  const formatNumber = useFormatNumber();
  const currentMonth = moment();
  if (month) {
    currentMonth.month(month - 1);
  }
  if (year) {
    currentMonth.year(year);
  }
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

  if (variant === 'chart') {
    const chartData = [
      {
        name: 'notPaid',
        value: data?.notPaid ?? 0,
        color: 'var(--warning)'
      },
      {
        name: 'paid',
        value: data?.paid ?? 0,
        color: 'var(--success)'
      }
    ];

    const handleClick = (itemData) => {
      if (!itemData?.payload) {
        return;
      }

      const {
        payload: { name }
      } = itemData;

      if (!name) {
        return;
      }

      const status = name.toLowerCase();
      router.push(
        `/rents?from=${fromIso}&to=${toIso}&filter.statuses=${status}`
      );
    };

    return (
      <DashboardCard
        Icon={LuBanknote}
        title={t('Payments')}
        description={t('Rents of {monthYear}', {
          monthYear: currentMonth.format('MMMM YYYY')
        })}
        loading={isLoading}
        renderContent={() =>
          error ? (
            '-'
          ) : (
            <ChartContainer
              config={{
                paid: {},
                notPaid: {}
              }}
              className="aspect-video w-full"
            >
              <PieChart>
                <Legend
                  verticalAlign="top"
                  content={() => (
                    <div className="flex justify-center gap-4 text-sm">
                      <div className="flex items-center gap-2 text-warning">
                        <div className="size-2 bg-[var(--chart-warning)]" />
                        <span>{t('Not paid')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-success">
                        <div className="size-2 bg-[var(--chart-success)]" />
                        <span>{t('Paid')}</span>
                      </div>
                    </div>
                  )}
                />
                <Pie
                  dataKey="value"
                  startAngle={180}
                  endAngle={0}
                  data={chartData}
                  cx="50%"
                  cy="95%"
                  outerRadius="120%"
                  innerRadius="80%"
                  label={(entry) =>
                    entry.value ? formatNumber(entry.value) : ''
                  }
                  labelLine={false}
                  cornerRadius={6}
                  paddingAngle={3}
                  onClick={handleClick}
                >
                  {chartData.map((entry) => (
                    <Cell
                      key={`cell-${entry.name}`}
                      fill={entry.color}
                      stroke="var(--border)"
                      strokeWidth={1}
                      cursor="pointer"
                    />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          )
        }
        className={className}
      />
    );
  }
  if (variant === 'paid' || variant === 'notPaid') {
    return (
      <DashboardCard
        Icon={variant === 'paid' ? LuTrendingUp : LuTrendingDown}
        title={variant === 'paid' ? t('Paid') : t('Not paid')}
        description={
          data
            ? t('{count} rents', {
                count:
                  variant === 'paid'
                    ? data.paidCount + data.partiallyPaidCount
                    : data.notPaidCount
              })
            : ''
        }
        loading={isLoading}
        renderContent={
          error
            ? '-'
            : () => (
                <NumberFormat
                  value={variant === 'paid' ? data?.paid : data?.notPaid}
                  creditColor={variant === 'paid'}
                  debitColor={variant === 'notPaid'}
                  showZero={variant === 'paid'}
                  className="grow"
                />
              )
        }
        className={className}
      />
    );
  }

  return null;
}

export default observer(MonthRevenuesCard);
