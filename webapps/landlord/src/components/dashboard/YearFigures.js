import { Bar, BarChart, Legend, ReferenceLine, XAxis, YAxis } from 'recharts';
import { useContext, useMemo } from 'react';
import { ChartContainer } from '../ui/chart';
import { cn } from '../../utils';
import { DashboardCard } from './DashboardCard';
import { LuBanknote } from 'react-icons/lu';
import moment from 'moment';
import { observer } from 'mobx-react-lite';
import { StoreContext } from '../../store';
import useFormatNumber from '../../hooks/useFormatNumber';
import { useMediaQuery } from 'usehooks-ts';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';

function YearFigures({ className }) {
  const store = useContext(StoreContext);
  const router = useRouter();
  const { t } = useTranslation('common');
  const formatNumber = useFormatNumber();
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const data = useMemo(() => {
    const now = moment();
    return store.dashboard.data.revenues?.reduce((acc, revenues) => {
      const revenuesMoment = moment(revenues.month, 'MMYYYY');
      const graphData = {
        ...revenues,
        name: revenuesMoment.format('MMM'),
        yearMonth: moment(revenues.month, 'MMYYYY').format('YYYY.MM')
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
  }, [store.dashboard.data.revenues]);

  const hasRevenues = useMemo(() => {
    return data.some((r) => r.notPaid !== 0 || r.paid !== 0);
  }, [data]);

  const handleClick = (dataKey) => (data) => {
    const { yearMonth } = data;
    const status = dataKey.toLowerCase();
    store.rent.setFilters({ status: [status] });
    store.rent.setPeriod(moment(yearMonth, 'YYYY.MM', true));
    router.push(
      `/${store.organization.selected.name}/rents/${yearMonth}?statuses=${status}`
    );
  };

  return hasRevenues ? (
    <DashboardCard
      Icon={LuBanknote}
      title={t('Rents of {{year}}', {
        year: moment().format('YYYY')
      })}
      description={t('Rents for the year')}
      renderContent={() => (
        <ChartContainer
          config={{
            paid: { color: 'hsl(var(--chart-2))' },
            notPaid: { color: 'hsl(var(--chart-1))' }
          }}
          className="h-[450px] w-full"
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
                    fill="hsl(var(--muted-foreground))"
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
                    <div className="size-2 bg-[hsl(var(--chart-1))]" />
                    <span>{t('Not paid')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-success">
                    <div className="size-2 bg-[hsl(var(--chart-2))]" />
                    <span>{t('Paid')}</span>
                  </div>
                </div>
              )}
            />
            <Bar
              dataKey="notPaid"
              fill="hsl(var(--chart-1))"
              stackId="stack"
              cursor="pointer"
              label={{
                position: 'right',
                fill: 'hsl(var(--warning))',
                formatter: (value) => (value < 0 ? formatNumber(value) : ''),
                className: 'tracking-tight text-[9px] md:text-sm'
              }}
              stroke="hsl(var(--chart-1-border))"
              radius={[0, 4, 4, 0]}
              barSize={20}
              onClick={handleClick('notPaid')}
            />
            <Bar
              dataKey="paid"
              fill="hsl(var(--chart-2))"
              stackId="stack"
              cursor="pointer"
              label={{
                position: 'right',
                fill: 'hsl(var(--success))',
                formatter: (value) => (value > 0 ? formatNumber(value) : ''),
                className: 'tracking-tight text-[9px] md:text-sm'
              }}
              stroke="hsl(var(--chart-2-border))"
              radius={[0, 4, 4, 0]}
              barSize={30}
              onClick={handleClick('paid')}
            />
            <ReferenceLine x={0} stroke="hsl(var(--border))" />
          </BarChart>
        </ChartContainer>
      )}
      className={className}
    />
  ) : null;
}

export default observer(YearFigures);
