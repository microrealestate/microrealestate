import { Typography, withStyles } from '@material-ui/core';

import { StoreContext } from '../store';
import { useContext } from 'react';

export const formatNumber = (
  locale = 'en',
  currency = 'EUR',
  value,
  minimumFractionDigits = 2
) => {
  return Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits,
  }).format(value);
};

export const useFormatNumber = () => {
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
};

export const NumberFormat = ({
  value,
  minimumFractionDigits = 2,
  style = 'currency',
  withColor,
  ...props
}) => {
  const formatNumber = useFormatNumber();

  const StyledTypography = withStyles((theme) => {
    const classes = {};
    if (withColor && value !== 0) {
      classes.root = {
        color:
          value > 0 ? theme.palette.success.dark : theme.palette.warning.dark,
      };
    }
    return classes;
  })(Typography);

  return (
    <StyledTypography noWrap {...props}>
      {value !== undefined && value != null
        ? formatNumber(value, style, minimumFractionDigits)
        : '--'}
    </StyledTypography>
  );
};
