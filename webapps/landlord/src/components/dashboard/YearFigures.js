import {
  Bar,
  BarChart,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis
} from 'recharts';
import { useCallback, useContext, useMemo } from 'react';
import { DashboardCard } from './DashboardCard';
import { LuBanknote } from 'react-icons/lu';
import moment from 'moment';
import { observer } from 'mobx-react-lite';
import { StoreContext } from '../../store';
import useFormatNumber from '../../hooks/useFormatNumber';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';

function YearFigures({ className }) {
  const store = useContext(StoreContext);
  const router = useRouter();
  const { t } = useTranslation('common');
  const formatNumber = useFormatNumber();

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

  const onClick = useCallback(
    (data) => {
      if (
        !data?.activePayload?.[0]?.payload ||
        !store.organization.selected?.name
      ) {
        return;
      }
      const {
        activePayload: [
          {
            payload: { yearMonth }
          }
        ]
      } = data;
      store.rent.setFilters({});
      store.rent.setPeriod(moment(yearMonth, 'YYYY.MM', true));
      router.push(`/${store.organization.selected.name}/rents/${yearMonth}`);
    },
    [router, store.rent, store.organization.selected.name]
  );

  return hasRevenues ? (
    <DashboardCard
      Icon={LuBanknote}
      title={t('Rents of {{year}}', {
        year: moment().format('YYYY')
      })}
      description={t('Rents for the year')}
      renderContent={() => (
        <div className="-ml-8 lg:-ml-4">
          <ResponsiveContainer height={570}>
            <BarChart
              data={data}
              layout="vertical"
              stackOffset="sign"
              onClick={onClick}
            >
              <XAxis
                type="number"
                hide={true}
                domain={['dataMin', 'dataMax']}
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
                      className="text-xs"
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
                  fill: 'hsl(var(--warning))',
                  formatter: (value) => (value < 0 ? formatNumber(value) : ''),
                  className: 'tracking-tight text-[0.5rem] sm:text-xs'
                }}
                stroke="hsl(var(--chart-1-border))"
              />
              <Bar
                dataKey="paid"
                fill="hsl(var(--chart-2))"
                stackId="stack"
                cursor="pointer"
                label={{
                  fill: 'hsl(var(--success))',
                  formatter: (value) => (value > 0 ? formatNumber(value) : ''),
                  className: 'tracking-tight text-[0.5rem] sm:text-xs'
                }}
                stroke="hsl(var(--chart-2-border))"
              />
              <ReferenceLine x={0} stroke="hsl(var(--border))" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      className={className}
    />
  ) : null;
}

export default observer(YearFigures);
