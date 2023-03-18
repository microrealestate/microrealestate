import { useCallback, useContext } from 'react';

import { formatNumber } from '../utils/numberformat';
import { StoreContext } from '../store';

export default function useFormatNumber() {
  const store = useContext(StoreContext);

  return useCallback(
    (value, style = 'currency', minimumFractionDigits) => {
      if (style === 'currency') {
        return formatNumber(
          store.organization.selected.locale,
          store.organization.selected.currency,
          value,
          minimumFractionDigits
        );
      }

      if (style === 'percent') {
        return Number(value).toLocaleString(
          store.organization.selected.locale,
          {
            style: 'percent',
            minimumFractionDigits,
          }
        );
      }
    },
    [store.organization.selected.currency, store.organization.selected.locale]
  );
}
