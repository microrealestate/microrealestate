import { Button } from '@microrealestate/commonui/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { observer } from 'mobx-react-lite';
import moment from 'moment';
import { useTranslations } from 'next-intl';
import { LuTriangleAlert } from 'react-icons/lu';
import { useRouter } from '@/i18n/navigation';
import { useStore } from '@/providers/StoreProvider';
import { fetchTopUnpaid, QueryKeys } from '../../utils/restcalls';
import { DashboardCard } from '../dashboard/DashboardCard';
import NumberFormat from '../NumberFormat';

function TopUnpaidCard({ month, year }) {
  const t = useTranslations('common');
  const store = useStore();
  const router = useRouter();
  const currentMonth = moment();
  if (month) {
    currentMonth.month(month - 1);
  }
  if (year) {
    currentMonth.year(year);
  }
  const from = currentMonth.clone().startOf('month').format('YYYY-MM-DD');
  const to = currentMonth.clone().endOf('month').format('YYYY-MM-DD');

  const { data, isLoading, error } = useQuery({
    queryKey: [
      QueryKeys.TOP_UNPAID,
      currentMonth.year(),
      currentMonth.month() + 1
    ],
    queryFn: () =>
      fetchTopUnpaid(currentMonth.month() + 1, currentMonth.year()),
    refetchOnMount: 'always',
    retry: 3
  });

  const handleClick = (tenant, rent) => () => {
    store.rent.setSelected(rent);
    router.push(`/rents?from=${from}&to=${to}&search=${tenant.name}`);
  };

  if (!isLoading && (!data || data.length === 0)) {
    return null;
  }

  return (
    <DashboardCard
      Icon={data?.length ? LuTriangleAlert : null}
      title={data?.length ? t('Top 5 of not paid rents') : ''}
      description={
        data?.length ? t('Tenants with the highest unpaid balance') : ''
      }
      loading={isLoading}
      renderContent={() =>
        error ? (
          '-'
        ) : (
          <div className="flex flex-col gap-2 min-h-24 md:min-h-48">
            {data.map(({ tenant, balance, rent }) => (
              <div
                key={tenant._id}
                className="flex items-center text-sm md:text-base"
              >
                <Button
                  variant="link"
                  onClick={handleClick(tenant, rent)}
                  className="justify-start grow p-0 m-0 whitespace-normal text-left"
                >
                  {tenant.name}
                </Button>
                <NumberFormat
                  value={balance}
                  withColor
                  className="font-semibold"
                  abs
                />
              </div>
            ))}
          </div>
        )
      }
    />
  );
}

export default observer(TopUnpaidCard);
