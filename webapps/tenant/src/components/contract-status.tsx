import getTranslation from '@/utils/i18n/server/getTranslation';
import { Lease } from '@/types';
import moment from 'moment';
import { StatusBadge } from './ui/status-badge';

export default async function ContractStatus({ lease }: { lease: Lease }) {
  const { t } = await getTranslation();

  const daysLeft = moment(lease.terminationDate || lease.endDate)
    .endOf('days')
    .diff(moment().endOf('days'), 'days');

  if (lease.status === 'active' && daysLeft > 30) {
    return <StatusBadge variant="success">{t('In progress')}</StatusBadge>;
  }

  if (daysLeft <= 0) {
    return <StatusBadge variant="default">{t('Terminated')}</StatusBadge>;
  }

  return (
    <span className="text-base font-semibold text-warning">
      {t(
        '{{days}} days left before termination',
        { days: String(daysLeft) },
        { count: daysLeft }
      )}
    </span>
  );
}
