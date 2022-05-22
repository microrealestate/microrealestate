import { StoreContext } from '../store';
import { Typography } from '@material-ui/core';
import { useContext } from 'react';
import { withStyles } from '@material-ui/core/styles';

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

const PositiveNumber = withStyles((theme) => ({
  root: {
    color: theme.palette.success.dark,
  },
}))(Typography);

const NegativeNumber = withStyles((theme) => ({
  root: {
    color: theme.palette.warning.dark,
  },
}))(Typography);

export const NumberFormat = ({
  value,
  minimumFractionDigits = 2,
  style = 'currency',
  withColor,
  debitColor,
  creditColor,
  ...props
}) => {
  const formatNumber = useFormatNumber();

  if ((withColor && value < 0) || debitColor) {
    return (
      <NegativeNumber noWrap {...props}>
        {formatNumber(value, style, minimumFractionDigits)}
      </NegativeNumber>
    );
  }

  if ((withColor && value > 0) || creditColor) {
    return (
      <PositiveNumber noWrap {...props}>
        {formatNumber(value, style, minimumFractionDigits)}
      </PositiveNumber>
    );
  }

  return (
    <Typography noWrap {...props}>
      {value !== undefined && value != null
        ? formatNumber(value, style, minimumFractionDigits)
        : '--'}
    </Typography>
  );
};
