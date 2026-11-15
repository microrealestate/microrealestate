import { observer } from 'mobx-react-lite';
import { useTranslations } from 'next-intl';
import ResourceTitle from '@/components/ResourceTitle';
import { useStore } from '@/providers/StoreProvider';
import type { Unit } from './composition';
import PropertyIcon from './PropertyIcon';
import PropertyStatusBadge from './PropertyStatusBadge';

const PropertyTitle = observer(function PropertyTitle() {
  const t = useTranslations('common');
  const store = useStore();
  const selected = store.property.selected as Partial<Unit>;
  const { _id, type, name } = selected;

  return (
    <ResourceTitle
      icon={
        type ? (
          <PropertyIcon type={type} className="size-5" aria-hidden="true" />
        ) : null
      }
      title={_id && name ? name : t('Add a property')}
      badge={_id ? <PropertyStatusBadge property={selected as Unit} /> : null}
      dataCy="propertyTitle"
    />
  );
});

export default PropertyTitle;
