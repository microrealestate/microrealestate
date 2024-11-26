import { EmptyIllustration } from '../Illustrations';
import TenantListItem from './TenantListItem';
import useTranslation from 'next-translate/useTranslation';

export default function TenantList({ tenants }) {
  const { t } = useTranslation('common');

  return tenants.length > 0 ? (
    <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {tenants.map((tenant) => (
        <TenantListItem key={tenant._id} tenant={tenant} />
      ))}
    </div>
  ) : (
    <EmptyIllustration label={t('No tenants found')} />
  );
}
