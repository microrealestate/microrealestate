import {
  LuBuilding2,
  LuClipboardList,
  LuDollarSign,
  LuFileText,
  LuWrench
} from 'react-icons/lu';
import { useContext, useMemo } from 'react';

import { cn } from '../../utils';
import { DashboardCard } from './DashboardCard';
import NumberFormat from '../NumberFormat';
import { StoreContext } from '../../store';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';

function CityRentIcon() {
  return (
    <span className="relative inline-flex size-6 items-center justify-center text-muted-foreground">
      <LuBuilding2 className="size-6" />
      <LuDollarSign className="absolute -bottom-1 -right-1 size-3 rounded-full bg-background text-emerald-600" />
    </span>
  );
}

function FeatureUpdates({ className, utilities = [], projects = [] }) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const store = useContext(StoreContext);

  const activeProjectsCount = useMemo(
    () =>
      (projects || []).filter(
        (project) => !['completed', 'cancelled'].includes(project.status)
      ).length,
    [projects]
  );

  const utilitiesTotal = useMemo(
    () =>
      (utilities || []).reduce(
        (sum, utility) => sum + Number(utility.amount || 0),
        0
      ),
    [utilities]
  );

  const orgName = store.organization.selected.name;

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 gap-4', className)}>
      <DashboardCard
        Icon={LuWrench}
        title={t('Utilities')}
        description={t('All utility bills and categories')}
        renderContent={() => (
          <div className="space-y-1">
            <div>{utilities.length}</div>
            <div className="text-sm font-normal text-muted-foreground">
              <NumberFormat value={utilitiesTotal} showZero={true} />
            </div>
          </div>
        )}
        onClick={() => router.push(`/${orgName}/utilities`)}
        className="text-end"
      />

      <DashboardCard
        Icon={LuClipboardList}
        title={t('Projects')}
        description={t('Track project pipeline and statuses')}
        renderContent={() => activeProjectsCount}
        onClick={() => router.push(`/${orgName}/projects`)}
        className="text-end"
      />

      <DashboardCard
        Icon={CityRentIcon}
        title={t('City rent estimates')}
        description={t('Manage rent ranges by city')}
        renderContent={() => t('Open')}
        onClick={() => router.push(`/${orgName}/properties/rent-estimates`)}
        className="text-end"
      />

      <DashboardCard
        Icon={LuFileText}
        title={t('Property files and info')}
        description={t('Access files, photos, and utility tabs')}
        renderContent={() => t('Browse')}
        onClick={() => router.push(`/${orgName}/properties`)}
        className="text-end"
      />
    </div>
  );
}

export default FeatureUpdates;
