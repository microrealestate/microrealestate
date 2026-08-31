import { ChartContainer } from '@microrealestate/commonui/components/ui/chart';
import { useFormatNumber } from '@microrealestate/commonui/providers/CurrencyProvider';
import { cn } from '@microrealestate/commonui/utils';
import { useQuery } from '@tanstack/react-query';
import { observer } from 'mobx-react-lite';
import moment from 'moment';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { LuBanknote } from 'react-icons/lu';
import { Bar, BarChart, Legend, ReferenceLine, XAxis, YAxis } from 'recharts';
import { useMediaQuery } from 'usehooks-ts';
import { useRouter } from '@/i18n/navigation';
import { fetchRevenuesBreakdown, QueryKeys } from '@/utils/restcalls';
import { DashboardCard } from '../dashboard/DashboardCard';

function revenuesBreakdownCard({ year, className }) {
  const router = useRouter();
  const t = useTranslations('common');
  const formatNumber = useFormatNumber();
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const currentYear = year || moment().year();

  const {
    data: rawData,
    isLoading,
    error
  } = useQuery({
    queryKey: [QueryKeys.REVENUES_BREAKDOWN, currentYear],
    queryFn: () => fetchRevenuesBreakdown(currentYear),
    refetchOnMount: 'always',
    retry: 3
  });

  const data = useMemo(() => {
    const now = moment();
    return rawData?.reduce((acc, revenues) => {
      const revenuesMoment = moment(revenues.month, 'YYYYMM');
      const graphData = {
        ...revenues,
        name: revenuesMoment.format('MMM'),
        yearMonth: revenuesMoment.format('YYYY.MM')
      };
      if (revenuesMoment.isSameOrBefore(now)) {
        acc.push(graphData);
      } else {
        acc.push({
          ...graphData,
          notPaid: 0
        });
      }
      return acc;
    }, []);
  }, [rawData]);

  const handleClick = (dataKey) => (data) => {
    const { yearMonth } = data;
    const status = dataKey.toLowerCase();
    const period = moment(yearMonth, 'YYYY.MM', true);
    const from = period.clone().startOf('month').format('YYYY-MM-DD');
    const to = period.clone().endOf('month').format('YYYY-MM-DD');
    router.push(`/rents?from=${from}&to=${to}&filter.statuses=${status}`);
  };

  return (
    <DashboardCard
      Icon={LuBanknote}
      title={t('Rents of {year}', {
        year: moment().format('YYYY')
      })}
      description={t('Rents for the year')}
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
            className="size-full"
          >
            <BarChart data={data} layout="vertical" stackOffset="sign">
              <XAxis
                type="number"
                hide={true}
                domain={['dataMin', 'dataMax']}
                padding={
                  isDesktop ? { left: 70, right: 70 } : { left: 35, right: 35 }
                }
              />
              <YAxis
                dataKey="name"
                hide={false}
                axisLine={false}
                tickLine={false}
                type="category"
                tick={(props) => {
                  const { x, y, payload } = props;
                  return (
                    <text
                      x={x - 30}
                      y={y}
                      className="text-[9px] md:text-xs"
                      fill="var(--muted-foreground)"
                    >
                      {payload.value}
                    </text>
                  );
                }}
              />
              <Legend
                verticalAlign="top"
                content={() => (
                  <div className="flex justify-center gap-4 text-sm mb-6">
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
              <Bar
                dataKey="notPaid"
                fill="var(--chart-warning)"
                stackId="stack"
                cursor="pointer"
                label={{
                  position: 'right',
                  fill: 'var(--warning)',
                  formatter: (value) =>
                    value < 0 ? formatNumber(Math.abs(value)) : '',
                  className: 'tracking-tight text-[9px] md:text-sm'
                }}
                radius={[0, 6, 6, 0]}
                barSize={20}
                stroke="var(--border)"
                strokeWidth={1}
                onClick={handleClick('notPaid')}
              />
              <Bar
                dataKey="paid"
                fill="var(--chart-success)"
                stackId="stack"
                cursor="pointer"
                label={{
                  position: 'right',
                  fill: 'var(--success)',
                  formatter: (value) => (value > 0 ? formatNumber(value) : ''),
                  className: 'tracking-tight text-[9px] md:text-sm'
                }}
                radius={[0, 6, 6, 0]}
                barSize={30}
                stroke="var(--border)"
                strokeWidth={1}
                onClick={handleClick('paid')}
              />
              <ReferenceLine x={0} stroke="var(--border)" />
            </BarChart>
          </ChartContainer>
        )
      }
      className={cn('min-h-[300px] md:min-h-[600px]', className)}
    />
  );
}

export default observer(revenuesBreakdownCard);
