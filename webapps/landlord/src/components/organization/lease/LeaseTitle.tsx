import { Badge } from '@microrealestate/commonui/components/ui/badge';
import { observer } from 'mobx-react-lite';
import { useTranslations } from 'next-intl';
import { RiContractLine } from 'react-icons/ri';
import ResourceTitle from '@/components/ResourceTitle';
import { useStore } from '@/providers/StoreProvider';

type SelectedLease = {
  _id?: string;
  name?: string;
  active?: boolean;
};

const LeaseTitle = observer(function LeaseTitle() {
  const t = useTranslations('common');
  const store = useStore();
  const { _id, name, active } = (store.lease.selected ?? {}) as SelectedLease;

  return (
    <ResourceTitle
      icon={<RiContractLine className="size-5" aria-hidden="true" />}
      title={_id && name ? name : t('New contract')}
      badge={
        _id && active === false ? (
          <Badge variant="outline">{t('Inactive')}</Badge>
        ) : null
      }
      dataCy="contractTitle"
    />
  );
});

export default LeaseTitle;
