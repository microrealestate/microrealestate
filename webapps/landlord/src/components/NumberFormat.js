import { Typography } from '@material-ui/core';
import useFormatNumber from '../hooks/useFormatNumber';
import { withStyles } from '@material-ui/core/styles';

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

export default function NumberFormat({
  value,
  minimumFractionDigits = 2,
  style = 'currency',
  withColor,
  debitColor,
  creditColor,
  ...props
}) {
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
}
