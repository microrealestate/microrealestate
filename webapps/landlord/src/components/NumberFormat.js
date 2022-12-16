import { Box } from '@material-ui/core';
import useFormatNumber from '../hooks/useFormatNumber';
import { withStyles } from '@material-ui/core/styles';

const PositiveNumber = withStyles((theme) => ({
  root: {
    color: theme.palette.success.dark,
  },
}))(Box);

const NegativeNumber = withStyles((theme) => ({
  root: {
    color: theme.palette.warning.dark,
  },
}))(Box);

export default function NumberFormat({
  value: rawValue,
  minimumFractionDigits = 2,
  style = 'currency',
  withColor,
  debitColor,
  creditColor,
  abs = false,
  showZero = true,
  ...props
}) {
  const formatNumber = useFormatNumber();
  const value = abs ? Math.abs(rawValue) : rawValue;

  if (value === undefined || value === null || rawValue === 0) {
    return (
      <Box whiteSpace="nowrap" {...props}>
        {showZero ? formatNumber(value, style, minimumFractionDigits) : '--'}
      </Box>
    );
  }

  if ((withColor && rawValue < 0) || debitColor) {
    return (
      <NegativeNumber whiteSpace="nowrap" {...props}>
        {formatNumber(value, style, minimumFractionDigits)}
      </NegativeNumber>
    );
  }

  if ((withColor && rawValue >= 0) || creditColor) {
    return (
      <PositiveNumber whiteSpace="nowrap" {...props}>
        {formatNumber(value, style, minimumFractionDigits)}
      </PositiveNumber>
    );
  }

  return (
    <Box whiteSpace="nowrap" {...props}>
      {formatNumber(value, style, minimumFractionDigits)}
    </Box>
  );
}
