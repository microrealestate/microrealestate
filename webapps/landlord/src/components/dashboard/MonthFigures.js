import { Legend, RadialBar, RadialBarChart } from 'recharts';
import { LuAlertTriangle, LuBanknote } from 'react-icons/lu';
import { useContext, useMemo } from 'react';
import { Button } from '../ui/button';
import { CelebrationIllustration } from '../../components/Illustrations';
import { ChartContainer } from '../ui/chart';
import { cn } from '../../utils';
import { DashboardCard } from './DashboardCard';
import moment from 'moment';
import NumberFormat from '../NumberFormat';
import { observer } from 'mobx-react-lite';
import { StoreContext } from '../../store';
import useFormatNumber from '../../hooks/useFormatNumber';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';

function MonthFigures({ className }) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const store = useContext(StoreContext);
  const formatNumber = useFormatNumber();
  const yearMonth = moment().format('YYYY.MM');
  const data = useMemo(() => {
    const currentRevenues = store.dashboard.currentRevenues;
    return [
      {
        notPaid: currentRevenues.notPaid,
        paid: currentRevenues.paid,
        yearMonth
      }
    ];
  }, [store.dashboard.currentRevenues, yearMonth]);

  const handleClick = (data) => {
    if (!data?.payload) {
      return;
    }

    const status = data.tooltipPayload?.[0].dataKey?.toLowerCase() || '';
    const {
      payload: { yearMonth }
    } = data;

    store.rent.setFilters({ status: [status] });
    store.rent.setPeriod(moment(yearMonth, 'YYYY.MM', true));
    router.push(
      `/${store.organization.selected.name}/rents/${yearMonth}?statuses=${status}`
    );
  };

  return (
    <div className={cn('grid grid-cols-1 gap-4', className)}>
      <DashboardCard
        Icon={store.dashboard.data.topUnpaid?.length ? LuAlertTriangle : null}
        title={
          store.dashboard.data.topUnpaid?.length
            ? t('Top 5 of not paid rents')
            : ''
        }
        description={
          store.dashboard.data.topUnpaid?.length
            ? t('Tenants with the highest unpaid balance')
            : ''
        }
        renderContent={() =>
          store.dashboard.data.topUnpaid?.length ? (
            <div className="flex flex-col gap-2 min-h-48">
              {store.dashboard.data.topUnpaid.map(
                ({ tenant, balance, rent }) => (
                  <div
                    key={tenant._id}
                    className="flex items-center text-sm md:text-base"
                  >
                    <Button
                      variant="link"
                      onClick={() => {
                        store.rent.setSelected(rent);
                        store.rent.setFilters({ searchText: tenant.name });
                        router.push(
                          `/${store.organization.selected.name}/rents/${yearMonth}?search=${tenant.name}`
                        );
                      }}
                      className="justify-start flex-grow p-0 m-0"
                    >
                      {tenant.name}
                    </Button>
                    <NumberFormat
                      value={balance}
                      withColor
                      className="font-semibold"
                    />
                  </div>
                )
              )}
            </div>
          ) : (
            <CelebrationIllustration
              label={t('Well done! All rents are paid')}
            />
          )
        }
      />
      <DashboardCard
        Icon={LuBanknote}
        title={t('Settlements')}
        description={t('Rents of {{monthYear}}', {
          monthYear: moment().format('MMMM YYYY')
        })}
        renderContent={() => (
          <ChartContainer
            config={{
              paid: { color: 'hsl(var(--chart-2))' },
              notPaid: { color: 'hsl(var(--chart-1))' }
            }}
            className="h-[220px] w-full"
          >
            <RadialBarChart
              data={data}
              endAngle={180}
              innerRadius="100%"
              outerRadius="150%"
              cy={'80%'}
            >
              <Legend
                verticalAlign="top"
                content={() => (
                  <div className="flex justify-center gap-4 text-sm">
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
              <RadialBar
                dataKey="paid"
                stackId="rents"
                cornerRadius={4}
                fill="var(--color-paid)"
                stroke="hsl(var(--chart-2-border))"
                label={{
                  fill: 'hsl(var(--success))',
                  position: 'outside',
                  formatter: (value) => (value ? formatNumber(value) : ''),
                  className: 'text-[9px] md:text-sm'
                }}
                cursor="pointer"
                onClick={handleClick}
              />
              <RadialBar
                dataKey="notPaid"
                stackId="rents"
                cornerRadius={4}
                fill="var(--color-notPaid)"
                stroke="hsl(var(--chart-1-border))"
                label={{
                  fill: 'hsl(var(--warning))',
                  position: 'outside',
                  formatter: (value) => (value ? formatNumber(value) : ''),
                  className: 'text-[9px] md:text-sm'
                }}
                cursor="pointer"
                onClick={handleClick}
              />
            </RadialBarChart>
          </ChartContainer>
        )}
      />
    </div>
  );
}

export default observer(MonthFigures);
