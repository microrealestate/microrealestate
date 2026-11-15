import { Badge } from '@microrealestate/commonui/components/ui/badge';
import { useTranslations } from 'next-intl';

export default function TenantLeaseStatusBadge({
  tenant
}: {
  tenant: { terminated?: boolean };
}) {
  const t = useTranslations('common');

  return (
    <Badge variant={tenant.terminated ? 'secondary' : 'success'}>
      {tenant.terminated ? t('Lease ended') : t('Lease running')}
    </Badge>
  );
}
