import React from 'react';
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';
import { StoreContext } from '../../../store';
import WarrantyPropertyListItem from './WarrantyPropertyListItem';
import { EmptyIllustration } from '../../../components/Illustrations';
import useTranslation from 'next-translate/useTranslation';

const WarrantyList = observer(() => {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);

  const warranties = store.warranty?.list || [];

  return (
    <div className="warranty-list">
      {warranties.length > 0 ? (
        warranties.map((warranty) => (
          <WarrantyPropertyListItem key={warranty.id} warranty={warranty} />
        ))
      ) : (
        <EmptyIllustration label={t('No warranties found')} />
      )}
    </div>
  );
});

export default WarrantyList;