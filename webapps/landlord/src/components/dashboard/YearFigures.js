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
        <div className="text-xs lg:text-lg -ml-8 lg:-ml-4">
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
              />
              <Legend
                verticalAlign="top"
                height={40}
                formatter={(value) =>
                  value === 'paid' ? t('Rent paid') : t('Rents not paid')
                }
              />
              <Bar
                dataKey="notPaid"
                fill="hsl(var(--warning))"
                stackId="stack"
                cursor="pointer"
                background={{ fill: 'hsl(var(--muted))' }}
                label={{
                  fill: 'hsl(var(--warning-foreground))',
                  formatter: (value) => (value < 0 ? formatNumber(value) : ''),
                  className: 'tracking-tight text-[0.5rem] sm:text-xs'
                }}
              />
              <Bar
                dataKey="paid"
                fill="hsl(var(--success))"
                stackId="stack"
                cursor="pointer"
                label={{
                  fill: 'hsl(var(--success-foreground))',
                  formatter: (value) => (value > 0 ? formatNumber(value) : ''),
                  className: 'tracking-tight text-[0.5rem] sm:text-xs'
                }}
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
