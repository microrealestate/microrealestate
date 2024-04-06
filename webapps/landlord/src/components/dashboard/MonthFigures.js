import { AlertTriangleIcon, BanknoteIcon } from 'lucide-react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { useContext, useMemo } from 'react';
import { Button } from '../ui/button';
import { CelebrationIllustration } from '../../components/Illustrations';
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
        name: 'notPaid',
        value: currentRevenues.notPaid,
        yearMonth,
        status: 'notpaid'
      },
      {
        name: 'paid',
        value: currentRevenues.paid,
        yearMonth,
        status: 'paid'
      }
    ];
  }, [store.dashboard.currentRevenues, yearMonth]);

  return (
    <div className={cn('grid grid-cols-1 gap-4', className)}>
      <DashboardCard
        Icon={BanknoteIcon}
        title={t('Settlements')}
        description={t('Rents of {{monthYear}}', {
          monthYear: moment().format('MMMM YYYY')
        })}
        renderContent={() => (
          <div className="text-xs lg:text-lg -ml-0.5">
            <ResponsiveContainer aspect={1.75}>
              <PieChart>
                <Legend
                  verticalAlign="top"
                  formatter={(value) =>
                    value === 'paid' ? t('Paid') : t('Not paid')
                  }
                />
                <Pie
                  data={data}
                  startAngle={180}
                  endAngle={0}
                  cy="70%"
                  paddingAngle={2}
                  dataKey="value"
                  innerRadius="55%"
                  cursor="pointer"
                  onClick={(data) => {
                    if (!data?.payload) {
                      return;
                    }
                    const {
                      payload: { yearMonth, status }
                    } = data;
                    store.rent.setFilters({ status: [status] });
                    router.push(
                      `/${store.organization.selected.name}/rents/${yearMonth}?status=${status}`
                    );
                  }}
                  label={({ value }) => (value ? formatNumber(value) : '')}
                  labelLine={false}
                  className="tracking-tight text-[0.5rem] sm:text-xs"
                >
                  <Cell fill="hsl(var(--warning))" />
                  <Cell fill="hsl(var(--success))" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      />

      <DashboardCard
        Icon={AlertTriangleIcon}
        title={t('Top 5 of not paid rents')}
        description={t('Tenants with the highest unpaid balance')}
        renderContent={() =>
          store.dashboard.data.topUnpaid?.length ? (
            <div className="flex flex-col gap-2">
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
                    <span className="font-semibold">
                      <NumberFormat value={balance} withColor />
                    </span>
                  </div>
                )
              )}
            </div>
          ) : (
            <CelebrationIllustration
              label={t('Well done! All rents are paid')}
              height={223}
            />
          )
        }
      />
    </div>
  );
}

export default observer(MonthFigures);
