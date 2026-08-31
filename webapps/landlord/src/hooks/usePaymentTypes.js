import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import {
  CardIcon,
  CashIcon,
  ChequeIcon,
  DirectDebitIcon,
  OtherIcon,
  TransferIcon
} from '../components/payment/PaymentIcon';

export default function usePaymentTypes() {
  const t = useTranslations('common');

  return useMemo(() => {
    const itemList = [
      {
        id: 'cheque',
        label: t('Cheque'),
        value: 'cheque',
        renderIcon: () => <ChequeIcon />
      },
      {
        id: 'cash',
        label: t('Cash'),
        value: 'cash',
        renderIcon: () => <CashIcon />
      },
      {
        id: 'direct_debit',
        label: t('Direct debit'),
        value: 'direct_debit',
        renderIcon: () => <DirectDebitIcon />
      },
      {
        id: 'transfer',
        label: t('Transfer'),
        value: 'transfer',
        renderIcon: () => <TransferIcon />
      },
      {
        id: 'card',
        label: t('Card'),
        value: 'card',
        renderIcon: () => <CardIcon />
      },
      {
        id: 'other',
        label: t('Other'),
        value: 'other',
        renderIcon: () => <OtherIcon />
      }
    ];

    return {
      itemList,
      itemMap: itemList.reduce((acc, { id, label, value, renderIcon }) => {
        acc[id] = { label, value, renderIcon };
        return acc;
      }, {})
    };
  }, [t]);
}
