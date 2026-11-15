import type { API } from '@microrealestate/shared';
import { observer } from 'mobx-react-lite';
import moment from 'moment';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { LuHistory } from 'react-icons/lu';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { Link } from '@/i18n/navigation';
import { useStore } from '@/providers/StoreProvider';

type Occupant =
  API.Landlord.Property.PropertyWithOccupancyData['occupancyHistory'][number];

function TenantEntry({ occupant }: { occupant: Occupant }) {
  const t = useTranslations('common');
  const occupationDates = t('{beginDate} to {endDate}', {
    beginDate: moment(occupant.beginDate).format('ll'),
    endDate: moment(occupant.endDate).format('ll')
  });

  return (
    <li>
      <Link
        href={`/tenants/${occupant.id}`}
        className="text-base font-medium hover:underline"
      >
        {occupant.name}
      </Link>
      <div className="text-xs text-muted-foreground">{occupationDates}</div>
    </li>
  );
}

function TenantsHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </h3>
  );
}

const PropertyTenantsCard = observer(function PropertyTenantsCard() {
  const t = useTranslations('common');
  const store = useStore();
  const { occupancyHistory = [], status } = (store.property.selected ??
    {}) as Partial<API.Landlord.Property.PropertyWithOccupancyData>;
  const today = moment();
  const current =
    status === 'occupied'
      ? occupancyHistory.find(({ beginDate, endDate }) =>
          today.isBetween(moment(beginDate), moment(endDate), 'day', '[]')
        )
      : undefined;
  const others = occupancyHistory.filter((occupant) => occupant !== current);

  return occupancyHistory.length ? (
    <DashboardCard
      Icon={LuHistory}
      title={t('Tenants')}
      renderContent={() => (
        <section aria-label={t('Tenants')} className="space-y-3 pt-2">
          {current ? (
            <div className="space-y-1">
              <TenantsHeading>{t('Current tenant')}</TenantsHeading>
              <ul>
                <TenantEntry occupant={current} />
              </ul>
            </div>
          ) : null}
          {others.length ? (
            <div className={current ? 'space-y-1 border-t pt-3' : 'space-y-1'}>
              <TenantsHeading>{t('Previous tenants')}</TenantsHeading>
              <ul className="max-h-64 space-y-2 overflow-y-auto">
                {others.map((occupant) => (
                  <TenantEntry key={occupant.id} occupant={occupant} />
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      )}
    />
  ) : null;
});

export default PropertyTenantsCard;
