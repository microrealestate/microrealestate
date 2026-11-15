import { observer } from 'mobx-react-lite';
import { useTranslations } from 'next-intl';
import { LuCircleUser } from 'react-icons/lu';
import ResourceTitle from '@/components/ResourceTitle';
import { useStore } from '@/providers/StoreProvider';
import TenantLeaseStatusBadge from './TenantLeaseStatusBadge';

type SelectedTenant = {
  _id?: string;
  name?: string;
  beginDate?: string;
  terminated?: boolean;
};

const TenantTitle = observer(function TenantTitle() {
  const t = useTranslations('common');
  const store = useStore();
  const selected = (store.tenant.selected ?? {}) as SelectedTenant;
  const { _id, name, beginDate } = selected;

  return (
    <ResourceTitle
      icon={<LuCircleUser className="size-5" aria-hidden="true" />}
      title={_id && name ? name : t('Add a tenant')}
      badge={
        _id && beginDate ? <TenantLeaseStatusBadge tenant={selected} /> : null
      }
      dataCy="tenantTitle"
    />
  );
});

export default TenantTitle;
