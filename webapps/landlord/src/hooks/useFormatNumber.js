import { formatNumber } from '../utils/numberformat';
import { StoreContext } from '../store';
import { useContext } from 'react';

export default function useFormatNumber() {
  const store = useContext(StoreContext);

  return (value, style = 'currency', minimumFractionDigits) => {
    if (style === 'currency') {
      return formatNumber(
        store.organization.selected.locale,
        store.organization.selected.currency,
        value,
        minimumFractionDigits
      );
    }

    if (style === 'percent') {
      return Number(value).toLocaleString(store.organization.selected.locale, {
        style: 'percent',
        minimumFractionDigits,
      });
    }
  };
}
