import { useMemo } from 'react';
import useTranslation from 'next-translate/useTranslation';

export default function usePaymentTypes() {
  const { t } = useTranslation('common');

  return useMemo(() => {
    const itemList = [
      {
        id: 'cheque',
        label: t('Cheque'),
        value: 'cheque',
      },
      {
        id: 'cash',
        label: t('Cash'),
        value: 'cash',
      },
      {
        id: 'levy',
        label: t('Levy'),
        value: 'levy',
      },
      {
        id: 'transfer',
        label: t('Transfer'),
        value: 'transfer',
      },
    ];

    return {
      itemList,
      itemMap: itemList.reduce((acc, { id, label, value }) => {
        acc[id] = { label, value };
        return acc;
      }, {}),
    };
  }, [t]);
}
